import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import versionChecker from './plugins/version'
import expiredSessionWatcher from './plugins/expired'
import bookmarks from './modules/bookmarks'
import system from './modules/system'
import pools from './modules/pools'
import user from './modules/user'
import query from './modules/query'
import filters from './modules/filters'
import item from './modules/item'
import reserves from './modules/reserves'
import preferences from './modules/preferences'
import journals from './modules/journals'
import feedback from './modules/feedback'
import restore from './modules/restore'
import requests from './modules/requests'
import searches from './modules/searches'
import sort from './modules/sort'
import * as utils from './modules/utils'
import { getField, updateField } from 'vuex-map-fields'
import router from '../router'

Vue.use(Vuex)

export default new Vuex.Store({
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
      otherSrcSelection: { id: "", name: "" }
   },

   getters: {
      getField,
      selectedHitIdentifier: state => {
         if ( state.selectedResultsIdx == -1 || state.selectedHitIdx == -1) {
            return ""
         }
         return state.results[state.selectedResultsIdx].hits[state.selectedHitIdx].identifier
      },
      nextHitAvailable: state => {
         if ( state.selectedResultsIdx == -1 || state.selectedHitIdx == -1) {
            return false
         }
         let tgtResults = state.results[state.selectedResultsIdx]
         return state.selectedHitIdx < tgtResults.total-1
      },
      prevHitAvailable: state => {
         if ( state.selectedResultsIdx == -1 || state.selectedHitIdx == -1) {
            return false
         }
         return state.selectedHitIdx > 0
      },
      hasResults: state => {
         return state.total >= 0
      },
      selectedResultsIdx: state => {
         return state.selectedResultsIdx
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
         return tgtResults.total > tgtResults.hits.length
      },
   },

   mutations: {
      updateField,
      hitSelected(state, identifier) {
         state.selectedHitIdx = -1
         state.results[state.selectedResultsIdx].hits.some( (h,idx) => {
            if (h.identifier == identifier) {
               state.selectedHitIdx = idx
            } else if ( h.grouped == true) {
               let gIdx = h.group.findIndex( g => g.identifier == identifier)
               if ( gIdx > -1 ) {
                  state.selectedHitIdx = idx
               }
            }
            return state.selectedHitIdx != -1
          })
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

      selectPoolResults(state, resultIdx) {
         state.selectedResultsIdx = resultIdx

         if (resultIdx > 1 && state.otherSrcSelection.id == "") {
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
      },

      toggleGroupExpanded(state, hitIdx) {
         let group = state.results[state.selectedResultsIdx].hits[hitIdx]
         group.expanded = !group.expanded
      },

      addPoolSearchResults(state, poolResults) {
         let tgtPool = state.results[state.selectedResultsIdx]
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
               utils.preProcessHitFields(group.record_list)
               if (group.count == 1) {
                  let hit = group.record_list[0]
                  hit.grouped = false
                  tgtPool.hits.push(hit)
               } else {
                  let hit = { grouped: true, count: group.count, group: group.record_list }
                  utils.getGroupHitMetadata(group, hit)
                  tgtPool.hits.push(hit)
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

               // for each hit in the list, merge repeated fields into arrays, pull out
               // key fields like identifer to top-level named field and split others into basic and detail
               if (group.record_list) {
                  utils.preProcessHitFields(group.record_list)
               }

               // Different handling for grouped and single items
               if (group.count == 1) {
                  let hit = group.record_list[0]
                  hit.grouped = false
                  result.hits.push(hit)
               } else {
                  let hit = { grouped: true, expanded: false, count: group.count }
                  utils.getGroupHitMetadata(group, hit)
                  result.hits.push(hit)
               }
            })

            state.results.push(result)
         })

         if (tgtPoolIdx > -1) {
            state.selectedResultsIdx = tgtPoolIdx
            if (tgtPoolIdx > 1) {
               state.otherSrcSelection = { id: data.tgtPool, name: "" }
            }
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
         state.selectedResultsIdx = -1
         state.otherSrcSelection = { id: "", name: "" }
      },
   },

   actions: {
      resetSearch( ctx ) {
         ctx.commit("resetSearchResults")
         ctx.commit('query/clear')
         ctx.commit('filters/reset')
         ctx.commit('sort/reset')
      },
      moreResults(ctx) {
         ctx.commit('incrementPage')
         return ctx.dispatch("searchSelectedPool")
      },
      async nextHit(ctx) {
         if ( ctx.state.selectedHitIdx == -1 || ctx.state.selectedResultsIdx == -1 ) return

         let tgtResults = ctx.state.results[ctx.state.selectedResultsIdx]
         if (ctx.state.selectedHitIdx == tgtResults.total-1) return

         if ( ctx.state.selectedHitIdx == tgtResults.hits.length-1) {
            ctx.commit( "item/clearDetails", null, {root:true})
            await ctx.dispatch( "moreResults")
         }

         // NOTE this skips groups
         ctx.state.selectedHitIdx++

      },
      async priorHit(ctx) {
         if ( ctx.state.selectedHitIdx <= 0) return
         // Note: this skips groups
         ctx.state.selectedHitIdx--
      },

      // Search ALL configured pools. This is the initial search call using only the basic or
      // advanced search parameters and will always start at page 1.
      // If isRestore is true, the spinner will not be cleared after the search
      // CTX: commit: ƒ boundCommit(type, payload, options)
      async searchAllPools({ state, commit, rootState, rootGetters, dispatch }) {
         commit('system/setError', "")
         let req = {
            query: rootGetters['query/string'],
            pagination: { start: 0, rows: state.pageSize },
            preferences: {
               target_pool: rootState.query.targetPool,
               exclude_pool: rootState.query.excludedPools
            },
            filters: rootGetters['filters/allPoolFilters'],
            pool_sorting: rootState.sort.pools
         }

         if (rootState.query.mode == "basic" && rootState.query.basicSearchScope.id != "all") {
            let tgtID = rootState.query.basicSearchScope.id
            req.preferences.exclude_pool = []
            rootState.pools.list.forEach(src => {
               if (src.id != tgtID) {
                  req.preferences.exclude_pool.push(src.id)
               } else {
                  req.preferences.target_pool = src.id
               }
            })
         }

         commit('setSearching', true)
         if (rootGetters["user/isSignedIn"]) {
            await dispatch("user/refreshAuth")
            // make sure bookmarks are up to date when
            // searching so the UI can show the correct status per item
            dispatch("bookmarks/getBookmarks")
         }

         let url = state.system.searchAPI + "/api/search"
         try {
            // POST the search query and wait for the response
            let response = await axios.post(url, req)
            commit('pools/setPools', response.data.pools)
            commit('setSearchResults', { results: response.data, tgtPool: rootState.query.targetPool })
            commit('sort/setActivePool', state.results[state.selectedResultsIdx].pool.id)
            commit('setSuggestions', response.data.suggestions)
            if (state.otherSrcSelection.id != "") {
               commit('updateOtherPoolLabel')
            }

            // make sure the currently selected pool is always in URL
            let query = Object.assign({}, router.currentRoute.query)
            if (query.pool != rootGetters.selectedResults.pool.id) {
               query.pool = rootGetters.selectedResults.pool.id
               router.replace({ query })
            }

            commit('setSearching', false)

            dispatch("searches/updateHistory")
            return dispatch("filters/getSelectedResultFacets")
         } catch (error) {
            console.error("SEARCH FAILED: " + error)
            commit('setSearching', false)
            commit('filters/setUpdatingFacets', false)
            if (error.response && error.response.status == 401) {
               commit('system/setSessionExpired', null, { root: true })
               dispatch("user/signout", "/", { root: true })
            } else {
               let msg = "System error, we regret the inconvenience. If this problem persists, "
               msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a>"
               commit('system/setError', msg)
            }
         }
      },

      // SearchSelectedPool is called only when one specific set of pool results is selected for
      // exploration. It is used to query for next page during load more, filter change and sort change.
      // Pool results are APPENDED to existing after load more, and reset for other searches.
      async searchSelectedPool({ state, commit, _rootState, rootGetters, dispatch }) {
         commit('setSearching', true)
         commit('filters/setUpdatingFacets', true)
         let tgtResults = rootGetters.selectedResults
         let filters = rootGetters['filters/poolFilter'](tgtResults.pool.id)
         let sort = rootGetters['sort/poolSort'](tgtResults.pool.id)
         let filterObj = { pool_id: tgtResults.pool.id, facets: filters }
         let pagination = { start: tgtResults.page * state.pageSize, rows: state.pageSize }

         let req = {
            query: rootGetters['query/string'],
            pagination: pagination,
            sort: sort,
            filters: [filterObj]
         }

         if (rootGetters["user/isSignedIn"]) {
            await dispatch("user/refreshAuth")
         }

         let url = tgtResults.pool.url + "/api/search"
         try {
            let response = await axios.post(url, req)
            commit('addPoolSearchResults', response.data)
            commit('setSearching', false)
            if (state.otherSrcSelection.id != "") {
               commit('updateOtherPoolLabel')
            }

            dispatch("searches/updateHistory")
            return dispatch("filters/getSelectedResultFacets")
         } catch (error) {
            console.error("SINGLE POOL SEARCH FAILED: " + error)
            commit('setSearching', false)
            commit('filters/setUpdatingFacets', false)
            if (error.response && error.response.status == 401) {
               commit('system/setSessionExpired', null, { root: true })
               dispatch("user/signout", "/", { root: true })
            } else {
               let msg = "System error, we regret the inconvenience. If this problem persists, "
               msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a>"
               commit('system/setError', msg)
            }
         }
      },

      // Select pool results and get all facet info for the result
      async selectPoolResults(ctx, resultIdx) {
         if (ctx.state.selectedResultsIdx != resultIdx) {
            if (ctx.rootGetters["user/isSignedIn"]) {
               await ctx.dispatch("user/refreshAuth")
            }
            ctx.commit('selectPoolResults', resultIdx)
            ctx.commit('sort/setActivePool', ctx.state.results[ctx.state.selectedResultsIdx].pool.id)
            await ctx.dispatch("filters/getSelectedResultFacets", null, { root: true })
         }
      },
   },

   modules: {
      bookmarks: bookmarks,
      filters: filters,
      item: item,
      journals: journals,
      pools: pools,
      preferences: preferences,
      query: query,
      reserves: reserves,
      system: system,
      user: user,
      feedback: feedback,
      restore: restore,
      requests: requests,
      searches: searches,
      sort: sort,
   },

   plugins: [versionChecker, expiredSessionWatcher]
})
