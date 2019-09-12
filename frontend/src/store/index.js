import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import messaging from './plugins/messaging'
import versionChecker from './plugins/version'
import system from './modules/system'
import pools from './modules/pools'
import user from './modules/user'
import query from './modules/query'
import filters from './modules/filters'
import * as utils from './modules/utils'
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    noSpinner: false,
    searching: false,
    pageSize: 25,
    results: [],
    total: -1,
    visibleResults: [],
    selectedResultsIdx: -1,
  },

  getters: {
    hasResults: state => {
      return state.total >= 0
    },
    visibleResults: state => {
      let out = [] 
      state.visibleResults.forEach(function (idx) {
        out.push(state.results[idx])
      })
      return out
    },
    selectedResults: state => {
      if (state.selectedResultsIdx === -1 ) {
        return {total: 0, hits: [], pool: {description:"", id:"none", name:"None", summary: "", url: ""}}
      }
      return state.results[state.selectedResultsIdx]
    },
    hasMoreHits: state => {
      if (state.selectedResultsIdx === -1 || state.searching  ) {
        return false
      }
      let tgtResults = state.results[state.selectedResultsIdx]
      return tgtResults.total > tgtResults.hits.length
    },
    hitPoolCount: state => {
      let poolCnt = 0
      state.results.forEach(function(p) {
        if (p.total > 0) {
          poolCnt++
        }
      })
      return poolCnt
    },
    skippedPoolCount: state => {
      let poolCnt = 0
      state.results.forEach(function(p) {
        if (p.total == 0 && p.statusCode == 408) {
          poolCnt++
        }
      })
      return poolCnt
    },
    failedPoolCount: state => {
      let poolCnt = 0
      state.results.forEach(function(p) {
        // no results, not OK code and not timeout code. Must be pool error
        if (p.total == 0 && p.statusCode != 200 && p.statusCode != 408) {
          poolCnt++
        }
      })
      return poolCnt
    },
    getItemDetails: state => (pool,identifier) => {
      let foundPool = false
      let details = null 
      state.results.some( result => {
        if (result.pool.id == pool) {
          foundPool = true 
          result.hits.some( hit=> {
            if (hit.identifier == identifier) {
              details = hit  
            }
            return details != null  
          })
        }
        return foundPool == true
      })
      return details
    }
  },

  mutations: {
    setSearching(state, flag) {
      if (state.noSpinner ) {
        state.noSpinner = false
      } else {
        state.searching = flag
      }
    },
    selectPoolResults(state, visiblePoolIdx) {
      // User has selected a visible set of results to explore further. Convert
      // the visibleIndex into a results index and set it as seleceted
      let idx = state.visibleResults[visiblePoolIdx]
      state.selectedResultsIdx = idx
    },
    closePoolResults(state) {
      state.selectedResultsIdx = -1
    },
    toggleResultVisibility(state, poolResultsIdx) {
      // Don't change visibility if there are no results to see -- unless the pool timed out
      if (state.results[poolResultsIdx].total == 0 && state.results[poolResultsIdx].statusCode != 408) {
        return
      }
      // NOTES: the result itself is tagged with show true/false for ease of detecting
      // which results are showing. A separate visibleResults array tracks the order 
      // that pools were selected to be seen.
      state.results[poolResultsIdx]["show"] = !state.results[poolResultsIdx]["show"]
      let visibleIdx = state.visibleResults.indexOf(poolResultsIdx)
      if (visibleIdx == -1) {
        state.visibleResults.unshift(poolResultsIdx)
      } else {
        state.visibleResults.splice(visibleIdx,1)
      }
    },

    clearSelectedPoolResults(state) {
      // When the results are cleared, reset pagination, remove pool
      // total from overall total and reset pool total to 0
      let tgtPool = state.results[state.selectedResultsIdx]
      let oldPoolTotal = tgtPool.total 
      tgtPool.total = 0
      tgtPool.page = 0
      state.results[state.selectedResultsIdx].hits = []
      state.total -= oldPoolTotal
    },

    addPoolSearchResults(state, poolResults) {
      let tgtPool = state.results[state.selectedResultsIdx]
      if (poolResults.pagination.total > 0) {
        utils.mergeRepeatedFields( poolResults.record_list )
        tgtPool.hits = tgtPool.hits.concat(poolResults.record_list)
      }
      tgtPool.timeMS = poolResults.elapsed_ms
      tgtPool.statusCode = 200 
      tgtPool.statusMessage = ""
      if (tgtPool.total == 0 ) {
        // if pool total is zero add the new results total to overall
        tgtPool.total = poolResults.pagination.total
        state.total += poolResults.pagination.total
      }
    },

    setDetailResults(state, {pr, pool}) {
      state.total = -1
      state.results = []
      state.visibleResults = []
      utils.mergeRepeatedFields( pr.record_list )
      let result = { pool: pool, total: pr.pagination.total,
        hits: pr.record_list, page: 0, show: false, timeMS: pr.elapsed_ms, resultIdx: 0,
        statusCode: pr.status_code, statusMessage: pr.status_msg }
      state.results.push(result)
    },

    setSearchResults(state, results) {
      // // this is called from top level search; resets results from all pools
      state.total = -1
      state.results = []
      state.visibleResults = []

      // Push all results into the results structure. Reset paging for each
      // NOTE: need to have resultIdx attached to because pools are interacted with
      // in terms of the visibleResults array. Need easy way to get original resultsIdx.
      results.pool_results.forEach(function (pr,idx) {
        let pool = utils.findPool(results.pools, pr.pool_id)
        if (pr.record_list) {
          utils.mergeRepeatedFields( pr.record_list )
          let result = { pool: pool, total: pr.pagination.total,
            hits: pr.record_list, page: 0, show: false, timeMS: pr.elapsed_ms, resultIdx: idx,
            statusCode: pr.status_code, statusMessage: pr.status_msg }
          state.results.push(result)
          if (pr.confidence != "low" && state.visibleResults.length < 3) {
            result["show"] = true
            state.visibleResults.push(state.results.length-1)
          }
        } else {
          state.results.push({
            pool: pool,
            total: 0, hits: [], page: 0, show: false, timeMS: pr.elapsed_ms, resultIdx: idx,
            statusCode: pr.status_code, statusMessage: pr.status_msg })
        }
      })

      if (state.visibleResults.length == 0 && state.results[0].statusCode == 200  && state.results[0].hits.length > 0) {
        state.results[0]["show"] = true
        state.visibleResults.push(0)
      }

      state.total = results.total_hits
    },

    incrementPage(state) {
      state.noSpinner = true
      state.results[state.selectedResultsIdx].page++
    },

    resetSearchResults(state) {
      state.results = []
      state.total = -1
      state.visibleResults = []
      state.selectedResultsIdx = -1
    },
  },

  actions: {
    // When an infinite scroll reaches the bottom of the page, call this to get the next
    // batch of records from the currently selected pool
    moreResults(ctx) {
      ctx.commit('incrementPage')
      return ctx.dispatch("searchSelectedPool")
    },
    
    // Search ALL configured pools. This is the initial search call using only the basic or
    // advanced search parameters and will always start at page 1. Filters do not apply
    // to all pools so they are not used here.
    // CTX: commit: ƒ boundCommit(type, payload, options)
    searchAllPools({ state, commit, rootState, rootGetters, dispatch }) {
      commit('system/setError', "")
      let req = {
        query: rootGetters['query/string'],
        pagination: { start: 0, rows: state.pageSize },
        preferences: {
          target_pool: rootState.pools.targetPoolURL,
          exclude_pool: rootState.pools.excludePoolURLs,
        }
      }

      // If a user is signed in, make sure bookmarks are up to date when 
      // searching so the UI can show the correct status per item
      if ( rootGetters["user/isSignedIn"]) {
        dispatch("user/getBookmarks")
      }

      commit('setSearching', true)
      commit('resetSearchResults')
      commit('filters/reset')
      let url = state.system.searchAPI + "/api/search?debug=1&intuit=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+state.user.authToken
      axios.post(url, req).then((response) => {
        commit('pools/setPools', response.data.pools)
        commit('setSearchResults', response.data)
        commit('filters/setAllAvailableFacets', response.data)
        commit('setSearching', false)
      }).catch((error) => {
        commit('system/setError', error)
        commit('setSearching', false)
      })
    },

    // SearchSelectedPool is called only when one specific set of pool results is selected for
    // exploration. It is used to query for next page during infinite scroll and
    // when filters are added and removed. Pool results are APPENDED to existing during infinite 
    // scroll. If newly filtered, reset paging and re-query
    searchSelectedPool({ state, commit, _rootState, rootGetters }) {
      commit('setSearching', true)
      let tgtPool = rootGetters.selectedResults
      let f = rootGetters['filters/poolFilter'](state.selectedResultsIdx, "api")
      let req = {
        query: rootGetters['query/string'],
        pagination: { start: tgtPool.page * state.pageSize, rows: state.pageSize },
        filters: f
      }
      let url = tgtPool.pool.url + "/api/search?debug=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+state.user.authToken
      return axios.post(url, req).then((response) => {
        commit('addPoolSearchResults', response.data)
        commit('setSearching', false)
      }).catch((error) => {
        commit('system/setError', error)
        commit('setSearching', false)
      })
    },

    // Get items details by pool and item idntifier. Nothing to do if data is already
    // in local state. Note use of async... it allows use of await on the supporting 
    // dispatches to get config and get pools.
    async getItemDetails(ctx, data) {
      ctx.commit('setSearching', true)
      let cached = ctx.rootGetters['getItemDetails'](data.source, data.identifier)
      if (cached != null ) {
        ctx.commit('setSearching', false)
        return
      }

      // get source from poolID
      let baseURL = ""
      let pool = null
      let pools = ctx.state.pools.list
      if (pools.length == 0) {
        if (ctx.state.system.searchAPI == "") {
          await ctx.dispatch("system/getConfig")
        }
        await ctx.dispatch("pools/getPools")
        pools = ctx.state.pools.list
        pool = utils.findPool(pools, data.source)
        baseURL = pool.url
      } else {
        pool = utils.findPool(pools, data.source)
        baseURL = pool.url
      }

      // make identifier query
      let req = {
        query: ctx.rootGetters['query/idQuery'](data.identifier),
        pagination: { start:0, rows: 1 },
        filters: []
      }

      let url = `${baseURL}/api/search`
      axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.user.authToken
      axios.post(url, req).then((response) => {
        ctx.commit('setDetailResults', {pr:response.data, pool: pool})
        ctx.commit('setSearching', false)
      }).catch((error) => {
        ctx.commit('system/setError', error)
        ctx.commit('setSearching', false)
      })
    },
  },

  modules: {
    system: system,
    user: user,
    pools: pools,
    query: query,
    filters: filters
  },

  plugins: [messaging, versionChecker]
})
