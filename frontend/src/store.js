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
    fatal: "",
    searching: false,
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
    search_preferences: {
      default_search_pool: "catalog"
    }
  },
  getters: {
    getField,
    hasResults: state => {
      return state.hits.length > 0
    },
    getPagination: state => {
      return {
        start: state.page * state.pageSize, rows: state.pageSize,
      }
    }
  },
  mutations: {
    updateField,
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
      let pr = results.pool_results[0] // only one pool for now
      state.searchSummary = pr.summary + " in "+ pr.elapsed_ms + "ms"
      state.hits = pr.record_list
      state.total = pr.pagination.total
      state.page = pr.pagination.start / state.pageSize
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
    },
    clearAdvancedSearch(state) {
      state.query.author = ""
      state.query.title = ""
      state.query.subject = ""
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
        query: ctx.state.query,
        pagination: ctx.getters.getPagination,
        search_preferences: ctx.state.search_preferences
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
      }).catch((error) => {
        ctx.commit('setFatalError', "Unable to get configuration: "+error.response.data) 
      })
    }
  },
  plugins: [errorPlugin]
})
