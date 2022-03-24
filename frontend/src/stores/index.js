import { createStore } from 'vuex'
import axios from 'axios'
import analytics from '../analytics'
import errorReporter from './plugins/error_reporter'
import query from './modules/query'
import item from './modules/item'
import shelf from './modules/shelf'
import sort from './modules/sort'
import * as utils from '../utils'
import { getField, updateField } from 'vuex-map-fields'

export default createStore({
   state: {
      noSpinner: false,
      searching: false,
      pageSize: 20,
      results: [],
      suggestions: [],
      total: -1,
      autoExpandGroupID: "",
      selectedResultsIdx: -1,
      selectedHitIdx: -1,
      selectedHitGroupIdx: -1,
      lastSearchScrollPosition: 0,
      lastSearchURL: "",
      otherSrcSelection: { id: "", name: "" },
   },

   getters: {
      getField,
      selectedHit: state => {
         if ( state.selectedResultsIdx == -1 || state.selectedHitIdx == -1) {
            return {}
         }
         let hit = state.results[state.selectedResultsIdx].hits[state.selectedHitIdx]
         if (hit.grouped && state.selectedHitGroupIdx > -1 ) {
            return hit.group[state.selectedHitGroupIdx]
         }
         return hit
      },
      nextHitAvailable: (state, getters) => {
         if ( state.selectedResultsIdx == -1 || state.selectedHitIdx == -1 || state.searching == true) {
            return false
         }
         return getters.selectedHit.number < getters.selectedResults.total
      },
      prevHitAvailable: (state, getters) => {
         if ( state.selectedResultsIdx == -1 || state.selectedHitIdx == -1 || state.searching == true) {
            return false
         }
         return getters.selectedHit.number > 1
      },
      hasResults: state => {
         return state.total >= 0
      },
      selectedResults: state => {
         if (state.selectedResultsIdx === -1) {
            return { total: 0, hits: [], pool: { description: "", id: "none", name: "None", summary: "", url: "" } }
         }
         return state.results[state.selectedResultsIdx]
      },
      hasMoreHits: state => {
         if (state.selectedResultsIdx === -1 || state.searching) {
            return false
         }
         let tgtResults = state.results[state.selectedResultsIdx]
         let resultsCnt = 0
         tgtResults.hits.forEach( r => {
            if (r.grouped) {
               resultsCnt += r.count
            } else {
               resultsCnt++
            }
         })
         return tgtResults.total > resultsCnt
      },
   },

   mutations: {
      updateField,
      hitSelected(state, identifier) {
         state.selectedHitIdx = -1
         state.selectedHitGroupIdx = -1
         if ( state.selectedResultsIdx == -1) return

         state.results[state.selectedResultsIdx].hits.some( (h,idx) => {
            if (h.identifier == identifier) {
               state.selectedHitIdx = idx
            } else if ( h.grouped == true) {
               let gIdx = h.group.findIndex( g => g.identifier == identifier)
               if ( gIdx > -1 ) {
                  state.selectedHitIdx = idx
                  state.selectedHitGroupIdx = gIdx
               }
            }
            return state.selectedHitIdx != -1
          })
          if ( state.selectedHitIdx != -1 ) {
             // this also gets called on from details page. Only update last if route is home or search
            if (this.router.currentRoute.value.path == "/search" ||  this.router.currentRoute.value.path == "/") {
               state.lastSearchURL = this.router.currentRoute.value.fullPath
               state.lastSearchScrollPosition = window.scrollY
            }
          }
      },
      nextHit(state) {
         if ( state.selectedResultsIdx == -1 || state.selectedHitIdx == -1) return
         let currHit = state.results[state.selectedResultsIdx].hits[state.selectedHitIdx]
         if ( currHit.grouped) {
            if ( state.selectedHitGroupIdx == currHit.group.length-1) {
               state.selectedHitIdx++
               state.selectedHitGroupIdx = -1
            } else {
               state.selectedHitGroupIdx++
            }
         } else {
            state.selectedHitIdx++
         }
      },
      priorHit(state) {
         if ( state.selectedResultsIdx == -1 || state.selectedHitIdx == -1) return
         let currHit = state.results[state.selectedResultsIdx].hits[state.selectedHitIdx]

         // are we currently on a grouped result and not on the head?
         if ( currHit.grouped && state.selectedHitGroupIdx >= 0) {
            // just go to prior item in the group
            state.selectedHitGroupIdx--
         } else {
            // paging back to a new hit; must check if it is grouped and select
            // the last member of the group if so
            state.selectedHitGroupIdx = -1
            state.selectedHitIdx--
            currHit = state.results[state.selectedResultsIdx].hits[state.selectedHitIdx]
            if ( currHit.grouped ) {
               state.selectedHitGroupIdx = currHit.group.length-1
            }
         }
      },
      setAutoExpandGroupID(state, id) {
         state.autoExpandGroupID = id
      },
      setSearching(state, flag) {
         if (state.noSpinner) {
            state.noSpinner = false
         } else {
            state.searching = flag
         }
      },
      updateOtherPoolLabel(state) {
         // when a pool is selected from the 'Other' tab and a filter has been applied
         // this method method is used to update the count in the tab label
         if (state.otherSrcSelection.id == "") return
         let res = state.results.find(r => r.pool.id == state.otherSrcSelection.id)
         let name = `<span class='pool'>${res.pool.name}</span>`
         name += `<span class='total'>${res.total} hits</span>`
         state.otherSrcSelection.name = name
      },

      selectPoolResults(state, data) {
         let resultIdx = data.resultIdx
         let maxTabs = data.maxTabs
         let otherIdx = maxTabs - 2 // -1 xero index and -1 for 'other'
         state.selectedResultsIdx = resultIdx

         if (resultIdx > otherIdx && state.otherSrcSelection.id == "") {
            // this happens when a search is restored. otherSrcSelection is used
            // to drive the selected option in the other sources tab. Make sure it is
            /// set correctly
            let r = state.results[resultIdx]
            let name = `<span class='pool'>${r.pool.name}</span>`
            name += `<span class='total'>${r.total} hits</span>`
            let sel = { id: r.pool.id, name: name, disabled: false }
            state.otherSrcSelection = sel
         }
      },

      clearSelectedPoolResults(state) {
         // When the results are cleared, reset pagination, remove pool
         // total from overal total and reset pool total to 0
         let tgtPool = state.results[state.selectedResultsIdx]
         let oldPoolTotal = tgtPool.total
         tgtPool.total = 0
         tgtPool.page = 0
         state.results[state.selectedResultsIdx].hits = []
         state.total -= oldPoolTotal
         state.lastSearchScrollPosition = 0
         state.lastSearchURL = ""
      },

      addPoolSearchResults(state, poolResults) {
         let tgtPool = state.results[state.selectedResultsIdx]
         if ( !tgtPool) {
            let result = {
               pool: poolResults.pool,
               sort: poolResults.sort,
               total: poolResults.pagination.total,
               page: 0,
               timeMS: poolResults.elapsed_ms,
               hits: [],
               statusCode: poolResults.status_code, statusMessage: poolResults.status_msg
            }
            state.results.push(result)
            state.selectedResultsIdx = 0
            state.otherSrcSelection = { id: "", name: "" }
            state.total = poolResults.pagination.total
            tgtPool = state.results[0]
         } else {
            // Update total
            tgtPool.total = poolResults.pagination.total
            // Only update overall total when paging if searching 1 pool.
            if(state.results.length == 1){
               state.total = poolResults.pagination.total
            }
         }
         let lastHit = tgtPool.hits[tgtPool.hits.length-1]

         // When a facet is applied, the results are cleared and there is no last hit
         let hitNumber = 1
         if (lastHit) {
            hitNumber = lastHit.number+1
            if (lastHit.grouped) {
               hitNumber = lastHit.group[lastHit.group.length-1].number+1
            }
         }

         tgtPool.timeMS = poolResults.elapsed_ms
         tgtPool.statusCode = 200
         tgtPool.statusMessage = ""
         if (tgtPool.total == 0) {
            // if pool total is zero add the new results total to overall
            tgtPool.total = poolResults.pagination.total
            state.total += poolResults.pagination.total
         }

         if (poolResults.group_list) {
            poolResults.group_list.forEach(group => {
               utils.preProcessHitFields(tgtPool.pool.url, group.record_list)
               if (group.count == 1) {
                  let hit = group.record_list[0]
                  hit.grouped = false
                  hit.count = 1
                  hit.number = hitNumber
                  tgtPool.hits.push(hit)
                  hitNumber++
               } else {
                  let hit = { grouped: true, count: group.count, number: hitNumber, group: group.record_list }
                  utils.getGroupHitMetadata(group, hit)
                  tgtPool.hits.push(hit)
                  hitNumber+=group.count
               }
            })
         }
      },

      setSearchResults(state, data) {
         // this is called from top level search; resets results from all pools
         state.total = -1
         state.results.splice(0, state.results.length)
         let firstPoolWithHits = -1
         let tgtPoolIdx = -1

         data.results.pool_results.forEach((pr, idx) => {
            if (!pr.group_list) {
               pr.group_list = []
            }

            // reset hit counter for each pool
            let hitNum = 1

            // if a preffered pool was set in prefs (or url) track its index in results
            // so it can be selected after all results are updated
            if (pr.pool_id == data.tgtPool) {
               tgtPoolIdx = idx
            }

            // Find the pool the results are associated with and populate some top level response info
            let pool = data.results.pools.find(p => p.id == pr.pool_id)
            let result = {
               pool: pool, sort: pr.sort, total: pr.pagination.total, page: 0, timeMS: pr.elapsed_ms,
               hits: [], statusCode: pr.status_code, statusMessage: pr.status_msg
            }
            if (firstPoolWithHits == -1 && pr.pagination.total > 0) {
               firstPoolWithHits = idx
            }

            // Next, drill into group_list data. It contains a count and a record_list
            // record list is a list of fields in the hit. field is {name,label,type,value,visibility,display}
            pr.group_list.forEach(group => {

               let poolObj = state.pools.list.find( p => p.id == pr.pool_id)

               // for each hit in the list, merge repeated fields into arrays, pull out
               // key fields like identifer to top-level named field and split others into basic and detail
               if (group.record_list) {
                  utils.preProcessHitFields(poolObj.url, group.record_list)
               }

               // Different handling for grouped and single items
               if (group.count == 1) {
                  let hit = group.record_list[0]
                  hit.grouped = false
                  hit.count = 1
                  hit.number = hitNum
                  result.hits.push(hit)
                  hitNum++
               } else {
                  let hit = { grouped: true, count: group.count, number: hitNum }
                  utils.getGroupHitMetadata(group, hit)
                  result.hits.push(hit)
                  hitNum += group.count
               }
            })

            state.results.push(result)
         })

         if (tgtPoolIdx > -1) {
            state.selectedResultsIdx = tgtPoolIdx
         } else {
            if (firstPoolWithHits == -1) {
               firstPoolWithHits = 0
            }
            state.selectedResultsIdx = firstPoolWithHits
            state.otherSrcSelection = { id: "", name: "" }
         }

         state.total = data.results.total_hits
      },

      setSuggestions(state, data) {
         state.suggestions.splice(0, state.suggestions.length)
         data.forEach(d => {
            state.suggestions.push(d)
         })
      },

      incrementPage(state) {
         state.noSpinner = true
         state.results[state.selectedResultsIdx].page++
      },

      setPage(state, pageOveride) {
         state.noSpinner = true
         state.results[state.selectedResultsIdx].page = pageOveride
      },

      resetSearchResults(state) {
         state.results.splice(0, state.results.length)
         state.total = -1
         state.lastSearchScrollPosition = 0
         state.lastSearchURL = ""
         state.selectedHitIdx = -1
         state.selectedHitGroupIdx = -1
         state.selectedResultsIdx = -1
         state.otherSrcSelection = { id: "", name: "" }
      },
      clearLastSearch(state) {
         state.lastSearchScrollPosition = 0
         state.lastSearchURL = ""
      },
   },

   actions: {
      resetSearch( ctx ) {
         ctx.commit("resetSearchResults")
         ctx.commit('query/resetAdvancedForm')
         ctx.commit('query/clear')
         ctx.commit('filters/reset')
         ctx.commit('sort/reset')
         ctx.commit("collection/clearCollectionDetails")
         if ( ctx.rootGetters["preferences/hasSearchTemplate"] ) {
            ctx.commit("query/setTemplate", ctx.rootState.preferences.searchTemplate)
         }
      },
      async moreResults(ctx) {
         ctx.commit('incrementPage')
         let sr = ctx.rootGetters.selectedResults
         let params = {
            pool: sr.pool,
            page: sr.page
         }
         await ctx.dispatch("searchPool", params)
      },
      async nextHit(ctx) {
         if ( ctx.state.selectedHitIdx == -1 || ctx.state.selectedResultsIdx == -1 ) return

         // is this the last hit in the currently available results?
         let tgtResults = ctx.getters.selectedResults
         if ( ctx.state.selectedHitIdx == tgtResults.hits.length-1 ) {
            if (ctx.getters.hasMoreHits == false) {
               let currHit= ctx.getters.selectedHit
               if (currHit.grouped ) {
                  if (ctx.state.selectedHitGroupIdx == currHit.group.length-1 ) {
                     // last grouped hit. done
                     return
                  }
               } else {
                  // last hit. done.
                  return
               }
            } else {
               await ctx.dispatch( "moreResults")
            }
         }

         ctx.commit("nextHit")

      },
      async priorHit(ctx) {
         ctx.commit("priorHit")
      },

      // Search ALL configured pools. This is the initial search call using only the basic or
      // advanced search parameters and will always start at page 1.
      // CTX: commit: ƒ boundCommit(type, payload, options)
      async searchAllPools({ state, commit, rootState, rootGetters, dispatch }) {
         commit('system/clearMessage')
         let req = {
            query: rootGetters['query/string'],
            pagination: { start: 0, rows: state.pageSize },
            filters: rootGetters['filters/allPoolFilters'],
            pool_sorting: rootState.sort.pools
         }

         if (req.query == "") {
            let err = {message: 'EMPTY QUERY', caller: 'searchAllPools', query: rootGetters['query/getState']}
            dispatch("system/reportError", err)
         }

         commit('setSearching', true)
         commit("clearLastSearch")

         // POST the search query and wait for the response
         await axios.post(`${rootState.system.searchAPI}/api/search`, req).then((response) => {
            commit('pools/setPools', response.data.pools)
            commit('setSearchResults', { results: response.data, tgtPool: rootState.query.targetPool })
            commit('sort/setActivePool', state.results[state.selectedResultsIdx].pool.id)
            commit('setSuggestions', response.data.suggestions)
            if (state.otherSrcSelection.id != "") {
               commit('updateOtherPoolLabel')
            }
            commit('setSearching', false)
            if ( response.data.total_hits == 0) {
               analytics.trigger('Results', 'NO_RESULTS', this.router.currentRoute.value.fullPath)
            }
         }).catch((error) => {
            console.error("SEARCH FAILED: " + error)
            commit('setSearching', false)
            if (error.response && error.response.status != 401) {
               if (error.response && error.response.data && error.response.data.message) {
                  let msg =  error.response.data.message
                  msg += "<p>We regret the inconvenience. If this problem persists, "
                  msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a></p>"
                  let err = {
                     message: msg,
                     detail: error.response.data.details
                  }
                  commit('system/setSearchError', err)
               } else {
                  let msg = "System error, we regret the inconvenience. If this problem persists, "
                  msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a>"
                  commit('system/setError', msg)
                  dispatch("system/reportError", error)
               }
            }
         })
      },

      // searchPool wil search only the pool specified. It can be used to filter, sort and page
      // existing results or as a standalone query to a single pool
      async searchPool({ state, commit, rootState, rootGetters, dispatch }, params) {
         commit('setSearching', true)
         let filters = rootGetters['filters/poolFilter'](params.pool.id)
         let sort = rootGetters['sort/poolSort'](params.pool.id)
         let filterObj = { pool_id: params.pool.id, facets: filters }
         let startPage = params.page
         if (!startPage) {
            startPage = 0
         }
         let pagination = { start: startPage * state.pageSize, rows: state.pageSize }

         let req = {
            query: rootGetters['query/string'],
            pagination: pagination,
            sort: sort,
            filters: [filterObj]
         }

         if (req.query == "") {
            let err = {message: 'EMPTY QUERY', caller: 'searchSelectedPool', query: rootGetters['query/getState']}
            dispatch("system/reportError", err)
         }

         let url = params.pool.url + "/api/search"
         await axios.post(url, req).then( response => {
            if ( startPage == 0 ) {
               // when single pool seach is called to start a search, pool is required in response.
               let pool = rootState.pools.list.find( p => p.id == params.pool.id)
               response.data.pool = pool
            }

            // Note: for pagination, filtering, etc, the existing pool results will be appended.
            // if this is a direct single pool search, there will be no existing results. This call
            // will create them.
            commit('addPoolSearchResults', response.data)
            if ( response.data.pagination.total == 0 ) {
               analytics.trigger('Results', 'NO_RESULTS', this.router.currentRoute.value.fullPath)
            }

            commit('setSearching', false)
            if (state.otherSrcSelection.id != "") {
               commit('updateOtherPoolLabel')
            }
         }).catch((error) => {
            console.error("SINGLE POOL SEARCH FAILED: " + JSON.stringify(error))
            commit('setSearching', false)
            if (error.response && error.response.status == 400) {
               let msg = "This query is malformed or unsupported. Please ensure that all quotes and parenthesis are matched."
               msg += "<p>We regret the inconvenience. If this problem persists, "
               msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a></p>"
               let err = {
                  message: msg,
               }
               commit('system/setSearchError', err)
            } else if (error.response && error.response.status != 401) {
               let msg = "System error, we regret the inconvenience. If this problem persists, "
               msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a>"
               commit('system/setError', msg)
               dispatch("system/reportError", error)
            }
         })
      },

      // Select pool results and get all facet info for the result
      selectPoolResults(ctx, resultIdx) {
         if (ctx.state.selectedResultsIdx != resultIdx) {
            let data = {resultIdx: resultIdx, maxTabs: ctx.rootState.preferences.maxTabs }
            ctx.commit('selectPoolResults', data)
            ctx.commit('sort/setActivePool', ctx.state.results[ctx.state.selectedResultsIdx].pool.id)
         }
      },
   },

   modules: {
      item: item,
      query: query,
      shelf: shelf,
      sort: sort,
   },

   plugins: [
      errorReporter
   ]
})
