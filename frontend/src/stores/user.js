import { defineStore } from 'pinia'
import axios from 'axios'
import analytics from '../analytics'
import VueCookies from 'vue-cookies'
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
      showForgotPW: false,
      authToken: "",
      authorizing: false,
      signedInUser: "",
      role: "guest",
      sessionType: "",
      accountInfo: {},
      claims: {},
      checkouts: [],
      showRenewSummary: false,
      renewSummary: {renewed: -1, failed: -1, failures: []},
      checkoutsOrder: "AUTHOR_ASC",
      bills: [],
      requests: {illiad: [], holds: []},
      lookingUp: false,
      renewing: false,
      authTriesLeft: 10,
      authMessage: "",
      lockedOut: false,
      parsedJWT: {},
      noILSAccount: false,
      noILLiadAccount: false,
      accountRequest: {name: "", id: "", email: "", phone: "", department: "",
         address1: "", address2: "", city: "", state: "", zip: ""},
      accountRequested: false,
      sirsiUnavailable: false
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

         let desc = state.accountInfo.description.toLowerCase()
         let allowed = desc.includes("alumni") == false
         if (allowed) return true

         // Description includes alumni, so this user can't create a sirsi account.. unless they
         // also have one of these in their description too
         let roles = ["continuing and professional studies student", "contractor", "faculty",
            "staff", "graduate student", "instructor", "sponsored account",
            "student worker", "undergraduate student"]
         desc.split(",").forEach( r => {
            if ( roles.includes( r.trim() ) ) {
               allowed = true
            }
         })
         return allowed
      },
      isGuest: (state) => {
         return (state.role == 'guest' || state.role == '')
       },
       isUVA: (state) => {
          return state.claims.isUVA
       },
      isAdmin: (state) => {
        return (state.role == 'admin')
      },
      isPDAAdmin: (state) => {
         return (state.role == 'pdaadmin')
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
         if ( state.claims.canPurchase ) return state.claims.canPurchase
         return false
      },
      canUseLEO: (state) => {
         if ( state.claims.canLEO ) return state.claims.canLEO
         return false
      },
      canUseLEOPlus: (state) => {
         if ( state.claims.canLEOPlus ) return state.claims.canLEOPlus
         return false
      },
      useSIS: (state) => {
         if ( state.claims.useSIS ) return state.claims.useSIS
         return false
      },
      canMakeReserves: (state) => {
         if ( state.claims.canPlaceReserve ) return state.claims.canPlaceReserve
         return false
      },
      isBarred: state => {
         return state.accountInfo.standing == "BARRED" ||  state.accountInfo.standing == "BARR-SUPERVISOR"
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
         this.renewSummary.renewed = 0
         this.renewSummary.failed = 0
         renewResults.results.forEach( renew => {
            if (renew.success == false) {
               this.renewSummary.failed++
               this.renewSummary.failures.push({barcode: renew.barcode, message: renew.message})
               let co = this.checkouts.find( co => co.barcode == renew.barcode)
               if ( co ) {
                  co.message = renew.message
               }
            } else {
               this.renewSummary.renewed++
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
      setUserJWT(jwtStr) {
         let parsed = parseJwt(jwtStr)
         if( parsed.role === "admin" ) {
            this.parsedJWT = JSON.stringify(parsed,undefined, 2);
         }

         this.claims = {
            canPurchase: parsed.canPurchase,
            homeLibrary: parsed.homeLibrary,
            canLEO: parsed.canLEO,
            canLEOPlus: parsed.canLEOPlus,
            canPlaceReserve: parsed.canPlaceReserve,
            useSIS: parsed.useSIS,
            isUVA: parsed.isUva,
         }
         this.authMessage = ""
         this.lockedOut = false
         this.signedInUser = parsed.userId
         this.authToken = jwtStr
         this.sessionType =  parsed.authMethod
         this.role = parsed.role

         if (this.role == "guest" && this.sessionType == "netbadge" && this.signedInUser != "anonymous") {
            this.noILSAccount = true
            this.accountRequest.name = ""
            this.accountRequest.id = parsed.userId
            this.accountRequest.email = parsed.userId+"@virginia.edu"
            this.accountRequest.phone = ""
            this.accountRequest.department = ""
            this.accountRequest.address1 = ""
            this.accountRequest.address2 = ""
            this.accountRequest.city = ""
            this.accountRequest.state = ""
            this.accountRequest.zip = ""
            if (localStorage.getItem("v4_requested") ) {
               this.accountRequested = true
            }
         }
         localStorage.setItem("v4_jwt", jwtStr)

         // Use the new JWT token in auth headers for all a requests and handle reauth if it expires
         const system = useSystemStore()
         axios.interceptors.request.use( async config => {
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

         axios.interceptors.response.use(
            res => res,
            async err => {
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
         this.accountInfo.leoAddress = data.leoLocation
         this.noILLiadAccount = !data.hasIlliadAccount
         this.noILSAccount = data.user.noAccount
         this.sirsiUnavailable = data.user.sirsiUnavailable
         if (localStorage.getItem("v4_requested") ) {
            this.accountRequested = true
         }
         if ( this.noILSAccount) {
            this.accountRequest.name = data.user.displayName
            this.accountRequest.id = data.user.id
            this.accountRequest.email = data.user.email
            this.accountRequest.phone = ""
            this.accountRequest.department = data.user.department
            this.accountRequest.address1 = ""
            this.accountRequest.address2 = ""
            this.accountRequest.city = ""
            this.accountRequest.state = ""
            this.accountRequest.zip = ""
         }
         delete  this.accountInfo.noAccount
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
            this.authorizing = true
            let claims = this.parsedJWT
            return axios.post("/api/admin/claims", claims ).then((_response) => {
               let jwtStr = VueCookies.get("v4_jwt")
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
         this.lookingUp = true

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
         }).finally(() => { this.lookingUp = false })
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
            if (response.data.user.noILSAccount && this.router.currentRoute.value.path != "/account") {
               this.router.push( "/account" )
            }
            this.lookingUp = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError( error)
            this.lookingUp = false
          })
      },

      renewItem(barcode) {
         if (this.isSignedIn == false) return
         if (this.isGuest) return

         this.renewing = true
         let data = {item_barcode: barcode}
         axios.post(`/api/users/${this.signedInUser}/checkouts/renew`, data).then((response) => {
            this.setCheckouts(response.data.checkouts)
            this.sortCheckouts(this.checkoutsOrder)
            this.setRenewResults(response.data.renewResults)
            this.renewing = false
          }).catch((error) => {
            const system = useSystemStore()
            system.setError( error)
            this.renewing = false
          })
      },

      renewAll() {
         if (this.isSignedIn == false) return
         if (this.isGuest) return

         this.renewing = true
         let data = {item_barcode: "all"}
         axios.post(`/api/users/${this.signedInUser}/checkouts/renew`, data).then((response) => {
            this.setCheckouts(response.data.checkouts)
            this.sortCheckouts(this.checkoutsOrder)
            this.setRenewResults(response.data.renewResults)
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
         })
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

            let jwtStr = VueCookies.get("v4_jwt")
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

      changePassword(data) {
         data['barcode'] = this.accountInfo['barcode']
         return axios.post("/api/change_pin", data)
      },
      changePasswordWithToken(data) {
         return axios.post("/api/change_password_token", data, {_retry: true}) // don't retry
      },
      forgotPassword(barcode) {
         return axios.post("/api/forgot_password", {userBarcode: barcode} )
      },
      async submitNewAccountRequest() {
         this.lookingUp = true
         await axios.post("/api/requests/account", this.accountRequest ).then( _resp => {
            this.lookingUp = false
            this.flagAccountRequested()
            window.scrollTo({
               top: 0,
               behavior: "auto"
            })
         }).catch ( error => {
            const system = useSystemStore()
            console.log("Unable to request new account: "+error)
            let msg = "System error, we regret the inconvenience. If this problem persists, "
            msg += "<a href='https://search.lib.virginia.edu/feedback' target='_blank'>please contact us.</a>"
            system.setError(msg)
            this.lookingUp = false
         })
      },
      updateContactInfo(info) {
         return axios.post(`/api/users/${info.newContact.userID}/contact`, info )
      }
   }
})
