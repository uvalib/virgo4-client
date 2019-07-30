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
    visibleResults: [],
    explorePoolIdx: -1,
    total: -1,
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
      return state.explorePoolIdx
    },
    selectedPool: state => {
      if (state.explorePoolIdx === -1 ) {
        return {url: "none", total: 0}
      }
      return state.results[state.explorePoolIdx]
    },
    isPoolSelected: state => {
      return state.explorePoolIdx > -1
    },
    hasMoreHits: state => {
      if (state.explorePoolIdx === -1 ) {
        return false
      }
      let tgtPool = state.results[state.explorePoolIdx]
      return tgtPool.total > tgtPool.hits.length
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
      state.explorePoolIdx = idx
    },
    closePoolResults(state) {
      state.explorePoolIdx = -1
    },
    toggleResultVisibility(state, poolResultsIdx) {
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
    addPoolSearchResults(state, results) {
      let info = state.results[state.explorePoolIdx]
      mergeRepeatedFields( results.record_list )
      info.hits = info.hits.concat(results.record_list)
    },
    setSearchResults(state, results) {
      // // this is called from top level search; resets results from all pools
      state.total = -1
      state.results = []
      state.visibleResults = []

      // Push all results into the results structure. Reset paging for each
      results.pool_results.forEach(function (pr) {
        if (pr.record_list) {
          mergeRepeatedFields( pr.record_list )
          let result = { url: pr.service_url, total: pr.pagination.total,
            hits: pr.record_list, page: 0, show: false }
          state.results.push(result)
          if (pr.confidence != "low" && state.visibleResults.length < 3) {
            result["show"] = true
            state.visibleResults.push(state.results.length-1)
          }
        } else {
          state.results.push({
            url: pr.service_url,
            total: 0, hits: [], page: 0, show: false })
        }
      })
      if (state.visibleResults.length == 0) {
        state.results[0]["show"] = true
        state.visibleResults.push(0)
      }
      state.searchSummary = results.pools.length + " pools searched in " +
        results.total_time_ms + "ms. " + results.total_hits + " total hits."
      state.total = results.total_hits
    },
    moreResults(state) {
      state.results[state.explorePoolIdx].page++
    },
  },

  actions: {
    moreResults(ctx) {
      ctx.commit('moreResults')
      ctx.dispatch("doPoolSearch")
    },
    
    doSearch({ state, commit, rootState, rootGetters }) {
      commit('setError', "")
      commit('setSearching', true)
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
        commit('setSearching', false)
        return
      }
      let url = state.searchAPI + "/api/search?debug=1&intuit=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+state.auth.authToken
      axios.post(url, req).then((response) => {
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

    doPoolSearch({ state, commit, _rootState, rootGetters }) {
      commit('setSearching', true)
      let tgtPage = 0
      if (state.explorePoolIdx > -1) {
        tgtPage = state.results[state.explorePoolIdx].page
      }
      let req = {
        query: rootGetters['query/string'],
        pagination: { start: tgtPage * state.pageSize, rows: state.pageSize }
      }
      let url = rootGetters.selectedPool.url + "/api/search?debug=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+state.auth.authToken
      axios.post(url, req).then((response) => {
        commit('addPoolSearchResults', response.data)
        let diagPayload = { currPoolIdx: state.explorePoolIdx, debug: response.data.debug, warnings: response.data.warnings }
        commit('diagnostics/setPoolDiagnostics', diagPayload)
        commit('setSearching', false)
      }).catch((error) => {
        commit('setError', error)
        commit('setSearching', false)
      })
    },

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
