import axios from 'axios'

const system = {
   namespaced: true,
   state: {
      newVersion: false,
      kiosk: false,
      fatal: "",
      error: "",
      version: "unknown",
      userMenuOpen: false,
      searchAPI: "",
      seenTranslateMsg: false,
      translateMessage: "",
      sessionMessage: "",
      displayWidth: window.innerWidth,
   },

   getters: {
      isKiosk: state => {
         return state.kiosk
      },
      hasTranslateMessage: state => {
         return state.translateMessage.length > 0 && state.seenTranslateMsg == false
      }
   },

   mutations: {

      newVersionDetected(state) {
         state.newVersion = true
      },

      setSessionExpiredMessage(state) {
         let link = "<a href='/signin'>here</a>"
         state.sessionMessage = `Your Virgo session has expired. Click ${link} to sign in again.`
         setTimeout(() => {  state.sessionMessage = "" }, 10000)
      },
      setDisplayWidth(state, w) {
         state.displayWidth = w
      },
      closeTraslateMessage(state) {
         state.seenTranslateMsg = true
         state.translateMessage = ""
      },

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
         if (error != "" ) {
            setTimeout(() => {  state.error = "" }, 10000)
         }
      },

      setConfig(state, cfg) {
         state.searchAPI = cfg.searchAPI
         state.translateMessage = cfg.translateMessage
         state.kiosk = cfg.kiosk
      },
   },

   actions: {
      // Call getConfig at startup to get client configuration parameters
      getConfig(ctx) {
         let host = window.location.hostname
         return axios.get("/config", {headers: {V4Host:host}}).then((response) => {
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