import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import diagnostics from './modules/diagnostics'
import preferences from './modules/preferences'
import { getField, updateField } from 'vuex-map-fields'

Vue.use(Vuex)

// Plugin to listen for error messages being set. After a delay, clear them
const errorPlugin = store => {
  store.subscribe((mutation) => {
    if (mutation.type === "setError") {
      if ( mutation.payload != null && mutation.payload != "" ) { 
        setTimeout( ()=>{ store.commit('setError', null)}, 10000)
      }   
    }   
  })  
}

export default new Vuex.Store({
  state: {
    searchAPI: "",
    pools: [],
    fatal: "",
    error: "",
    searching: false,
    searchSummary: "",
    currPoolIdx: -1,
    results: [],
    total: -1,
    pageSize: 25,
    query: {
      keyword: "",
      keywordOp: "AND",
      author: "",
      authorOp: "AND",
      title: "",
      titleOp: "AND",
      subject: "",
      subjectOp: "AND",
    },
  },

  getters: {
    getField,
    hasResults: state => {
      return state.total >= 0
    },
    currPool: state => {
      if (state.currPoolIdx == -1 || state.currPoolIdx > state.results.length-1 ) {
        return {url:"", page: 0, total: 0, name: ""}
      } else {
        let info = state.results[state.currPoolIdx]
        return info
      }
    },
    getPagination: state=>{ 
      if (state.currPoolIdx == -1 || state.currPoolIdx > state.results.length-1 ) {
        return {start: 0, rows: state.pageSize}
      } else {
        let info = state.results[state.currPoolIdx]
        return {start: info.page * state.pageSize, rows: state.pageSize}
      }
    },
  },

  mutations: {
    updateField,
    setPools(state, data) {
      state.pools = data
      if (state.pools.length == 0 ) {
        state.fatal = "No search pools configured"
      }
    },
    setFatal(state, err) {
      state.fatal = err
    },
    setError(state, err) {
      state.error = err
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
      results.pool_results.forEach( function(pr) {
        if (pr.record_list) {
          state.results.push({ url: pr.service_url, 
            name: poolNameFromURL(pr.service_url, state.pools),
            total: pr.pagination.total,
            hits: pr.record_list,
            page: 0
          })
          poolHitCnt++
        } else {
          state.results.push({ url: pr.service_url, 
            name: poolNameFromURL(pr.service_url, state.pools),
            total: 0, hits: [], page: 0})
        }
      })

      state.currPoolIdx = 0
      state.searchSummary = results.pools_searched+ " pools searched in "+
        results.total_time_ms+"ms. "+results.total_hits+" hits in "+poolHitCnt+" pools."
      state.total = results.total_hits
    },
    gotoFirstPage(state) {
      state.results[state.currPoolIdx].page = 0
    },
    gotoLastPage(state) {
      let info = state.results[state.currPoolIdx]
      info.page = Math.floor( info.total / state.pageSize)
      state.results[state.currPoolURL] = info
    },
    nextPage(state) {
      state.results[state.currPoolIdx].page++
    },
    prevPage(state) {
      state.results[state.currPoolIdx].page--
    },
    clearAdvancedSearch(state) {
      state.query.keyword = ""
      state.query.author = ""
      state.query.title = ""
      state.query.subject = ""
    }
  },

  actions: {
    firstPage( ctx ) {
      ctx.commit('gotoFirstPage')
      ctx.dispatch("doPoolSearch")
    },
    prevPage( ctx ) {
      ctx.commit('prevPage')
      ctx.dispatch("doPoolSearch")
    },
    nextPage( ctx ) {
      ctx.commit('nextPage')
      ctx.dispatch("doPoolSearch")
    },
    lastPage( ctx ) {
      ctx.commit('gotoLastPage')
      ctx.dispatch("doPoolSearch")
    },
    doSearch({ state, commit, rootState }) {
      commit('setError', "")
      commit('setSearching', true)
      let req = {
        query: buildQueryString(state.query),
        pagination: {start: 0, rows: state.pageSize},
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
      let url = state.searchAPI+"/api/search"
      axios.post(url, req).then((response)  =>  {
        commit('setSearchResults', response.data)
        commit('diagnostics/setSearchDiagnostics', response.data)
        commit('setSearching', false)
      }).catch((error) => {
        commit('setError', error) 
        commit('setSearching', false)
      })
    },
    doPoolSearch(ctx) {
      ctx.commit('setError', "")
      ctx.commit('setSearching', true)
      let req = {
        query: buildQueryString(ctx.state.query),
        pagination: ctx.getters.getPagination
      }
      let url = ctx.getters.currPool.url+"/api/search?debug=1"
      axios.post(url, req).then((response)  =>  {
        ctx.commit('setPoolSearchResults', response.data)
        let diagPayload = {currPoolIdx: ctx.state.currPoolIdx, debug: response.data.debug, warnings: response.data.warnings}
        ctx.commit('diagnostics/setPoolDiagnostics', diagPayload)
        ctx.commit('setSearching', false)
      }).catch((error) => {
        ctx.commit('setError', error) 
        ctx.commit('setSearching', false)
      })
    },
    getConfig(ctx) {
      axios.get("/config").then((response)  =>  {
        ctx.commit('setConfig', response.data )
        ctx.commit('diagnostics/setConfig', response.data )
        ctx.dispatch('getPools' )
      }).catch((error) => {
        ctx.commit('setFatal', "Unable to get configuration: "+error.response.data) 
      })
    },
    getPools(ctx) {
      let url = ctx.state.searchAPI+"/api/pools"
      axios.get(url).then((response)  =>  {
        ctx.commit('setPools', response.data )
      }).catch((error) => {
        ctx.commit('setFatal', "Unable to pools: "+error.response.data) 
      })
    }
  },
  modules: {
    diagnostics: diagnostics,
    preferences: preferences
  },
  plugins: [errorPlugin]
})

const poolNameFromURL = (url, pools) => {
  let name = ""
  pools.forEach( function(p) {
    if (p.url == url) {
      name= p.name
    }
  })
  return name
}

const buildQueryString = (params) => { 
  // convert into the standard v4 search string format. Ex:
  // title : {"susan sontag" OR music title}   AND keyword:{ Maunsell } ) OR author:{ liberty }
  // For now, all 'fields' are AND'd together and the raw strings entered in the form just
  // tacked on after the key.
  var andTerms = []
  var orTerms = []
  if (params.keyword != "") {
    if (params.keywordOp == "AND") {
      andTerms.push("keyword: {"+params.keyword+"}")
    } else {
      orTerms.push("keyword: {"+params.keyword+"}")
    }
  }
  if (params.author != "") {
    if (params.authorOp == "AND") {
      andTerms.push("author: {"+params.author+"}")
    } else {
      orTerms.push("author: {"+params.author+"}")
    }
  }
  if (params.title != "") {
    if (params.titleOp == "AND") {
      andTerms.push("title: {"+params.title+"}")
    } else {
      orTerms.push("title: {"+params.title+"}")
    }
  }
  if (params.subject != "") {
    if (params.subjectOp == "AND") {
      andTerms.push("subject: {"+params.subject+"}")
    } else {
      orTerms.push("subject: {"+params.subject+"}")
    }
  }
  let anded = andTerms.join(" AND ")
  let ored = orTerms.join(" OR ")
  if (anded.length > 0 && ored.length > 0) {
    return anded + " OR " + ored
  }
  if (anded.length > 0) return anded
  if (ored.length > 0) return ored
  return ""
}
