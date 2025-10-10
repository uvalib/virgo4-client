import { defineStore } from 'pinia'
import axios from 'axios'
import analytics from '../analytics'
import { useCookies } from "vue3-cookies"
import { useSystemStore } from "@/stores/system"
import { useAlertStore } from "@/stores/alert"
import { usePreferencesStore } from "@/stores/preferences"
import { useRestoreStore } from "@/stores/restore"
import { useBookmarkStore } from "@/stores/bookmark"
import { useSearchStore } from "@/stores/search"
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"

function parseJwt(token) {
   var base64Url = token.split('.')[1]
   var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
   var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
   }).join(''))

   return JSON.parse(jsonPayload);
}

export const useUserStore = defineStore('user', {
	state: () => ({
      authToken: "",
      authorizing: false,
      signedInUser: "",
      role: "guest",
      sessionType: "",
      accountInfo: {},
      illiad: {hasAccount: false, cleared: "", leoLocation: ""},
      claims: {},
      checkouts: [],
      showRenewSummary: false,
      renewSummary: {renewed: -1, failed: -1, failures: []},
      checkoutsOrder: "AUTHOR_ASC",
      bills: [],
      requests: {illiad: [], holds: []},
      lookingUp: false,
      lookupILLCheckouts: false,
      lookupUVACheckouts: false,
      renewing: false,
      authTriesLeft: 10,
      authMessage: "",
      lockedOut: false,
      parsedJWT: {},
      noILSAccount: false,
      tempAccount: {},
      showRequestDialog: false,
      accountRequested: false,
      sirsiUnavailable: false,
      requestInterceptor: null,
      responseInterceptor: null
   }),

   getters: {
      canChangePassword(state) {
         if ( this.hasAccountInfo == false ) return false
         if ( state.sessionType == "netbadge") return false
         return true
      },
      canRequestAccount: state => {
         if (state.signedInUser.length == 0 ) return false
         if (state.noILSAccount == false ) return false
         if (!state.accountInfo.description ) return false
         if (state.sirsiUnavailable) return false
         return true
      },
      isGuest: (state) => {
         return (state.role == 'guest' || state.role == '')
      },
      isUVA: (state) => {
         return state.claims.isUVA
      },
      isStaff: (state) => {
         // users that are members of lib-virgo4-staff or lb-scpres-joint
         return state.role == 'staff'
      },
      isAdmin: (state) => {
        return (state.role == 'admin')
      },
      isGraduate: (state) => {
         if ( state.role == 'guest' || state.role == '') return false
         if ( Object.keys(state.accountInfo).length == 0) return false
         if (state.accountInfo.description.toLowerCase().includes("graduate student")) return true
         if (state.accountInfo.profile == "GRADUATE") return true
         return false
      },
      isUndergraduate: (state) => {
         if ( state.role == 'guest' || state.role == '' ) return false
         if ( Object.keys(state.accountInfo).length == 0) return false
         if (state.accountInfo.description.toLowerCase().includes("undergraduate")) return true
         if (state.accountInfo.profile == "UNDERGRAD") return true
         return false
      },
      canPurchase: (state) => {
         return state.claims.canPurchase
      },
      canUseLEO: (state) => {
         return state.claims.canLEO
      },
      canUseLEOPlus: (state) => {
         return state.claims.canLEOPlus
      },
      useSIS: (state) => {
         return state.claims.useSIS
      },
      canMakeReserves: (state) => {
         return state.claims.canPlaceReserve
      },
      canUseILLiad: (state) => {
         return state.claims.canUseILLiad
      },
      isBarred: state => {
         return state.accountInfo.standing == "BARRED" ||  state.accountInfo.standing == "BARR-SUPERVISOR"
      },
      hasIlliad: state => {
         return state.illiad.hasAccount
      },
      illiadCleared: (state) => {
         return state.illiad.cleared.toLowerCase()
      },
      illiadBlocked: (state) => {
         if(state.illiad.cleared == "Yes"){
            return false
         }
         console.log("Blocking ILLiad. Cleared: "+state.illiad.cleared)
         return true
      },
      leoLocation: (state) => {
         return state.illiad.leoLocation
      },
      isHSLUser: state => {
         return state.claims.homeLibrary == "HEALTHSCI"
      },
      isLawUser: state => {
         return state.claims.homeLibrary == "LAW"
      },
      itemsOnNotice: state => {
         return state.checkouts.filter( co=> co.overdue || co.recallDueDate != "")
      },
      itemsWithFines: state => {
         return state.checkouts.filter( co=> parseFloat(co.overdueFee) > 0 )
      },
      totalFines: state => {
         let total = 0.00
         state.checkouts.forEach( co=> {
            let f = parseFloat(co.overdueFee)
            total += f
         })
         return total.toFixed(2)
      },
      isSignedIn: state => {
         return state.signedInUser != ""  && state.authToken != "" &&
            state.sessionType != "" && state.sessionType != "none"
      },
      hasAccountInfo: state => {
         if (state.signedInUser.length == 0 || state.role == '')  return false
         if ( Object.keys(state.accountInfo).length == 0) return false
         if (state.accountInfo.id != state.signedInUser) return false
         return (state.noILSAccount != true)
      },
      libraries() {
         // all libraries are available by default. Filter out some based on user criteria
         const system = useSystemStore()
         let pickupLibraries = system.pickupLibraries.slice()
         if (this.isHSLUser == false) {
            pickupLibraries = pickupLibraries.filter( p => p.id != "HEALTHSCI" )
         }
         if (this.canUseLEO == false || this.claims.homeLibrary == "JAG" || this.isHSLUser ) {
            pickupLibraries = pickupLibraries.filter( p => p.id != "LEO")
         }

         return pickupLibraries
       },
       singleEmail: state => {
         // Email may be comma separated. Use this when only one is required
         if (state.accountInfo.email) {
            return state.accountInfo.email.split(',')[0].trim()
         } else {
            return ""
         }
       }

   },

   actions: {
      clearRenewSummary() {
         this.renewSummary = {renewed: -1, failed: -1, failures: []}
         this.showRenewSummary = false
      },
      setCheckouts(co) {
         this.checkouts = co
         this.clearRenewSummary()
      },
      sortCheckouts(order) {
         this.checkoutsOrder = order
         this.checkouts.sort( (a,b) => {
            if ( order == "OVERDUE") {
               // Sort recalls to top, then Due date, others are last
               // dates are also sorted inside each group
               let aRecall = new Date(a.recallDueDate).valueOf()
               let bRecall = new Date(b.recallDueDate).valueOf()
               let aDue = new Date(a.due).valueOf()
               let bDue = new Date(b.due).valueOf()

               if (!isNaN(aRecall) && isNaN(bRecall)) return -1
               if (isNaN(aRecall) && !isNaN(bRecall)) return 1
               if (!isNaN(aDue) && isNaN(bDue)) return -1
               if (isNaN(aDue) && !isNaN(bDue)) return 1

               return (aRecall - bRecall) || (aDue - bDue)
            }

            let keyA = a.author.toUpperCase()
            let keyB = b.author.toUpperCase()

            if (order.includes("TITLE")) {
               keyA = a.title.toUpperCase()
               keyB = b.title.toUpperCase()
            }
            if (order.includes("DUE")){
               // Sort by due date, then recall, then others last
               keyA = (a.due.split("T")[0] || a.recallDueDate) + a.title.toUpperCase()
               keyB = (b.due.split("T")[0] || b.recallDueDate ) + b.title.toUpperCase()
            }
            if (order.includes("ASC")) {
               if (keyA < keyB) {
                  return -1
               }
               if (keyA > keyB) {
                  return 1
               }
               return 0
            } else {
               if (keyA < keyB) {
                  return 1
               }
               if (keyA > keyB) {
                  return -1
               }
               return 0
            }
         })
      },
      setRenewResults(renewResults) {
          // renewResults: [{barcode,dueDate,recallDueDate,renewalDate,message,status,success}]
         this.renewSummary.renewed = 0
         this.renewSummary.failed = 0
         renewResults.forEach( renew => {
            let co = this.checkouts.find( co => co.barcode == renew.barcode)
            if ( co ) {
               if (renew.success == false) {
                  this.renewSummary.failed++
                  this.renewSummary.failures.push({barcode: renew.barcode, message: renew.message})
                  co.message = renew.message
               } else {
                  co.due = renew.dueDate
                  co.recallDueDate = renew.recallDueDate
                  co.renewDate = renew.renewalDate
                  this.renewSummary.renewed++
               }
            }
         })
         this.showRenewSummary = true
      },
      setAuthFailure(data) {
         if (data.response && data.response.data) {
            //barcode, signedId, message, attemptsLeft
            let resp = data.response.data
            this.authTriesLeft = resp.attemptsLeft
            this.authMessage = resp.message
            this.lockedOut =  resp.lockedOut
         } else {
            this.authMessage = "Sign in failed: "+data
         }
      },
      clearAuthMessages() {
         this.authMessage = ""
         this.lockedOut = false
         this.authTriesLeft = 10
      },
      async setUserJWT(jwtStr) {
         let parsed = parseJwt(jwtStr)
         if( parsed.role === "admin" ) {
            this.parsedJWT = JSON.stringify(parsed,undefined, 2);
         }

         this.claims = {
            canPurchase: parsed.canPurchase,
            homeLibrary: parsed.homeLibrary,
            canLEO: parsed.canLEO,
            canLEOPlus: parsed.canLEOPlus,
            canUseILLiad: parsed.canUseILLiad,
            canPlaceReserve: parsed.canPlaceReserve,
            useSIS: parsed.useSIS,
            isUVA: parsed.isUva,
            Barcode: parsed.barcode,
         }

         this.authMessage = ""
         this.lockedOut = false
         this.signedInUser = parsed.userId
         this.authToken = jwtStr
         this.sessionType =  parsed.authMethod
         this.role = parsed.role

         localStorage.setItem("v4_jwt", jwtStr)

         // Use the new JWT token in auth headers for all a requests and handle reauth if it expires
         if ( this.requestInterceptor != null ) {
            console.log("remove existing request intercptor")
            axios.interceptors.request.eject( this.requestInterceptor)
         }
         const system = useSystemStore()
         this.requestInterceptor = axios.interceptors.request.use( async config => {
            if ( config.url.indexOf("/api") == 0 ) {
               config.headers['X-Virgo-Version'] = system.version
            }
            if ( system.authRequired( config.url ) ) {
               config.headers['Authorization'] = 'Bearer ' + this.authToken
                // API requests need also host to toggle features on prod / dev
               if ( config.url.indexOf("/api") == 0 ) {
                  config.headers['V4Host']= window.location.hostname
               }
            }
            return config
         }, error => {
            return Promise.reject(error)
         })

         if ( this.responseInterceptor != null ) {
            console.log("remove existing response intercptor")
            axios.interceptors.response.eject(this.responseInterceptor )
         }
         this.responseInterceptor = axios.interceptors.response.use(
            res => res,
            async err => {
               if (err.response && err.response.status == 406) {
                  // 406 is returned when JWT versions are mismatched. force a signout
                  await this.signout(false)
                  system.setSessionExpired()
                  return Promise.reject(err)
               }
               if (err.response && err.response.status == 426) {
                  this.router.push("/newversion")
                  return Promise.reject(err)
               }
               // Retry non-auth requests that resulted in 401 ONCE
               if ( system.isAuthRequest( err.config.url ) == false ) {
                  if (err.response && err.response.status == 401 && err.config._retry !== true) {
                     err.config._retry = true
                     await this.refreshAuth()
                     err.config.headers['Authorization'] = 'Bearer ' + this.authToken
                     console.log("RETRY "+err.config.url+" AS "+this.role)
                     return axios(err.config)
                  }
               }
               return Promise.reject(err)
            }
         )
      },
      setAccountInfo(data) {
         this.accountInfo = data.user
         this.noILSAccount = data.user.noAccount
         delete  this.accountInfo.noAccount
         this.sirsiUnavailable = data.user.sirsiUnavailable
         this.illiad = data.illiad

         if (this.role == "guest" && this.sessionType == "netbadge" && this.signedInUser != "anonymous") {
            this.noILSAccount = true
            this.accountRequested = false
            if (localStorage.getItem("v4_requested") ) {
               this.accountRequested = true
            }
            this.showRequestDialog = true
         } else {
            localStorage.removeItem("v4_requested")
            this.accountRequested = false
            this.noILSAccount = false
         }
      },
      clear() {
         this.$reset()
      },
      flagAccountRequested() {
         this.accountRequested = true
         localStorage.setItem("v4_requested", "yes")
      },

      async refreshAuth() {
         console.log("Refresh authentication...")
         if ( this.sessionType != "netbadge" && (this.role == "" || this.role == "guest") ) {
            console.log("Get GUEST authorization token")
            await axios.post("/authorize", null).then( response => {
               this.setUserJWT(response.data)
               console.log("GUEST authorization successful")
            })
         } else {
            console.log("Refreshing sign-in session")
            await axios.post("/api/reauth", null).then( response => {
               this.setUserJWT(response.data )
               console.log(`Session refreshed`)
            }).catch( async () => {
               // Signout, but preserve the search as it will be retried as guest
               const system = useSystemStore()
               console.log("reauth failed, signing out")
               await this.signout(false)
               system.setSessionExpired()
            })
         }
      },

      async overrideClaims() {
         if (this.isAdmin){
            const { cookies } = useCookies()
            this.authorizing = true
            let claims = this.parsedJWT
            return axios.post("/api/admin/claims", claims ).then((_response) => {
               let jwtStr = cookies.get("v4_jwt")
               this.setUserJWT(jwtStr)
               this.authorizing = false
             }).catch((error) => {
               const system = useSystemStore()
               system.setError( error + '<br/>' + error.response.data)
               this.authorizing = false
             })
         }
      },

      getRequests() {
         if (this.isSignedIn == false) return
         if (this.isGuest) return

         this.lookupILLCheckouts = true
         return axios.all([
            axios.get(`/api/users/${this.signedInUser}/holds`),
            axios.get(`/api/users/${this.signedInUser}/illiad`),
         ]).then(axios.spread((holdResponse, illiadResponse) => {
            this.requests = {
               holds: holdResponse.data.holds,
               illiad: illiadResponse.data
            }
         })).catch((error) => {
            const system = useSystemStore()
            if (error.response && error.response.status == 503) {
               system.setILSError(error.response.data)
            } else {
               system.setError( error)
            }
         }).finally(() => { this.lookupILLCheckouts = false })
      },

      async getAccountInfo() {
         if (this.isSignedIn == false) {
            return
         }
         if (this.hasAccountInfo ){
            return
         }

         this.lookingUp = true
         return axios.get(`/api/users/${this.signedInUser}`).then((response) => {
            const bookmarks = useBookmarkStore()
            const preferences = usePreferencesStore()
            const queryStore = useQueryStore()

            this.setAccountInfo(response.data)
            let prefs = JSON.parse(response.data.preferences)
            preferences.setPreferences(prefs)
            bookmarks.setBookmarks(response.data.bookmarks)
            if ( preferences.searchTemplate ) {
               queryStore.setTemplate(preferences.searchTemplate)
            }
            this.lookingUp = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError( error)
            this.lookingUp = false
          })
      },

      renew(barcode) {
         if (this.isSignedIn == false) return
         if (this.isGuest) return

         this.renewing = true
         let data = {barcodes: [barcode]}
         if ( barcode == "all") {
            data.barcodes = this.checkouts.map( co => co.barcode)
         }
         axios.post(`/api/users/${this.signedInUser}/checkouts/renew`, data).then((response) => {
            this.setRenewResults(response.data)
            this.renewing = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError( error)
            this.renewing = false
          })
      },

      async getCheckouts() {
         if (this.signedInUser.length == 0 || this.noILSAccount) {
            return
         }

         this.lookupUVACheckouts = true
         return axios.get(`/api/users/${this.signedInUser}/checkouts`).then((response) => {
            this.setCheckouts(response.data)
            this.sortCheckouts(this.checkoutsOrder)
         }).catch((error) => {
            const system = useSystemStore()
            if (error.response && error.response.status == 503) {
               system.setILSError(error.response.data)
            } else {
               system.setError( error)
            }
         }).finally(() => { this.lookupUVACheckouts = false })
      },
      async downloadCheckoutsCSV() {
         if ( this.checkouts.length == 0) {
            return
         }
         return axios.get(`/api/users/${this.signedInUser}/checkouts.csv`).then((response) => {
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            const fileLink = document.createElement('a');

            fileLink.href = fileURL;
            fileLink.setAttribute('download', response.headers["content-disposition"].split("filename=")[1])
            document.body.appendChild(fileLink);

            fileLink.click();
            window.URL.revokeObjectURL(fileURL);

         }).catch((error) => {
            const system = useSystemStore()
            if (error.response && error.response.status == 503) {
               system.setILSError(error.response.data)
            } else {
               system.setError( error)
            }
         })
      },

      getBillDetails() {
         if ( this.bills.length > 0) return
         if ( this.isGuest ) return

         this.lookingUp = true
         axios.get(`/api/users/${this.signedInUser}/bills`).then((response) => {
            this.bills = response.data
            this.lookingUp = false
          }).catch((error) => {
            const system = useSystemStore()
            if (error.response && error.response.status == 503) {
               system.setILSError(error.response.data)
            } else {
               system.setError( error)
            }
            this.lookingUp = false
          })
      },

      async signout(resetSearch) {
         const alerts = useAlertStore()
         const savedSearches = useSearchStore()
         const bookmarks = useBookmarkStore()
         const preferences = usePreferencesStore()

         this.clear()
         preferences.clear()
         bookmarks.clear()
         savedSearches.clear()
         alerts.clearSeenAlerts()
         if ( resetSearch === true) {
            const results = useResultStore()
            results.resetSearch()
         }
         localStorage.removeItem("v4_jwt")
         await axios.post("/signout", null)
         this.router.push("/signedout")
      },

      signin(data) {
         this.authorizing = true
         axios.post("/authenticate/public", data).then( async (_response) => {
            const restore = useRestoreStore()
            const { cookies } = useCookies()

            let jwtStr = cookies.get("v4_jwt")
            this.setUserJWT(jwtStr )
            restore.load()
            await this.getAccountInfo()   // needed for search preferences
            this.getCheckouts()           // needed so the alert icon can show in menubar
            if ( this.isUndergraduate) {
               analytics.trigger('User', 'PIN_SIGNIN', "undergraduate")
            } else if ( this.isGraduate) {
               analytics.trigger('User', 'PIN_SIGNIN', "graduate")
            } else {
               analytics.trigger('User', 'PIN_SIGNIN', "other")
            }

            this.router.push( restore.url ).catch((e)=>{
               if (e.name !== 'NavigationDuplicated') {
                  throw e;
              }
            })
            this.authorizing = false
         }).catch((error) => {
            const system = useSystemStore()
            if (error.response && error.response.status == 503) {
               system.setILSError(error.response.data)
            } else {
               this.setAuthFailure(error)
            }
            this.authorizing = false
          })
      },

      netbadge() {
         this.authorizing = true
         window.location.href = "/authenticate/netbadge"
      },
      updateContactInfo(info) {
         return axios.post(`/api/users/${info.newContact.userID}/contact`, info )
      },
      async submitUserRegistration() {
         this.lookingUp = true
         const system = useSystemStore()
         return axios.post("/api/createTempAccount", this.tempAccount ).then( _ => {
            this.router.push("/signin").then(_=>{
               this.lookingUp = false
               system.setMessage("Thank you for registering. Please check your email for further instructions.")
            })
         }).catch ( error => {
            this.lookingUp = false
            console.log("Unable to request new account: "+error)
            let msg = "System error, we regret the inconvenience. If this problem persists, "
            msg += "<a href='https://search.lib.virginia.edu/feedback' target='_blank'>please contact us.</a>"
            system.setError(msg)
         })
      },
      illiadRegistrationSubmitted() {
         this.illiad.hasAccount = true
         this.illiad.cleared = "No"
      }
   }
})
