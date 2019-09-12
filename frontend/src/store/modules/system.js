import axios from 'axios'

const system = {
   namespaced: true,
   state: {
      fatal: "",
      error: "",
      version: "unknown",
      userMenuOpen: false,
      searchAPI: "",
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
         } else if (error.message) {
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
   },

   actions: {
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
   }
}

export default system