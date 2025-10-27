import { defineStore } from 'pinia'
import { useAlertStore } from "@/stores/alert"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"
import axios from 'axios'

export const useSystemStore = defineStore('system', {
	state: () => ({
      maxPoolTabs: 3, // number of viaible tabs not counting OTHER
      pageTitle: "Search",
      newVersion: false,
      kiosk: false,
      devServer: false,
      fatal: "",
      message: {
         type: "none",
         title: "",
         content: "",
         detail: ""
      },
      showMessage: false,
      toast: {
         title: "",
         message: "",
         life: 0
      },
      showToast: false,
      version: "unknown",
      hsIlliadURL: "",
      citationsURL: "",
      collectionsURL: "",
      shelfBrowseURL: "",
      hsILLiadURL: "",
      illiadCfg: {},
      searchAPI: "",
      sessionExpired: false,
      locationCodes: [],
      libraryCodes: [],
      allPickupLibraries: [],
      printing: false,
      working: false,
      hideScrollToTop: false,
   }),

   getters: {
      ilsError: state => {
         if (state.message.type == "ilsError") {
            return state.message.content
         }
         return ""
      },
      isKiosk: state => {
         return state.kiosk
      },
      isDevServer: state => {
         return state.devServer
      },
      hasError: state => {
         return state.message.type == "error" || state.message.type == "ilsError"
      },
      departments: state => {
         return state.illiadCfg.departments.map( d => d.name)
      },
      schools: state => {
         return state.illiadCfg.schools
      },
      buildings: state => {
         return state.illiadCfg.buildings
      },
      departmentBuilding: store => {
         return (dept) => {
            let d = store.illiadCfg.departments.find( d => d.name == dept)
            if (d) {
               return d.building
            }
            return ""
         }
      },
      pickupLibraries: state => {
         return state.allPickupLibraries.filter( p => p.enabled == true)
      },
      authRequired: store => {
         return (url) => {
            //  citations and pda requests require auth
            if ( url.match(store.citationsURL) != null  || url.match("pda-ws") != null  ) {
               return true
            }
            // all api requests except /api/pools require auth
            if ( url.match(/\/api\//) != null && url.match(/\/api\/pools/) == null) {
               return true
            }
            return false
         }
      },
      isAuthRequest: () => {
         return (url) => {
            return ( url.indexOf("/api/reauth") == 0 || url.indexOf("/authenticate") == 0 )
         }
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
      setFatal(err) {
         this.fatal = err
         this.reportError(this.fatal)
         this.router.push( "/error" )
      },
      setToast(title, message, life = 5000) {
         this.toast.life = life
         this.toast.message = message
         this.toast.title = title
         this.showToast = true
      },
      clearToast() {
         this.showToast = false
         this.toast.life = 0
         this.toast.message = ""
         this.toast.title = ""
      },
      clearMessage() {
         this.message.type = "none"
         this.message.title = ""
         this.message.content = ""
         this.message.detail = ""
         this.showMessage = false
      },
      setMessage(msg) {
         this.message.type = "info"
         this.message.title = "Virgo Message"
         this.message.content = msg
         this.message.detail = ""
         this.showMessage = true
      },
      setSearchError(errorInfo) {
         this.message.type = "error"
         this.message.title = "Virgo Search Error",
         this.message.content = errorInfo.message,
         this.message.detail = errorInfo.detail
         this.showMessage = true
         this.reportError(this.message)
      },
      setILSError(error) {
         this.showMessage = true
         this.message.type = "ilsError"
         this.message.title = "ILS Error",
         this.message.content = error,
         this.message.detail = ""
         this.reportError(this.message)
      },
      setError(error) {
         if (error.status == 406) {
            // 406 is returned on jwt mismatch. do not show or report this as an error
            return
         }
         this.message.type = "error"
         this.message.title = "Virgo Error"
         this.message.detail = ""
         this.showMessage = true

         if (error.response) {
            this.message.content = error.response.data
         } else if (error.message) {
            this.message.content = error.message
            if ( error.details ) {
               this.message.detail = error.details
            }
            if ( error.title ) {
               this.message.title = error.title
            }
         } else {
            this.message.content = error
         }
         this.reportError(this.message)
      },

      setConfig(cfg) {
         this.searchAPI = cfg.searchAPI
         this.kiosk = cfg.kiosk
         this.devServer = cfg.devServer
         this.citationsURL = cfg.citationsURL
         this.collectionsURL = cfg.collectionsURL
         this.hsILLiadURL = cfg.hsILLiadURL
         this.shelfBrowseURL = cfg.shelfBrowseURL
         this.allPickupLibraries = cfg.pickupLibraries
         this.illiadCfg = cfg.illiad
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

         const user = useUserStore()
         if (user.isSignedIn) {
            err.signedIn = true
            err.user = user.signedInUser
         } else {
            err.signedIn = false
         }
         axios.post("/api/error", err)
      },

      async updatePickupLibrary(lib) {
         console.log(lib)
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

      async addPickupLibrary() {
         const lib = this.allPickupLibraries.pop()
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
            const preferences = usePreferencesStore()
            preferences.pickupLibraryDeleted(library.id)
         }).catch((error) => {
            this.setError("Unable to delete pickup library: " + error.response)
         })
      }
   }
})
