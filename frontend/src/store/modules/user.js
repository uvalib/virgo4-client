import axios from 'axios'
import Vue from 'vue'
import router from '../../router'
import analytics from '../../analytics'

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
      role: "",
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
      authExpiresAt: 0
   },

   getters: {
      hasRenewSummary: (state) => {
         return state.renewSummary.renewed >= 0
      },
      canChangePassword: (state, getters) => {
         if (getters.hasAccountInfo == false ) return false
         if ( state.sessionType == "netbadge") return false
         return true
      },
      isGuest: (state) => {
         return (state.role == 'guest' || state.role == '')
       },
      isAdmin: (state) => {
        return (state.role == 'admin')
      },
      isGraduate: (state) => {
         if ( state.role == 'guest' || state.role == '') return false
         if ( Object.keys(state.accountInfo).length == 0) return false
         if (state.accountInfo.description.toLowerCase().includes("graduate student")) return true
         if (state.accountInfo.profile.toLowerCase().includes("ugrad") ||
             state.accountInfo.profile.toLowerCase().includes("undergrad")) return false
         if (state.accountInfo.profile.toLowerCase().includes("grad")) return true
         return false
      },
      isUndergraduate: (state) => {
         if ( state.role == 'guest' || state.role == '' ) return false
         if ( Object.keys(state.accountInfo).length == 0) return false
         if (state.accountInfo.description.toLowerCase().includes("undergraduate")) return true
         if (state.accountInfo.profile.toLowerCase().includes("ugrad") ||
             state.accountInfo.profile.toLowerCase().includes("undergrad")) return true
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
      isFaculty: state => {
         return state.accountInfo.profile == "Faculty"
      },
      sortedCheckouts: state => {
         return state.checkouts.sort( (a,b) => {
            let d1 = a.due.split("T")[0]
            let d2 = b.due.split("T")[0]
            if (d1 < d2) return -1
            if (d1 > d2) return 1
            if (parseFloat(a.overdueFee) < parseFloat(b.overdueFee)) return 1
            if (parseFloat(a.overdueFee) > parseFloat(b.overdueFee)) return -1
            if (a.overdue == false && b.overdue == true) return 1
            if (a.overdue == true && b.overdue == false) return -1
            return 0
         })
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
         if (state.accountInfo.id != state.signedInUser) return false
         return true
      },
      libraries: (_state, getters, rootState) => {
         let pickupLibraries = rootState.system.pickupLibraries.slice()

         if (getters.isHSLUser) {
            pickupLibraries.push({id: "HEALTHSCI", name: "Health Sciences Library"})
         }
         if (getters.isLawUser) {
            pickupLibraries.push({id: "LAW", name: "Law Library"})
         }
         if (getters.canLeoMobile) {
           pickupLibraries.push({id: "LEO", name: 'Central Grounds Parking Garage ("LEO Mobile")' })
         }

         return pickupLibraries
       },
       canLeoMobile: (_state, getters, _rootState) => {
          if (getters.isFaculty || getters.isGraduate) {
             return true
          }
          return false
       },
   },

   mutations: {
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
            let keyA = a.author.toUpperCase()
            let keyB = b.author.toUpperCase()
            if (order.includes("TITLE")) {
               keyA = a.title.toUpperCase()
               keyB = b.title.toUpperCase()
            }
            if (order.includes("DUE")){
               keyA = a.due.split("T")[0]
               keyB = b.due.split("T")[0]
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
            isUVA: parsed.isUVA,
         }
         state.authMessage = ""
         state.lockedOut = false
         state.signedInUser = parsed.userId
         state.authToken = jwtStr
         state.sessionType =  parsed.authMethod
         state.role = parsed.role
         localStorage.setItem("v4_jwt", jwtStr)
         state.authExpiresAt = parsed.exp

      },
      setAccountInfo(state, data) {
         state.accountInfo = data.user
         state.accountInfo.leoAddress = data.leoLocation
      },
      clear(state) {
         state.signedInUser = ""
         state.sessionType = ""
         state.accountInfo = {}
         state.authTriesLeft = 5
         state.authExpiresAt = 0
         state.authMessage = ""
         state.authToken = ""
         state.role = ""
         state.lockedOut = false
         state.checkouts.splice(0, state.checkouts.length)
         state.renewSummary = {renewed: 0, failed: 0, failures: []}
         state.bills.splice(0, state.bills.length)
         Vue.$cookies.remove("v4_optout")
         localStorage.removeItem("v4_jwt")
      },
      setBills(state, bills) {
         state.bills = bills
      },
   },

   actions: {
      async authenticate(ctx) {
         let expiresIn = 0
         let nowSecs = Math.round((new Date()).getTime() / 1000)
         let expireSecs = ctx.state.authExpiresAt - 15
         expiresIn = expireSecs - nowSecs
         if (expiresIn <= 0) {
            console.log("Authentication expired. Refreshing...")
            if ( ctx.state.role == "" || ctx.state.role == "guest") {
               console.log("Get GUEST authorization token")
               await axios.post("/authorize", null).then( response => {
                  ctx.commit("setUserJWT", response.data)
               }).catch( error => {
                  let msg = error.toString()
                  if (error.response) {
                     msg = error.response.data
                  }
                  ctx.dispatch("system/reportError", `Unable to get auth token: ${msg}`, { root: true })
               })
            } else {
               console.log("Refreshing sign-in session")
               await axios.post("/api/reauth", null).then( response => {
                  console.log(`Session refreshed`)
                  ctx.commit("setUserJWT", response.data )
               }).catch( error => {
                  console.error("Refreshing failed: "+error.toString())
                  ctx.dispatch("signout")
                  ctx.commit('system/setSessionExpired', null, { root: true })
               })
            }
         }
      },

      overrideClaims(ctx) {
         if (ctx.getters.isAdmin){
            ctx.commit('setAuthorizing', true)
            let claims = ctx.state.parsedJWT
            return axios.post("api/admin/claims", claims).then((_response) => {
               let jwtStr = Vue.$cookies.get("v4_jwt")
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

         return axios.all([axios.get(`/api/users/${ctx.state.signedInUser}/holds`),
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
         if (ctx.state.signedInUser.length == 0) {
            return
         }
         return axios.get(`/api/users/${ctx.state.signedInUser}/checkouts`).then((response) => {
            ctx.commit('setCheckouts', response.data)
            ctx.commit('sortCheckouts', "AUTHOR_ASC")
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

      async signout(ctx) {
         if ( ctx.state.signedInUser == "") return

         try {
            await axios.post("/signout", null)
            ctx.commit('clear')
            ctx.commit('bookmarks/clear', null, { root: true })
            ctx.commit('preferences/clear', null, { root: true })
            ctx.commit('searches/clear', null, { root: true })
            ctx.commit('clearSeenAlerts', null, { root: true })
            ctx.dispatch('resetSearch', null, { root: true })
         } catch (e) {
            console.error("Signout failed: "+e)
         }
      },

      signin(ctx, data) {
         ctx.commit('setAuthorizing', true)
         axios.post("/authenticate/public", data).then( async (_response) => {
            let jwtStr = Vue.$cookies.get("v4_jwt")
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
            router.push( ctx.rootState.restore.url )
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
   }
}

export default user
