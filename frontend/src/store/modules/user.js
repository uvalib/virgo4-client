import axios from 'axios'
import analytics from '../../analytics'
import { getField, updateField } from 'vuex-map-fields'
import VueCookies from 'vue-cookies'

function parseJwt(token) {
   var base64Url = token.split('.')[1]
   var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
   var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
   }).join(''))

   return JSON.parse(jsonPayload);
}

const user = {
   namespaced: true,
   state: {
      authToken: "",
      authorizing: false,
      signedInUser: "",
      role: "guest",
      sessionType: "",
      accountInfo: {},
      claims: {},
      checkouts: [],
      renewSummary: {renewed: -1, failed: -1, failures: []},
      checkoutsOrder: "AUTHOR_ASC",
      bills: [],
      requests: {illiad: [], holds: []},
      lookingUp: false,
      renewing: false,
      authTriesLeft: 5,
      authMessage: "",
      lockedOut: false,
      parsedJWT: {},
      noILSAccount: false,
      noILLiadAccount: false,
      accountRequest: {name: "", id: "", email: "", phone: "", department: "",
         address1: "", address2: "", city: "", state: "", zip: ""},
      accountRequested: false
   },

   getters: {
      getField,
      hasRenewSummary: (state) => {
         return state.renewSummary.renewed >= 0
      },
      canChangePassword: (state, getters) => {
         if (getters.hasAccountInfo == false ) return false
         if ( state.sessionType == "netbadge") return false
         return true
      },
      canRequestAccount: state => {
         if (state.signedInUser.length == 0 ) return false
         if (state.noILSAccount == false ) return false
         if (!state.accountInfo.description ) return false

         let desc = state.accountInfo.description.toLowerCase()
         let allowed = desc.includes("alumni") == false
         if (allowed) return true

         // Description includes alumni, so this user can't create a sirsi account.. unles they
         // also have one of these in their description too
         let roles = ["continuing and professional studies student", "contractor", "faculty",
            "staff", "graduate student", "instructor", "sponsored account staff",
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
         return state.checkouts.filter( co=> co.overdue || co.recallDate != "")
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
      libraries: (_state, getters, rootState) => {
         let pickupLibraries = rootState.system.pickupLibraries.slice()

         if (getters.isHSLUser) {
            pickupLibraries.push({id: "HEALTHSCI", name: "Health Sciences Library"})
         }
         if (getters.isLawUser) {
            pickupLibraries.push({id: "LAW", name: "Law Library"})
         }
         if (getters.canUseLEO) {
            pickupLibraries.push({id: "LEO", name: 'LEO delivery to my department' })
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

   mutations: {
      updateField,
      clearRenewSummary(state) {
         state.renewSummary = {renewed: -1, failed: -1, failures: []}
      },
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      setRenewing(state, flag) {
         state.renewing = flag
      },
      setCheckouts(state, co) {
         state.checkouts = co
         state.renewSummary = {renewed: -1, failed: -1, failures: []}
      },
      sortCheckouts(state, order) {
         state.checkoutsOrder = order
         state.checkouts.sort( (a,b) => {
            if ( order == "OVERDUE") {
               // Sort recalls to top, then Due date, others are last
               // dates are also sorted inside each group
               let aRecall = new Date(a.recallDate).valueOf()
               let bRecall = new Date(b.recallDate).valueOf()
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
               keyA = a.due.split("T")[0] || a.recallDate || "a"
               keyB = b.due.split("T")[0] || b.recallDate || "a"
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
      setRequests(state, reqs) {
         state.requests = reqs
      },
      setRenewResults(state, renewResults) {
         state.renewSummary.renewed = 0
         state.renewSummary.failed = 0
         renewResults.results.forEach( renew => {
            if (renew.success == false) {
               state.renewSummary.failed++
               state.renewSummary.failures.push({barcode: renew.barcode, message: renew.message})
               let co = state.checkouts.find( co => co.barcode == renew.barcode)
               if ( co ) {
                  co.message = renew.message
               }
            } else {
               state.renewSummary.renewed++
            }
         })
      },
      setAuthorizing(state, auth) {
         state.authorizing = auth
      },
      setAuthFailure(state, data) {
         if (data.response && data.response.data) {
            //barcode, signedId, message, attemptsLeft
            let resp = data.response.data
            state.authTriesLeft = resp.attemptsLeft
            state.authMessage = resp.message
            state.lockedOut =  resp.lockedOut
         } else {
            state.authMessage = "Sign in failed: "+data
         }
      },
      clearAuthMessages(state) {
         state.authMessage = ""
         state.lockedOut = false
         state.authTriesLeft = 5
      },
      setUserJWT(state, jwtStr) {
         let parsed = parseJwt(jwtStr)
         if( parsed.role === "admin" ) {
            state.parsedJWT = JSON.stringify(parsed,undefined, 2);
         }

         state.claims = {
            canPurchase: parsed.canPurchase,
            homeLibrary: parsed.homeLibrary,
            canLEO: parsed.canLEO,
            canLEOPlus: parsed.canLEOPlus,
            canPlaceReserve: parsed.canPlaceReserve,
            useSIS: parsed.useSIS,
            isUVA: parsed.isUva,
         }
         state.authMessage = ""
         state.lockedOut = false
         state.signedInUser = parsed.userId
         state.authToken = jwtStr
         state.sessionType =  parsed.authMethod
         state.role = parsed.role

         if (state.role == "guest" && state.sessionType == "netbadge" && state.signedInUser != "anonymous") {
            state.noILSAccount = true
            state.accountRequest.name = ""
            state.accountRequest.id = parsed.userId
            state.accountRequest.email = parsed.userId+"@virginia.edu"
            state.accountRequest.phone = ""
            state.accountRequest.department = ""
            state.accountRequest.address1 = ""
            state.accountRequest.address2 = ""
            state.accountRequest.city = ""
            state.accountRequest.state = ""
            state.accountRequest.zip = ""
            if (localStorage.getItem("v4_requested") ) {
               state.accountRequested = true
            }
         }
         localStorage.setItem("v4_jwt", jwtStr)
      },
      setAccountInfo(state, data) {
         state.accountInfo = data.user
         state.accountInfo.leoAddress = data.leoLocation
         state.noILLiadAccount = !data.hasIlliadAccount
         state.noILSAccount = data.user.noAccount
         if (localStorage.getItem("v4_requested") ) {
            state.accountRequested = true
         }
         if ( state.noILSAccount) {
            state.accountRequest.name = data.user.displayName
            state.accountRequest.id = data.user.id
            state.accountRequest.email = data.user.email
            state.accountRequest.phone = ""
            state.accountRequest.department = data.user.department
            state.accountRequest.address1 = ""
            state.accountRequest.address2 = ""
            state.accountRequest.city = ""
            state.accountRequest.state = ""
            state.accountRequest.zip = ""
         }
         delete  state.accountInfo.noAccount
      },
      clear(state) {
         state.accountRequest =  {name: "", id: "", email: "", phone: "", department: "",
            address1: "", address2: "", city: "", state: ""}
         state.signedInUser = ""
         state.sessionType = ""
         state.accountInfo = {}
         state.authTriesLeft = 5
         state.authMessage = ""
         state.authToken = ""
         state.role = "guest"
         state.lockedOut = false
         state.checkouts.splice(0, state.checkouts.length)
         state.renewSummary = {renewed: 0, failed: 0, failures: []}
         state.bills.splice(0, state.bills.length)
         VueCookies.remove("v4_optout")
         localStorage.removeItem("v4_jwt")
         localStorage.removeItem("v4_requested")
         state.accountRequested = false
         state.noILSAccount = false
         state.noILLiadAccount = false
      },
      setBills(state, bills) {
         state.bills = bills
      },
      flagAccountRequested(state) {
         state.accountRequested = true
         localStorage.setItem("v4_requested", "yes")
      }
   },

   actions: {
      async refreshAuth(ctx) {
         console.log("Refresh authentication...")
         if ( ctx.state.sessionType != "netbadge" && (ctx.state.role == "" || ctx.state.role == "guest") ) {
            console.log("Get GUEST authorization token")
            await axios.post("/authorize", null).then( response => {
               ctx.commit("setUserJWT", response.data)
            })
         } else {
            console.log("Refreshing sign-in session")
            await axios.post("/api/reauth", null).then( response => {
               ctx.commit("setUserJWT", response.data )
               console.log(`Session refreshed`)
            }).catch( async () => {
               // Signout, but preserve the search as it will be retried as guest
               console.log("reauth failed, signing out")
               await ctx.dispatch("signout", false)
               ctx.commit('system/setSessionExpired', null, { root: true })
            })
         }
      },

      overrideClaims(ctx) {
         if (ctx.getters.isAdmin){
            ctx.commit('setAuthorizing', true)
            let claims = ctx.state.parsedJWT
            return axios.post("api/admin/claims", claims).then((_response) => {
               let jwtStr = VueCookies.get("v4_jwt")
               ctx.commit("setUserJWT", jwtStr )
               setTimeout(() => {
                  ctx.commit('setAuthorizing', false)
               },200);
             }).catch((error) => {
               ctx.commit('system/setError', error + '<br/>' + error.response.data, { root: true })
               ctx.commit('setAuthorizing', false)
             })
         }
      },

      getRequests(ctx) {
         if (ctx.rootGetters["user/isSignedIn"] == false) return
         if (ctx.rootGetters["user/isGuest"]) return
         ctx.commit('setLookingUp', true)

         return axios.all([
            axios.get(`/api/users/${ctx.state.signedInUser}/holds`),
            axios.get(`/api/users/${ctx.state.signedInUser}/illiad`),
         ]).then(axios.spread((holdResponse, illiadResponse) => {
            ctx.commit('setRequests', {
               holds: holdResponse.data.holds,
               illiad: illiadResponse.data
            })
         })).catch((error) => {
            if (error.response && error.response.status == 503) {
               ctx.commit('system/setILSError', error.response.data, { root: true })
            } else {
               ctx.commit('system/setError', error, { root: true })
            }
         }).finally(() => { ctx.commit('setLookingUp', false) })
      },

      async getAccountInfo(ctx) {
         if (ctx.getters.isSignedIn == false) {
            return
         }
         if (ctx.getters.hasAccountInfo ){
            return
         }

         ctx.commit('setLookingUp', true)
         return axios.get(`/api/users/${ctx.state.signedInUser}`).then((response) => {
            ctx.commit('setAccountInfo', response.data)
            let prefs = JSON.parse(response.data.preferences)
            ctx.commit('preferences/setPreferences', prefs, { root: true })
            if ( prefs.searchTemplate ) {
               ctx.commit('query/setTemplate',  prefs.searchTemplate, { root: true })
            }
            if (response.data.user.noILSAccount && this.router.currentRoute.value.path != "/account") {
               this.router.push( "/account" )
            }
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },

      renewItem(ctx, barcode) {
         if (ctx.rootGetters["user/isSignedIn"] == false) return
         if (ctx.rootGetters["user/isGuest"]) return

         ctx.commit('setRenewing', true)
         let data = {item_barcode: barcode}
         axios.post(`/api/users/${ctx.state.signedInUser}/checkouts/renew`, data).then((response) => {
            ctx.commit('setCheckouts', response.data.checkouts)
            ctx.commit('setRenewResults', response.data.renewResults)
            ctx.commit('setRenewing', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setRenewing', false)
          })
      },

      renewAll(ctx) {
         if (ctx.rootGetters["user/isSignedIn"] == false) return
         if (ctx.rootGetters["user/isGuest"]) return

         ctx.commit('setRenewing', true)
         let data = {item_barcode: "all"}
         axios.post(`/api/users/${ctx.state.signedInUser}/checkouts/renew`, data).then((response) => {
            ctx.commit('setCheckouts', response.data.checkouts)
            ctx.commit('setRenewResults', response.data.renewResults)
            ctx.commit('setRenewing', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setRenewing', false)
          })
      },

      async getCheckouts(ctx) {
         if ( ctx.state.checkouts.length > 0) {
            return
         }
         if (ctx.state.signedInUser.length == 0 || ctx.state.noILSAccount) {
            return
         }
         return axios.get(`/api/users/${ctx.state.signedInUser}/checkouts`).then((response) => {
            ctx.commit('setCheckouts', response.data)
            ctx.commit('sortCheckouts', ctx.state.checkoutsOrder)
         }).catch((error) => {
            if (error.response && error.response.status == 503) {
               ctx.commit('system/setILSError', error.response.data, { root: true })
            } else {
               ctx.commit('system/setError', error, { root: true })
            }
         })
      },
      async downloadCheckoutsCSV(ctx) {
         if ( ctx.state.checkouts.length == 0) {
            return
         }
         return axios.get(`/api/users/${ctx.state.signedInUser}/checkouts.csv`).then((response) => {
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            const fileLink = document.createElement('a');

            fileLink.href = fileURL;
            fileLink.setAttribute('download', response.headers["content-disposition"].split("filename=")[1])
            document.body.appendChild(fileLink);

            fileLink.click();
            window.URL.revokeObjectURL(fileURL);

         }).catch((error) => {
            if (error.response && error.response.status == 503) {
               ctx.commit('system/setILSError', error.response.data, { root: true })
            } else {
               ctx.commit('system/setError', error, { root: true })
            }
         })
      },

      getBillDetails(ctx) {
         if ( ctx.state.bills.length > 0) return
         if (ctx.rootGetters["user/isGuest"]) return

         ctx.commit('setLookingUp', true)
         axios.get(`/api/users/${ctx.state.signedInUser}/bills`).then((response) => {
            ctx.commit('setBills', response.data)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            if (error.response && error.response.status == 503) {
               ctx.commit('system/setILSError', error.response.data, { root: true })
            } else {
               ctx.commit('system/setError', error, { root: true })
            }
            ctx.commit('setLookingUp', false)
          })
      },

      async signout(ctx, resetSearch) {
         if ( ctx.state.signedInUser == "") return

         try {
            await axios.post("/signout", null)
            ctx.commit('clear')
            ctx.commit('bookmarks/clear', null, { root: true })
            ctx.commit('preferences/clear', null, { root: true })
            ctx.commit('searches/clear', null, { root: true })
            ctx.commit('clearSeenAlerts', null, { root: true })
            if ( resetSearch === true) {
               ctx.dispatch('resetSearch', null, { root: true })
            }
         } catch (e) {
            console.error("Signout failed: "+e)
         }
      },

      signin(ctx, data) {
         ctx.commit('setAuthorizing', true)
         axios.post("/authenticate/public", data).then( async (_response) => {
            let jwtStr = VueCookies.get("v4_jwt")
            ctx.commit("setUserJWT", jwtStr )
            ctx.commit('setAuthorizing', false)
            ctx.commit('restore/load', null, { root: true })
            await ctx.dispatch("getAccountInfo")   // needed for search preferences
            ctx.dispatch("getCheckouts")     // needed so the alert icon can show in menubar
            if ( ctx.getters.isUndergraduate) {
               analytics.trigger('User', 'PIN_SIGNIN', "undergraduate")
            } else if ( ctx.getters.isGraduate) {
               analytics.trigger('User', 'PIN_SIGNIN', "graduate")
            } else {
               analytics.trigger('User', 'PIN_SIGNIN', "other")
            }
            this.router.push( ctx.rootState.restore.url ).catch((e)=>{
               if (e.name !== 'NavigationDuplicated') {
                  throw e;
              }
            })
            ctx.dispatch('requests/reload', null, {root: true})
         }).catch((error) => {
            if (error.response && error.response.status == 503) {
               ctx.commit('system/setILSError', error.response.data, { root: true })
            } else {
               ctx.commit('setAuthFailure', error)
            }
            ctx.commit('setAuthorizing', false)
          })
      },

      netbadge(ctx) {
         ctx.commit('setAuthorizing', true)
         window.location.href = "/authenticate/netbadge"
      },

      changePassword(ctx, data) {
         data['barcode'] = ctx.state.accountInfo['barcode']
         return axios.post("/api/change_pin", data)
      },
      changePasswordWithToken(_ctx, data) {
         return axios.post("/api/change_password_token", data)
      },
      forgotPassword(_ctx, barcode) {
         return axios.post("/api/forgot_password", {userBarcode: barcode} )
      },
      async submitNewAccountRequest(ctx) {
         ctx.commit('setLookingUp', true)
         await axios.post("/api/requests/account", ctx.state.accountRequest ).then( _resp => {
            ctx.commit('setLookingUp', false)
            ctx.commit('flagAccountRequested')
            window.scrollTo({
               top: 0,
               behavior: "auto"
            })
         }).catch ( error => {
            console.log("Unable to request new account: "+error)
            let msg = "System error, we regret the inconvenience. If this problem persists, "
            msg += "<a href='https://search.lib.virginia.edu/feedback' target='_blank'>please contact us.</a>"
            ctx.commit("system/setError", msg, {root: true})
            ctx.commit('setLookingUp', false)
         })
      },
      updateContactInfo(_ctx, info) {
         return axios.post(`/api/users/${info.newContact.userID}/contact`, info )
      }
   }
}

export default user
