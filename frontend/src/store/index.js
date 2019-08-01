import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import messaging from './plugins/messaging'
import versionChecker from './plugins/version'
import diagnostics from './modules/diagnostics'
import pools from './modules/pools'
import auth from './modules/auth'
import query from './modules/query'
import filters from './modules/filters'
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    searchAPI: "",
    searchMode: "basic",
    fatal: "",
    error: "",
    searching: false,
    pageSize: 25,
    results: [],
    total: -1,
    visibleResults: [],
    selectedPoolIdx: -1,
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
    selectedPoolIdx: state => {
      return state.selectedPoolIdx
    },
    selectedPool: state => {
      if (state.selectedPoolIdx === -1 ) {
        return {url: "none", total: 0}
      }
      return state.results[state.selectedPoolIdx]
    },
    isPoolSelected: state => {
      return state.selectedPoolIdx > -1
    },
    hasMoreHits: state => {
      if (state.selectedPoolIdx === -1 || state.searching  ) {
        return false
      }
      let tgtPool = state.results[state.selectedPoolIdx]
      return tgtPool.total > tgtPool.hits.length
    },
    poolResultsURL: state => resultIdx => {
      return state.results[resultIdx].url
    },
    hitPoolCount: state => {
      let poolCnt = 0
      state.results.forEach(function(p) {
        if (p.total > 0) {
          poolCnt++
        }
      })
      return poolCnt
    }
  },

  mutations: {
    setAdvancedSearch(state) {
      state.searchMode = "advanced"
    },
    setBasicSearch(state) {
      state.searchMode = "basic"
    },
    setFatal(state, err) {
      state.fatal = err
    },
    setError(state, error) {
      // clear any prior results
      state.total = -1
      state.results = []
      if (error == null) {
        error = ""
      }

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
      state.searching = flag
    },
    selectPoolResults(state, idx) {
      state.selectedPoolIdx = idx
    },
    closePoolResults(state) {
      state.selectedPoolIdx = -1
    },
    toggleResultVisibility(state, poolResultsIdx) {
      // Don't change visibility if there are no results to see
      if (state.results[poolResultsIdx].total == 0) {
        return
      }
      // NOTES: the result itself is tagged with show true/false for ease of detecting
      // which results are showing. A separate visibleResults array tracks the order 
      // that pools were selected to be seen.
      state.results[poolResultsIdx]["show"] = !state.results[poolResultsIdx]["show"]
      let visibleIdx = state.visibleResults.indexOf(poolResultsIdx)
      if (visibleIdx == -1) {
        state.visibleResults.push(poolResultsIdx)
      } else {
        state.visibleResults.splice(visibleIdx,1)
      }
    },

    clearSelectedPoolResults(state) {
      // When the results are cleared, reset pagination, remove pool
      // total from overall total and reset pool total to 0
      let tgtPool = state.results[state.selectedPoolIdx]
      let oldPoolTotal = tgtPool.total 
      tgtPool.total = 0
      tgtPool.page = 0
      state.results[state.selectedPoolIdx].hits = []
      state.total -= oldPoolTotal
    },

    addPoolSearchResults(state, results) {
      let tgtPool = state.results[state.selectedPoolIdx]
      if (results.pagination.total > 0) {
        mergeRepeatedFields( results.record_list )
        tgtPool.hits = tgtPool.hits.concat(results.record_list)
      }
      tgtPool.timeMS = results.elapsed_ms
      if (tgtPool.total == 0 ) {
        // if pool total is zero add the new results total to overall
        tgtPool.total = results.pagination.total
        state.total += results.pagination.total
      }
    },

    setSearchResults(state, results) {
      // // this is called from top level search; resets results from all pools
      state.total = -1
      state.results = []
      state.visibleResults = []

      // Push all results into the results structure. Reset paging for each
      // NOTE: need to have resultIdx attached to result to cover the case when pools are 
      // re-sorted by add/remove from view. This is tracked in visibleResults where the index
      // is not the same as the index into the results array.
      results.pool_results.forEach(function (pr,idx) {
        if (pr.record_list) {
          mergeRepeatedFields( pr.record_list )
          let result = { url: pr.service_url, total: pr.pagination.total,
            hits: pr.record_list, page: 0, show: false, timeMS: pr.elapsed_ms, resultIdx: idx }
          state.results.push(result)
          if (pr.confidence != "low" && state.visibleResults.length < 3) {
            result["show"] = true
            state.visibleResults.push(state.results.length-1)
          }
        } else {
          state.results.push({
            url: pr.service_url,
            total: 0, hits: [], page: 0, show: false, timeMS: pr.elapsed_ms, resultIdx: idx })
        }
      })
      if (state.visibleResults.length == 0) {
        state.results[0]["show"] = true
        state.visibleResults.push(0)
      }
      state.total = results.total_hits
    },

    moreResults(state) {
      state.results[state.selectedPoolIdx].page++
    },
  },

  actions: {
    // When an infinite scroll reaches the bottom of the page, call this to get the next
    // batch of records from the currently selected pool
    moreResults(ctx) {
      ctx.commit('moreResults')
      ctx.dispatch("searchSelectedPool")
    },
    
    // Search ALL configured pools. This is the initial search call using only the basic or
    // advanced search parameters and will always start at page 1. Filters do not apply
    // to all pools so they are not used here.
    searchAllPools({ state, commit, rootState, rootGetters }) {
      commit('setError', "")
      let req = {
        query: rootGetters['query/string'],
        pagination: { start: 0, rows: state.pageSize },
        preferences: {
          target_pool: rootState.pools.targetPoolURL,
          exclude_pool: rootState.pools.excludePoolURLs,
        }
      }
      if (req.query.length == 0) {
        commit('setError', "Please enter a search query")
        return
      }

      commit('setSearching', true)
      let url = state.searchAPI + "/api/search?debug=1&intuit=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+state.auth.authToken
      axios.post(url, req).then((response) => {
        // The response includes all available pools, pool search resonses, 
        // pool-specific diagnostics and a list of available facets for each pool.
        // Store this data in the appropriate module 
        commit('setSearchResults', response.data)
        commit('pools/setPools', response.data.pools)
        commit('diagnostics/setSearchDiagnostics', response.data)
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
      let tgtPage = 0
      if (state.selectedPoolIdx > -1) {
        tgtPage = state.results[state.selectedPoolIdx].page
      }
      let f = rootGetters['filters/poolFilter'](state.selectedPoolIdx, "api")
      let req = {
        query: rootGetters['query/string'],
        pagination: { start: tgtPage * state.pageSize, rows: state.pageSize },
        filters: f
      }
      let url = rootGetters.selectedPool.url + "/api/search?debug=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+state.auth.authToken
      axios.post(url, req).then((response) => {
        commit('addPoolSearchResults', response.data)
        let diagPayload = { poolResultsIdx: state.selectedPoolIdx, debug: response.data.debug, warnings: response.data.warnings }
        commit('diagnostics/setPoolDiagnostics', diagPayload)
        commit('setSearching', false)
      }).catch((error) => {
        commit('setError', error)
        commit('setSearching', false)
      })
    },

    // Call getConfig at startup to get client configuration parameters
    getConfig(ctx) {
      axios.get("/config").then((response) => {
        ctx.commit('setConfig', response.data)
        ctx.commit('diagnostics/setConfig', response.data)
      }).catch((error) => {
        ctx.commit('setFatal', "Unable to get configuration: " + error.response.data)
      })
    }
  },

  modules: {
    auth: auth,
    diagnostics: diagnostics,
    pools: pools,
    query: query,
    filters: filters
  },

  plugins: [messaging, versionChecker]
})

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
