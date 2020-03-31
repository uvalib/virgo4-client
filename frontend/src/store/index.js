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
import * as utils from './modules/utils'
import { getField, updateField } from 'vuex-map-fields'

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
    otherSrcSelection: {id: "", name: ""}
  },

  getters: {
    getField,
    hasResults: state => {
      return state.total >= 0
    },
    selectedResultsIdx: state => {
      return state.selectedResultsIdx
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
  },

  mutations: {
    updateField,
    setAutoExpandGroupID(state, id) {
      state.autoExpandGroupID = id
    },
    setSearching(state, flag) {
      if (state.noSpinner ) {
        state.noSpinner = false
      } else {
        state.searching = flag
      }
    },
    updateOtherPoolLabel(state) {
      // when a pool is selected from the 'Other' tab and a filter has been applied
      // this method method is used to update the count in the tab label
      if ( state.otherSrcSelection.id == "") return
      let res = state.results.find( r => r.pool.id == state.otherSrcSelection.id )
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
        let sel = {id: r.pool.id, name: name, disabled: false}
        state.otherSrcSelection = sel
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

      if (poolResults.group_list) {
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
      }
    },

    setSearchResults(state, results) {
      // // this is called from top level search; resets results from all pools
      state.total = -1
      state.results.splice(0, state.results.length)
      let firstPoolWithHits = -1
      results.pool_results.forEach( (pr,idx) => {
        if (!pr.group_list) {
          pr.group_list = []
        }

        // Find the pool the results are associated with and populate some top level response info
        let pool = results.pools.find( p => p.id == pr.pool_id)
        let result = { pool: pool, sort: pr.sort, total: pr.pagination.total, page: 0,timeMS: pr.elapsed_ms, 
          hits: [], statusCode: pr.status_code, statusMessage: pr.status_msg}
        if (firstPoolWithHits == -1 &&  pr.pagination.total > 0) {
          firstPoolWithHits = idx
        }

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
            let hit = {grouped: true, expanded: false, count: group.count}
            utils.getGroupHitMetadata(group, hit)
            result.hits.push(hit)
          }
        })

        state.results.push(result)
      })

      if ( firstPoolWithHits == -1) {
         firstPoolWithHits = 0
      }
      state.selectedResultsIdx = firstPoolWithHits
      state.otherSrcSelection = {id: "", name: ""}

      state.total = results.total_hits
    },

    setSuggestions(state, data) {
      state.suggestions.splice(0, state.suggestions.length)
      data.forEach( d=> {
         state.suggestions.push(d)   
      })
    },

    incrementPage(state) {
      state.noSpinner = true
      state.results[state.selectedResultsIdx].page++
    },

    resetSearchResults(state) {
      state.results.splice(0, state.results.length)
      state.total = -1
      state.selectedResultsIdx = -1
      state.otherSrcSelection = {id: "", name: ""}
    },
  },

  actions: {
    moreResults(ctx) {
      ctx.commit('incrementPage')
      return ctx.dispatch("searchSelectedPool")
    },
    
    // Search ALL configured pools. This is the initial search call using only the basic or
    // advanced search parameters and will always start at page 1. Filters do not apply
    // to all pools so they are not used here.
    // CTX: commit: ƒ boundCommit(type, payload, options)
    searchAllPools({ state, commit, rootState, rootGetters, dispatch }, tgtPage) {
      commit('system/setError', "")
      // By default, search for 20 items. If this is a restored search with a particular target 
      // specified, that target may not be in the first page of results. tgtPage specifes
      // which page of results contains the hit. Make the initial request return enough results to include it.
      let rows = state.pageSize 
      if ( tgtPage) {
        // target page is 0 based
        rows = state.pageSize * (tgtPage+1)
      }
      let req = {
        query: rootGetters['query/string'],
        pagination: { start: 0, rows: rows },
        preferences: {
          target_pool: rootState.preferences.targetPoolURL,
          exclude_pool: rootState.preferences.excludePoolURLs,
        },
        filters: rootGetters['filters/globalFilter']
      }

      if (rootState.query.mode == "basic" && rootState.query.basicSearchScope.id != "all") {
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
        dispatch("bookmarks/getBookmarks")
      }

      commit('setSearching', true)
      commit('filters/setUpdatingFacets', true)
      let url = state.system.searchAPI + "/api/search?intuit=1" // removed debug=1 to see if it helps speed
      return axios.post(url, req).then((response) => {
        commit('system/setShowWelcome', false)
        commit('pools/setPools', response.data.pools)
        commit('pools/setSortOptions', response.data.pool_results)
        commit('filters/initialize', response.data.pools.length)
        commit('setSearchResults', response.data)
        commit('setSearching', false)
        dispatch("filters/getSelectedResultFacets")
        commit('setSuggestions', response.data.suggestions)
      }).catch((error) => {
         commit('system/setError', error)
         commit('setSearching', false)
         commit('filters/setUpdatingFacets', false)
      })
    },

    // SearchSelectedPool is called only when one specific set of pool results is selected for
    // exploration. It is used to query for next page during load more and
    // when filters are added and removed. Pool results are APPENDED to existing after load more. 
    // If newly filtered, reset paging and re-query
    searchSelectedPool({ state, commit, _rootState, rootGetters, dispatch }) {
      commit('setSearching', true)
      commit('filters/setUpdatingFacets', true)
      let tgtPool = rootGetters.selectedResults
      let filters = rootGetters['filters/poolFilter'](state.selectedResultsIdx)
      let filterObj = {pool_id: tgtPool.pool.id, facets: filters}
      let req = {
        query: rootGetters['query/string'],
        pagination: { start: tgtPool.page * state.pageSize, rows: state.pageSize },
        filters: [filterObj]
      }
      let url = tgtPool.pool.url + "/api/search?debug=1"
      return axios.post(url, req).then((response) => {
        commit('addPoolSearchResults', response.data)
        commit('setSearching', false)
        dispatch("filters/getSelectedResultFacets")
        if ( state.otherSrcSelection.id != "") {
          commit('updateOtherPoolLabel')
        }
      }).catch((error) => {
        commit('system/setError', error)
        commit('setSearching', false)
        commit('filters/setUpdatingFacets', false)
      })
    },

    // Select pool results and get all facet info for the result
    async selectPoolResults(ctx, resultIdx) {
      ctx.commit('selectPoolResults', resultIdx) 
      await ctx.dispatch("filters/getSelectedResultFacets", null, { root: true })
    }
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
  },

  plugins: [versionChecker,expiredSessionWatcher]
})
