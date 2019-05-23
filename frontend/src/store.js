import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    searchAPI: "",
    fatal: "",
    searching: false,
    error: "",
    query: {
      keyword: "",
      author: "",
      title: "",
      subject: "",
    },
    pagination: {
      start: 0,
      rows: 50
    },
    search_preferences: {
      default_search_pool: "catalog"
    }
  },
  getters: {
    getField,
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
  },
  actions: {
    doSearch(ctx) {
      ctx.commit('setSearching', true)
      let req = {
        query: ctx.state.query,
        pagination: ctx.state.pagination,
        search_preferences: ctx.state.search_preferences
      }
      let url = ctx.state.searchAPI+"/api/search"
      axios.post(url, req).then((response)  =>  {
        console.log(response)
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
  }
})
