import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import messaging from './plugins/messaging'
import versionChecker from './plugins/version'
import pools from './modules/pools'
import user from './modules/user'
import query from './modules/query'
import filters from './modules/filters'
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    searchAPI: "",
    fatal: "",
    error: "",
    noSpinner: false,
    searching: false,
    pageSize: 25,
    results: [],
    total: -1,
    visibleResults: [],
    selectedResultsIdx: -1,
    version: "unknown",
    userMenuOpen: false
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
    }
  },

  mutations: {
    toggleUserMenu(state) {
      state.userMenuOpen = !state.userMenuOpen
    },
    closeUserMenu(state) {
      state.userMenuOpen = false
    },
    setVersion(state, data) {
      state.version = `${data.version}.${data.build}`
    },
    setFatal(state, err) {
      state.fatal = err
    },
    setError(state, error) {
      if (error == null) {
        error = ""
      }
      state.total = -1
      state.results = []
      if (error.response) {
        // Server responded with a status code out of the range of 2xx
        state.error = error.response.data
      } else if (error.request) {
        // The request was made but no response was received
        state.error = "Search is non-responsive"
      } else  if (error.message ) {
        // Something happened in setting up the request that triggered an Error
        state.error = error.message
      } else {
        // likely just a string error; just set it
        state.error = error
      }
    },

    setConfig(state, cfg) {
      state.searchAPI = cfg.searchAPI
    },
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
        mergeRepeatedFields( poolResults.record_list )
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

    setSearchResults(state, results) {
      // // this is called from top level search; resets results from all pools
      state.total = -1
      state.results = []
      state.visibleResults = []

      // Push all results into the results structure. Reset paging for each
      // NOTE: need to have resultIdx attached to because pools are interacted with
      // in terms of the visibleResults array. Need easy way to get original resultsIdx.
      results.pool_results.forEach(function (pr,idx) {
        let pool = findPool(results.pools, pr.pool_id)
        if (pr.record_list) {
          mergeRepeatedFields( pr.record_list )
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
      commit('setError', "")
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
      commit('filters/reset')
      let url = state.searchAPI + "/api/search?debug=1&intuit=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+state.user.authToken
      axios.post(url, req).then((response) => {
        commit('pools/setPools', response.data.pools)
        commit('setSearchResults', response.data)
        commit('filters/setAllAvailableFacets', response.data)
        commit('setSearching', false)
      }).catch((error) => {
        commit('setError', error)
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
        commit('setError', error)
        commit('setSearching', false)
      })
    },

    // Call getConfig at startup to get client configuration parameters
    getConfig(ctx) {
      return axios.get("/config").then((response) => {
        ctx.commit('setConfig', response.data)
      }).catch((error) => {
        ctx.commit('setFatal', "Unable to get configuration: " + error.response.data)
      })
    },

    getVersion(ctx) {
      axios.get("/version").then((response) => {
        ctx.commit('setVersion', response.data)
      })
    }
  },

  modules: {
    user: user,
    pools: pools,
    query: query,
    filters: filters
  },

  plugins: [messaging, versionChecker]
})

// Find a pool by internal identifier
function findPool(pools, id) {
  let match = null
  pools.forEach(function (p) {
     if (p.id == id) {
        match = p
     }
  })
  return match
}

// Each search ppol hit contains an array of field objects. These may be repeated, but for display 
// purposes they need to be merged into a single field object with an array value. Additionally, the fields 
// are classified as basic (show by default) or detailed (hidden by default). Split them into two separate
// arrays of fields. Finally, the preview_url is a special case. It is placed and rendered differently than 
// all others. Pull it out of the fields lists and place it in the top-level of the hit info.
function mergeRepeatedFields( hits ) {
  hits.forEach(function(hit) {
    let mergedBasicFields = []
    let mergedDetailFields = []
    hit.fields.forEach(function(field) {
      if (field.value === "") {
        return
      }
      if (field.name == "preview_url") {
        hit.previewURL = field.value
        return
      }
      if (field.name == "id") {
        hit.identifier = field.value
        return
      }
      let tgtMerged = mergedBasicFields 
      if (field.visibility == "detailed") {
        tgtMerged = mergedDetailFields
      }
      let existing = tgtMerged.find(f => f.name === field.name) 
      if (existing) {
        // this field has already been encountered. Convert the value 
        // to an array and push the new value into it
        if (Array.isArray(existing.value)===false) {
          existing.value = [existing.value]
        }
        existing.value.push(field.value)
      } else {
        tgtMerged.push(field)
      }
    })
    hit.basicFields = mergedBasicFields
    hit.detailFields = mergedDetailFields
    delete hit.fields
  })
}
