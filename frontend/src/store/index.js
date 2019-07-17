import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import errorPlugin from './plugins/errors'
import versionChecker from './plugins/version'
import diagnostics from './modules/diagnostics'
import preferences from './modules/preferences'
import query from './modules/query'
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    searchAPI: "",
    searchMode: "basic",
    pools: [],
    fatal: "",
    error: "",
    searching: false,
    searchSummary: "",
    currPoolIdx: -1,
    results: [],
    total: -1,
    pageSize: 25,
    authToken: "",
    authorizing: false,
  },

  getters: {
    hasAuthToken: state => {
      return state.authToken.length > 0
    },
    hasResults: state => {
      return state.total >= 0
    },
    currPool: state => {
      if (state.currPoolIdx == -1 || state.currPoolIdx > state.results.length - 1) {
        return { url: "", page: 0, total: 0, name: "", hits: [] }
      } else {
        let info = state.results[state.currPoolIdx]
        return info
      }
    },
    getPagination: state => {
      if (state.currPoolIdx == -1 || state.currPoolIdx > state.results.length - 1) {
        return { start: 0, rows: state.pageSize }
      } else {
        let info = state.results[state.currPoolIdx]
        return { start: info.page * state.pageSize, rows: state.pageSize }
      }
    },
  },

  mutations: {
    setAdvancedSearch(state) {
      state.searchMode = "advanced"
    },
    setBasicSearch(state) {
      state.searchMode = "basic"
    },
    setAuthToken(state, token) {
      state.authToken = token
    },
    setAuthorizing(state, auth) {
      state.authorizing = auth
    },
    setPools(state, data) {
      state.pools = data
      if (state.pools.length == 0) {
        state.fatal = "No search pools configured"
      }
    },
    setFatal(state, err) {
      state.fatal = err
    },
    setError(state, error) {
      // clear any prior results
      state.total = -1
      state.currPoolIdx = -1
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
    switchResultsPool(state, idx) {
      state.currPoolIdx = idx
    },
    setPoolSearchResults(state, results) {
      // These results are from a single pool; generally a call to get next page
      let info = state.results[state.currPoolIdx]
      info.hits = results.record_list
    },
    setSearchResults(state, results) {
      // this is called from top level search; resets results from all pools
      let poolHitCnt = 0
      state.total = -1
      state.currPoolIdx = -1
      state.results = []

      // Push all results into the results structure. Reset paging for each
      results.pool_results.forEach(function (pr) {
        if (pr.record_list) {
          state.results.push({
            url: pr.service_url,
            name: poolNameFromURL(pr.service_url, state.pools),
            total: pr.pagination.total,
            hits: pr.record_list,
            page: 0
          })
          poolHitCnt++
        } else {
          state.results.push({
            url: pr.service_url,
            name: poolNameFromURL(pr.service_url, state.pools),
            total: 0, hits: [], page: 0
          })
        }
      })

      state.currPoolIdx = 0
      state.searchSummary = results.pools_searched + " pools searched in " +
        results.total_time_ms + "ms. " + results.total_hits + " hits in " + poolHitCnt + " pools."
      state.total = results.total_hits
    },
    gotoFirstPage(state) {
      state.results[state.currPoolIdx].page = 0
    },
    gotoLastPage(state) {
      let info = state.results[state.currPoolIdx]
      info.page = Math.floor(info.total / state.pageSize)
      state.results[state.currPoolURL] = info
    },
    nextPage(state) {
      state.results[state.currPoolIdx].page++
    },
    prevPage(state) {
      state.results[state.currPoolIdx].page--
    },
  },

  actions: {
    getAuthToken(ctx) {
      ctx.commit('setAuthorizing', true)
      axios.post("/authorize").then((response) => {
        ctx.commit('setAuthToken', response.data)
        ctx.commit('setAuthorizing', false)
      }).catch((error) => {
        ctx.commit('setAuthToken', '')
        ctx.commit('setFatal', "Authorization failed" + error.response.data)
        ctx.commit('setAuthorizing', false)
      })
    },
    firstPage(ctx) {
      ctx.commit('gotoFirstPage')
      ctx.dispatch("doPoolSearch")
    },
    prevPage(ctx) {
      ctx.commit('prevPage')
      ctx.dispatch("doPoolSearch")
    },
    nextPage(ctx) {
      ctx.commit('nextPage')
      ctx.dispatch("doPoolSearch")
    },
    lastPage(ctx) {
      ctx.commit('gotoLastPage')
      ctx.dispatch("doPoolSearch")
    },
    doSearch({ state, commit, rootState, rootGetters }) {
      commit('setError', "")
      commit('setSearching', true)
      let req = {
        query: rootGetters['query/string'],
        pagination: { start: 0, rows: state.pageSize },
        preferences: {
          target_pool: rootState.preferences.targetPoolURL,
          exclude_pool: rootState.preferences.excludePoolURLs,
        }
      }
      if (req.query.length == 0) {
        commit('setError', "Please enter a search query")
        commit('setSearching', false)
        return
      }
      let url = state.searchAPI + "/api/search?debug=1&intuit=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+state.authToken
      axios.post(url, req).then((response) => {
        commit('setSearchResults', response.data)
        commit('diagnostics/setSearchDiagnostics', response.data)
        commit('setSearching', false)
      }).catch((error) => {
        commit('setError', error)
        commit('setSearching', false)
      })
    },

    doPoolSearch({ state, commit, _rootState, rootGetters }) {
      //commit('setError', "")
      commit('setSearching', true)
      let req = {
        query: rootGetters['query/string'],
        pagination: rootGetters.getPagination
      }
      let url = rootGetters.currPool.url + "/api/search?debug=1"
      axios.defaults.headers.common['Authorization'] = "Bearer "+state.authToken
      axios.post(url, req).then((response) => {
        commit('setPoolSearchResults', response.data)
        let diagPayload = { currPoolIdx: state.currPoolIdx, debug: response.data.debug, warnings: response.data.warnings }
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
        ctx.dispatch('getPools')
      }).catch((error) => {
        ctx.commit('setFatal', "Unable to get configuration: " + error.response.data)
      })
    },
    getPools(ctx) {
      let url = ctx.state.searchAPI + "/api/pools"
      axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
      axios.get(url).then((response) => {
        ctx.commit('setPools', response.data)
      }).catch((error) => {
        ctx.commit('setFatal', "Unable to pools: " + error.response.data)
      })
    },
  },
  modules: {
    diagnostics: diagnostics,
    preferences: preferences,
    query: query
  },
  plugins: [errorPlugin,versionChecker]
})

const poolNameFromURL = (url, pools) => {
  let name = ""
  pools.forEach(function (p) {
    if (p.url == url) {
      name = p.name
    }
  })
  return name
}
