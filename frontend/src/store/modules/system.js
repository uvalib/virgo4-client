import axios from 'axios'
import router from '../../router'

const system = {
   namespaced: true,
   state: {
      newVersion: false,
      kiosk: false,
      devServer: false,
      fatal: "",
      error: "",
      errorDetail: "",
      ilsError: "",
      message: "",
      version: "unknown",
      availabilityURL: "",
      hsIlliadURL: "",
      citationsURL: "",
      searchAPI: "",
      seenTranslateMsg: false,
      translateMessage: "",
      sessionExpired: false,
      displayWidth: window.innerWidth,
      locationCodes: [],
      libraryCodes: [],
      pickupLibraries: [
         {id: 'SCI-ENG', name: 'Brown Science and Engineering (Clark Hall)'},
         {id: 'CLEMONS', name: 'Clemons'},
      ]
   },

   getters: {
      isKiosk: state => {
         return state.kiosk
      },
      isDevServer: state => {
         return state.devServer
      },
      hasTranslateMessage: state => {
         return state.translateMessage.length > 0 && state.seenTranslateMsg == false
      }
   },

   mutations: {
      setCodes( state,  codes) {
         let locs =  codes.locations.sort( (a,b) => {
            if (a.id < b.id) return -1
            if (a.id > b.id) return 1
            return 0
         })
         state.locationCodes.splice(0, state.locationCodes.length)
         locs.forEach( c => {
            state.locationCodes.push(c)
         })

         let libs =  codes.libraries.sort( (a,b) => {
            if (a.id < b.id) return -1
            if (a.id > b.id) return 1
            return 0
         })
         state.libraryCodes.splice(0, state.libraryCodes.length)
         libs.forEach( c => {
            state.libraryCodes.push(c)
         })
      },
      newVersionDetected(state) {
         state.newVersion = true
      },

      setSessionExpired(state) {
         state.sessionExpired = true
         setTimeout(() => {  state.sessionExpired=false }, 15000)
      },
      clearSessionExpired(state) {
         state.sessionExpired = false
      },
      setDisplayWidth(state, w) {
         state.displayWidth = w
      },
      closeTraslateMessage(state) {
         state.seenTranslateMsg = true
         state.translateMessage = ""
      },

      setVersion(state, data) {
         state.version = `${data.version}.${data.build}`
      },

      setFatal(state, err) {
         state.fatal = err
      },
      setMessage(state, msg) {
         state.message = msg
      },
      setILSError(state, error) {
         state.ilsError = error
      },
      setError(state, error) {
         if (error == null) {
            error = ""
         }
         state.errorDetail = ""
         if (error.response) {
            // Server responded with a status code out of the range of 2xx
            // If this is a 401, a session has expired when making a request.
            if (error.response.status == 401) {
               state.error = ""
               if (state.sessionExpired == false) {
                  state.sessionExpired = true
                  // NOTE: cant dispatch a signout here, so there is a plugin (expired.js) installed.
                  // It looks for setError with a 401 and does the signout
                  setTimeout(() => {  state.sessionExpired=false }, 15000)
                  router.push("/")
               }
            } else {
               state.error = error.response.data
            }
         } else if (error.request) {
            // The request was made but no response was received
            state.error = "Search is non-responsive"
         } else if (error.message) {
            state.error = error.message
            if ( error.details ) {
               state.errorDetail = error.details
            }
         } else {
            // likely just a string error; just set it
            state.error = error
         }
      },

      setConfig(state, cfg) {
         state.searchAPI = cfg.searchAPI
         state.translateMessage = cfg.translateMessage
         state.kiosk = cfg.kiosk
         state.devServer = cfg.devServer
         state.availabilityURL = cfg.availabilityURL
         state.citationsURL = cfg.citationsURL
         state.hsILLiadURL = cfg.hsILLiadURL
      },
   },

   actions: {
      // Call getConfig at startup to get client configuration parameters
      async getConfig(ctx) {
         if (ctx.state.searchAPI != "") {
            return
         }
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
      },

      getCodes(ctx) {
         ctx.commit('setSearching', true, {root: true})
         axios.get("/api/codes").then((response) => {
            ctx.commit('setCodes', response.data.availability_list)
            ctx.commit('setSearching', false, {root: true})
         }).catch((error) => {
            ctx.commit('setFatal', "Unable to get codes: " + error.response.data)
            ctx.commit('setSearching', false, {root: true})
         })
      },
   }
}

export default system
