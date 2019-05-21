import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    searchAPI: "",
    fatal: ""
  },
  mutations: {
    setFatalError(state, err) {
      state.fatal = err
    },
    setConfig(state, cfg) {
      state.searchAPI = cfg.searchAPI
    },
  },
  actions: {
    getConfig(ctx) {
      axios.get("/config").then((response)  =>  {
        ctx.commit('setConfig', response.data )
      }).catch((error) => {
        ctx.commit('setError', "Unable to get recent submissions: "+error.response.data, {root: true}) 
      })
    }
  }
})
