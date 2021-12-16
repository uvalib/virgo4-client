import axios from 'axios'

const system = {
   namespaced: true,
   state: {
      versionIntervalID: -1,
      newVersion: false,
      kiosk: false,
      devServer: false,
      fatal: "",
      ilsError: "",
      message: {
         type: "none",
         title: "",
         content: "",
         detail: ""
      },
      version: "unknown",
      availabilityURL: "",
      hsIlliadURL: "",
      citationsURL: "",
      collectionsURL: "",
      shelfBrowseURL: "",
      searchAPI: "",
      seenTranslateMsg: false,
      translateMessage: "",
      sessionExpired: false,
      displayWidth: window.innerWidth,
      locationCodes: [],
      libraryCodes: [],
      pickupLibraries: [
         {id: 'SCI-ENG', name: 'Brown Science and Engineering Library (Clark Hall)'},
         {id: 'CLEMONS', name: 'Clemons Library'}
      ],
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
      },
      hasMessage: state => {
         return state.message.type != "none" && state.message.content != ""
      },
      hasError: state => {
         return state.message.type == "error"
      },
   },

   mutations: {
      setVersionIntervalID(state, tid) {
         state.versionIntervalID = tid
      },
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
         this.router.push( "/error" )
      },
      clearMessage( state ) {
         state.message.type = "none"
         state.message.title = "",
         state.message.content = "",
         state.message.detail = ""
      },
      setMessage(state, msg) {
         state.message.type = "info"
         state.message.title = "Virgo Message",
         state.message.content = msg,
         state.message.detail = ""
      },
      setSearchError(state, errorInfo) {
         state.message.type = "error"
         state.message.title = "Virgo Search Error",
         state.message.content = errorInfo.message,
         state.message.detail = errorInfo.detail
      },
      setILSError(state, error) {
         state.ilsError = error
      },
      setError(state, error) {
         state.message.type = "none"
         state.message.title = ""
         state.message.content = ""
         state.message.detail = ""

         if (error.response) {
            state.message.type = "error"
            state.message.title = "Virgo Error"
            state.message.content = error.response.data
         } else if (error.message) {
            state.message.type = "error"
            state.message.title = "Virgo Error"
            state.message.content = error.message
            if ( error.details ) {
               state.message.detail = error.details
            }
            if ( error.title ) {
               state.message.title = error.title
            }
         } else {
            state.message.type = "error"
            state.message.title = "Virgo Error"
            state.message.content = error
         }
      },

      setConfig(state, cfg) {
         state.searchAPI = cfg.searchAPI
         state.translateMessage = cfg.translateMessage
         state.kiosk = cfg.kiosk
         state.devServer = cfg.devServer
         state.availabilityURL = cfg.availabilityURL
         state.citationsURL = cfg.citationsURL
         state.collectionsURL = cfg.collectionsURL
         state.hsILLiadURL = cfg.hsILLiadURL
         state.shelfBrowseURL = cfg.shelfBrowseURL
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
            if (response.data.firebase) {
               ctx.dispatch('alerts/setConfig', response.data, {root: true})
            }

            // append credentials to header if needed
            axios.interceptors.request.use( async config => {
               let url = config.url
               if ( (url.match(/\/api\//) && !url.match(/\/api\/pools/)) ||
                     url.match(ctx.state.availabilityURL) ||
                     url.match(ctx.state.citationsURL) ||
                     url.match("pda-ws") ) {
                  config.headers['Authorization'] = 'Bearer ' + ctx.rootState.user.authToken
               }
               return config
            }, error => {
               return Promise.reject(error)
            })

            axios.interceptors.response.use(
               res => res,
               async err => {
                  // If the original request was not an auth request, and it resulted in a 401,
                  // reauth as guest and retry ONCE
                  var origConfig = err.config
                  if ( !origConfig.url.match(/\/api\/reauth/) && !origConfig.url.match(/\/authenticate/) ) {
                     if (err.response && err.response.status == 401 && origConfig._retry !== true) {
                        origConfig._retry = true
                        console.log("REFRESH AUTHENTICATION")
                        await ctx.dispatch("user/refreshAuth", null, {root:true})
                        origConfig.headers['Authorization'] = 'Bearer ' + ctx.rootState.user.authToken
                        console.log("RETRY "+origConfig.url+" AS "+ctx.rootState.user.role)
                        return axios(origConfig)
                     }
                  }
                  return Promise.reject(err)
               })
         }).catch((error) => {
            ctx.commit('setFatal', "Unable to get configuration: " + error)
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
            ctx.commit('setError', "Unable to get codes: " + error.response.data)
            ctx.commit('setSearching', false, {root: true})
         })
      },

      reportError(ctx, data) {
         let err = {
            url: this.router.currentRoute.value.fullPath,
            userAgent: navigator.userAgent,
            error: JSON.stringify(data)
         }
         if (err.error == "{}" ) {
            err.error = data.toString()
         }

         // dont report network errors!
         if ( err.error.includes("System error, we regret the inconvenience") ||
              err.error.includes("Network Error") ||
              err.error.includes("status code 401") ||
              err.error.includes("ECONNREFUSED") ) {
            return
         }

         if (ctx.rootGetters["user/isSignedIn"]) {
            err.signedIn = true
            err.user = ctx.rootState.user.signedInUser
         } else {
            err.signedIn = false
         }
         axios.post("/api/error", err)
      }
   }
}

export default system
