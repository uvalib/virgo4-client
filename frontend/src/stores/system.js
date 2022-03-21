import { defineStore } from 'pinia'
import { useAlertStore } from "@/stores/alert"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"
import axios from 'axios'

export const useSystemStore = defineStore('system', {
	state: () => ({
      userStore: useUserStore(),
      preferencesStore: usePreferencesStore(),
      pageTitle: "Search",
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
      allPickupLibraries: [],
      printing: false,
   }),

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
      pickupLibraries: state => {
         return state.allPickupLibraries.filter( p => p.enabled == true)
      }
   },

   actions: {
      setCodes( codes) {
         this.locationCodes =  codes.locations.sort( (a,b) => {
            if (a.id < b.id) return -1
            if (a.id > b.id) return 1
            return 0
         })

        this.libraryCodes =  codes.libraries.sort( (a,b) => {
            if (a.id < b.id) return -1
            if (a.id > b.id) return 1
            return 0
         })
      },
      setSessionExpired() {
         this.sessionExpired = true
         setTimeout(() => {  this.sessionExpired=false }, 15000)
      },
      closeTraslateMessage() {
         this.seenTranslateMsg = true
         this.translateMessage = ""
      },
      setFatal(err) {
         this.fatal = err
         this.router.push( "/error" )
      },
      clearMessage() {
         this.message.type = "none"
         this.message.title = "",
         this.message.content = "",
         this.message.detail = ""
      },
      setMessage(msg) {
         this.message.type = "info"
         this.message.title = "Virgo Message",
         this.message.content = msg,
         this.message.detail = ""
      },
      setSearchError(errorInfo) {
         this.message.type = "error"
         this.message.title = "Virgo Search Error",
         this.message.content = errorInfo.message,
         this.message.detail = errorInfo.detail
      },
      setError(error) {
         this.message.type = "none"
         this.message.title = ""
         this.message.content = ""
         this.message.detail = ""

         if (error.response) {
            this.message.type = "error"
            this.message.title = "Virgo Error"
            this.message.content = error.response.data
         } else if (error.message) {
            this.message.type = "error"
            this.message.title = "Virgo Error"
            this.message.content = error.message
            if ( error.details ) {
               this.message.detail = error.details
            }
            if ( error.title ) {
               this.message.title = error.title
            }
         } else {
            this.message.type = "error"
            this.message.title = "Virgo Error"
            this.message.content = error
         }
      },

      setConfig(cfg) {
         this.searchAPI = cfg.searchAPI
         this.translateMessage = cfg.translateMessage
         this.kiosk = cfg.kiosk
         this.devServer = cfg.devServer
         this.availabilityURL = cfg.availabilityURL
         this.citationsURL = cfg.citationsURL
         this.collectionsURL = cfg.collectionsURL
         this.hsILLiadURL = cfg.hsILLiadURL
         this.shelfBrowseURL = cfg.shelfBrowseURL
         this.allPickupLibraries = cfg.pickupLibraries
      },
      async getConfig() {
         if (this.searchAPI != "") {
            return
         }
         let host = window.location.hostname
         return axios.get("/config", {headers: {V4Host:host}}).then((response) => {
            this.setConfig(response.data)
            if (response.data.firebase) {
               const alertStore = useAlertStore()
               alertStore.setConfig(response.data)
            }

            // append credentials to header if needed
            axios.interceptors.request.use( async config => {
               let url = config.url
               if ( (url.match(/\/api\//) && !url.match(/\/api\/pools/)) ||
                     url.match(this.availabilityURL) ||
                     url.match(this.citationsURL) ||
                     url.match("pda-ws") ) {
                  config.headers['Authorization'] = 'Bearer ' + this.userStore.authToken
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
                        await this.userStore.refreshAuth()
                        origConfig.headers['Authorization'] = 'Bearer ' + this.userStore.authToken
                        console.log("RETRY "+origConfig.url+" AS "+this.userStore.role)
                        return axios(origConfig)
                     }
                  }
                  return Promise.reject(err)
               })
         }).catch((error) => {
            this.setFatal("Unable to get configuration: " + error)
         })
      },

      getVersion() {
         axios.get("/version").then((response) => {
            this.version = `${response.data.version}.${response.data.build}`
         })
      },

      getCodes() {
         axios.get("/api/codes").then((response) => {
            this.setCodes(response.data.availability_list)
         }).catch((error) => {
            this.setError("Unable to get codes: " + error.response.data)
         })
      },

      reportError(data) {
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

         if (this.userStore.sSignedIn()) {
            err.signedIn = true
            err.user = this.userStore.signedInUser
         } else {
            err.signedIn = false
         }
         axios.post("/api/error", err)
      },

      async updatePickupLibrary(lib) {
         return axios.post(`/api/pickuplibraries/${lib.primaryKey}/update`, lib).then((response) => {
            let rec = response.data
            let recIdx = this.allPickupLibraries.findIndex( p => p.primaryKey == rec.primaryKey)
            if (recIdx > -1) {
               this.allPickupLibraries.splice(recIdx,1,rec)
            }
         }).catch((error) => {
            this.setError("Unable to update pickup library: " + error.response.data)
         })
      },

      async addPickupLibrary(lib) {
         return axios.post(`/api/pickuplibraries`, lib).then((response) => {
            this.allPickupLibraries.push(response.data)
         }).catch((error) => {
           this.setError("Unable to add pickup library: " + error.response.data)
         })
      },

      deletePickupLibrary(library) {
         axios.delete(`/api/pickuplibraries/${library.primaryKey}`).then(() => {
            let idx = this.allPickupLibraries.findIndex( p => p.primaryKey == library.primaryKey )
            if ( idx > -1) {
               this.allPickupLibraries.splice(idx,1)
            }
            this.preferencesStore.pickupLibraryDeleted(library.id)
         }).catch((error) => {
            this.setError("Unable to delete pickup library: " + error.response)
         })
      }
   }
})
