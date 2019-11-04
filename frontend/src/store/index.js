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
import item from './modules/item'
import reserves from './modules/reserves'
import preferences from './modules/preferences'
import * as utils from './modules/utils'
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    noSpinner: false,
    searching: false,
    pageSize: 25,
    results: [],
    total: -1,
    selectedResultsIdx: -1,
  },

  getters: {
    hasResults: state => {
      return state.total >= 0
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
  },

  mutations: {
    setSearching(state, flag) {
      if (state.noSpinner ) {
        state.noSpinner = false
      } else {
        state.searching = flag
      }
    },

    selectPoolResults(state, resultIdx) {
      state.selectedResultsIdx = resultIdx
    },
    deselectPoolResults(state) {
      state.selectedResultsIdx = -1
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

    toggleGroupExpanded(state, hitIdx) {
      let group = state.results[state.selectedResultsIdx].hits[hitIdx]
      group.expanded = !group.expanded
    },

    addPoolSearchResults(state, poolResults) {
      let tgtPool = state.results[state.selectedResultsIdx]
      tgtPool.timeMS = poolResults.elapsed_ms
      tgtPool.statusCode = 200 
      tgtPool.statusMessage = ""
      if (tgtPool.total == 0 ) {
        // if pool total is zero add the new results total to overall
        tgtPool.total = poolResults.pagination.total
        state.total += poolResults.pagination.total
      }

      poolResults.group_list.forEach( group => {
        utils.preProcessHitFields( group.record_list )
        if (group.count == 1) {
          let hit = group.record_list[0]
          hit.grouped = false
          tgtPool.hits.push(hit)
        } else {
          let hit = {grouped: true, count: group.count, group: group.record_list}
          utils.getGroupHitMetadata(group, hit)
          tgtPool.hits.push(hit)
        }
      })
    },

    setSearchResults(state, results) {
      // // this is called from top level search; resets results from all pools
      state.total = -1
      state.results = []
      let tgtPoolURL  = state.preferences.targetPoolURL
      let confidence = ["low", "medium", "high", "exact"]
      let best = {confidence: -1, idx: 0}
      let resultIdx = 0

      results.pool_results.forEach( pr => {
        // Skip pools that have no results
        if (!pr.group_list) {
          pr.group_list = []
        }
        if (pr.group_list.length == 0 && pr.status_code == 200) {
          return
        }

        // Find the pool the results are associated with and populate some top level response info
        let pool = utils.findPool(results.pools, pr.pool_id)
        let result = { pool: pool, total: pr.pagination.total, page: 0,timeMS: pr.elapsed_ms, 
          hits: [], statusCode: pr.status_code, statusMessage: pr.status_msg}

        // Next, drill into group_list data. It contains a count and a record_list
        // record list is a list of fields in the hit. field is {name,label,type,value,visibility,display}
        pr.group_list.forEach( group => {

          // for each hit in the list, merge repeated fields into arrays, pull out
          // key fields like identifer to top-level named field and split others into basic and detail
          if (group.record_list) {
            utils.preProcessHitFields( group.record_list )
          }

          // Different handling for grouped and single items
          if (group.count == 1) {
            let hit = group.record_list[0]
            hit.grouped = false
            result.hits.push(hit)
          } else {
            let hit = {grouped: true, expanded: false, count: group.count, group: group.record_list}
            utils.getGroupHitMetadata(group, hit)
            result.hits.push(hit)
          }
        })

        state.results.push(result)

        // track best result (or preferred pool)
        let confidenceIdx = confidence.indexOf(pr.confidence)
        if (tgtPoolURL == pool.url && result.total > 0) {
          confidenceIdx = 100
        }
        if (confidenceIdx > best.confidence ) {
          best.confidence = confidenceIdx
          best.idx  = resultIdx
        }

        resultIdx++
      })

      state.selectedResultsIdx = best.idx
      state.total = results.total_hits
    },

    incrementPage(state) {
      state.noSpinner = true
      state.results[state.selectedResultsIdx].page++
    },

    resetSearchResults(state) {
      state.results = []
      state.total = -1
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
          target_pool: rootState.preferences.targetPoolURL,
          exclude_pool: rootState.preferences.excludePoolURLs,
        },
        filters: rootGetters['filters/globalFilter']
      }

      if (rootState.query.basicSearchScope.value != "all") {
        let tgtID = rootState.query.basicSearchScope.id
        req.preferences.exclude_pool = []
        rootState.pools.list.forEach( src=> {
          if (src.id != tgtID) {
            req.preferences.exclude_pool.push(src.url)
          }
        })
      }

      // If a user is signed in, make sure bookmarks are up to date when 
      // searching so the UI can show the correct status per item
      if ( rootGetters["user/isSignedIn"]) {
        dispatch("user/getBookmarks")
      }

      commit('setSearching', true)
      let url = state.system.searchAPI + "/api/search?intuit=1" // removed debug=1 to see if it helps speed
      axios.defaults.headers.common['Authorization'] = "Bearer "+rootState.user.authToken
      axios.post(url, req).then((response) => {
        commit('pools/setPools', response.data.pools)
        commit('filters/reset')
        commit('filters/setAllAvailableFacets', response.data)
        commit('setSearchResults', response.data)
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
    searchSelectedPool({ state, commit, rootState, rootGetters }) {
      commit('setSearching', true)
      let tgtPool = rootGetters.selectedResults
      let f = rootGetters['filters/poolFilter'](state.selectedResultsIdx, "api")
      let req = {
        query: rootGetters['query/string'],
        pagination: { start: tgtPool.page * state.pageSize, rows: state.pageSize },
        filters: f
      }
      let url = tgtPool.pool.url + "/api/search?debug=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+rootState.user.authToken
      return axios.post(url, req).then((response) => {
        commit('addPoolSearchResults', response.data)
        commit('setSearching', false)
      }).catch((error) => {
        commit('system/setError', error)
        commit('setSearching', false)
      })
    },
  },

  modules: {
    item: item,
    filters: filters,
    pools: pools,
    preferences: preferences,
    query: query,
    reserves: reserves,
    system: system,
    user: user,
  },

  plugins: [messaging, versionChecker]
})
