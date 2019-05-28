import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'

Vue.use(Vuex)

// Plugin to listen for error messages being set. After a delay, clear them
const errorPlugin = store => {
  store.subscribe((mutation) => {
    if (mutation.type === "setError") {
      if ( mutation.payload != null ) { 
        setTimeout( ()=>{ store.commit('setError', null)}, 10000)
      }   
    }   
  })  
}

export default new Vuex.Store({
  state: {
    searchAPI: "",
    pools: [],
    showPools: false,
    fatal: "",
    searching: false,
    searched: false,
    error: "",
    searchSummary: "",
    hits: [],
    total: 0,
    page: 0,
    pageSize: 25,
    query: {
      keyword: "",
      author: "",
      title: "",
      subject: "",
    },
  },
  getters: {
    getField,
    hasResults: state => {
      return state.searched
    },
    getPagination: state => {
      return {
        start: state.page * state.pageSize, rows: state.pageSize,
      }
    }
  },
  mutations: {
    updateField,
    showPoolsOverlay(state, show) {
      state.showPools = show
    },
    setPools(state, data) {
      state.pools = data
      if (state.pools.length == 0 ) {
        state.fatal = "No search pools configured"
      }
    },
    setFatalError(state, err) {
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
    setSearchResults(state, results) {
      let pr = results.pool_results[0] // just take the first for now
      state.searchSummary = results.pools_searched+ " pools searched in "+results.total_time_ms+"ms. "+results.total_hits+" hits."
      if (pr.pagination.total > 0) {
        state.hits = pr.record_list
      } else {
        state.hits = []
      }
      state.total = pr.pagination.total
      state.page = pr.pagination.start / state.pageSize
      state.searched = true
    },
    gotoFirstPage(state) {
      state.page = 0
    },
    gotoLastPage(state) {
      state.page = Math.floor( state.total / state.pageSize)
    },
    nextPage(state) {
      state.page++
    },
    prevPage(state) {
      state.page--
    },
    resetSearchResults(state) {
      state.page = 0
      state.total = 0
      state.searched = false
    },
    clearAdvancedSearch(state) {
      state.query.keyword = ""
      state.query.author = ""
      state.query.title = ""
      state.query.subject = ""
      state.searched = false
    }
  },
  actions: {
    firstPage( ctx ) {
      ctx.commit('gotoFirstPage')
      ctx.dispatch("doSearch")
    },
    prevPage( ctx ) {
      ctx.commit('prevPage')
      ctx.dispatch("doSearch")
    },
    nextPage( ctx ) {
      ctx.commit('nextPage')
      ctx.dispatch("doSearch")
    },
    lastPage( ctx ) {
      ctx.commit('gotoLastPage')
      ctx.dispatch("doSearch")
    },
    doSearch(ctx) {
      ctx.commit('setError', "")
      ctx.commit('setSearching', true)
      let req = {
        query: buildQueryString(ctx.state.query),
        pagination: ctx.getters.getPagination,
      }
      let url = ctx.state.searchAPI+"/api/search"
      axios.post(url, req).then((response)  =>  {
        ctx.commit('setSearchResults', response.data)
        ctx.commit('setSearching', false)
      }).catch((error) => {
        ctx.commit('setError', error) 
        ctx.commit('setSearching', false)
      })
    },
    getConfig(ctx) {
      axios.get("/config").then((response)  =>  {
        ctx.commit('setConfig', response.data )
        ctx.dispatch('getPools' )
      }).catch((error) => {
        ctx.commit('setFatalError', "Unable to get configuration: "+error.response.data) 
      })
    },
    getPools(ctx) {
      let url = ctx.state.searchAPI+"/api/pools"
      axios.get(url).then((response)  =>  {
        ctx.commit('setPools', response.data )
      }).catch((error) => {
        ctx.commit('setFatalError', "Unable to pools: "+error.response.data) 
      })
    }
  },
  plugins: [errorPlugin]
})

const buildQueryString = (params) => { 
  // params: keyword (no field designation), author, title, subject
  let mapping  = {"title": "title_t", "author": "author_t", "subject": "subject_t", "keyword": "NONE"}
  let q = []
  for (let [key, value] of Object.entries(params)) {
    let qv = value.trim()
    if (qv.length == 0) continue

    if (qv.includes(" ")) {
      qv = `"${value}"`
    }
    let fn = mapping[key]
    if (fn === "NONE") {
      q.push(qv)
    } else {
      q.push(`${fn}:${qv}`)
    }
  }
  return q.join(" +")
}
