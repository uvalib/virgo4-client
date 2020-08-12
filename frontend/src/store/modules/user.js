import axios from 'axios'
import Vue from 'vue'
import router from '../../router'

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
      checkoutsOrder: "AUTHOR_ASC",
      bills: [],
      requests: {illiad: [], holds: []},
      lookingUp: false,
      authTriesLeft: 5,
      authMessage: "",
      lockedOut: false,
      parsedJWT: {},
      authExpiresSec: 0
   },

   getters: {
      canChangePIN: (state, getters) => {
         if (getters.hasAccountInfo == false ) return false
         if ( state.sessionType == "netbadge") return false
         return true
      },
      isAdmin: (state) => {
        return (state.role == 'admin')
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
         if ( state.claims.canBrowseReserve ) return state.claims.canBrowseReserve
         return false
      },
      canMakeReserves: (state) => {
         if ( state.claims.canPlaceReserve ) return state.claims.canPlaceReserve
         return false
      },
      isBarred: state => {
         return state.accountInfo.standing == "BARRED" ||  state.accountInfo.standing == "BARR-SUPERVISOR"
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
      hasAuthToken: state => {
        if (state.authToken == null) return false
        return state.authToken.length > 0
      },
      isSignedIn: state => {
         return state.signedInUser != ""  && state.authToken != "" &&
            state.sessionType != "" && state.sessionType != "none" &&
            state.role != "" && state.role != "guest"
      },
      hasAccountInfo: state => {
         if (state.signedInUser.length == 0)  return false
         if (state.accountInfo == null) return false
         if (state.accountInfo.id != state.signedInUser) return false
         return true
      },
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      setCheckouts(state, co) {
         state.checkouts = co
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
         renewResults.results.forEach( renew => {
            if (renew.success == false) {
               let co = state.checkouts.find( co => co.barcode == renew.barcode)
               co.message = renew.message
            }
         })
      },
      setAuthToken(state, token) {
         state.authToken = token
         axios.defaults.headers.common['Authorization'] = "Bearer "+state.authToken
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

         state.claims = {canPurchase: parsed.canPurchase, canLEO: parsed.canLEO,
            canLEOPlus: parsed.canLEOPlus, canPlaceReserve: parsed.canPlaceReserve,
            canBrowseReserve: parsed.canBrowseReserve, useSIS: parsed.useSIS }
         state.authMessage = ""
         state.lockedOut = false
         state.signedInUser = parsed.userId
         state.authToken = jwtStr
         state.sessionType =  parsed.authMethod
         state.role =  parsed.role
         axios.defaults.headers.common['Authorization'] = "Bearer "+state.authToken
         localStorage.setItem("v4_jwt", jwtStr)

         // set a timeout to refresh the token 30secs before it expires (or right now if it is expired)
         let nowSecs = Math.round((new Date()).getTime() / 1000)
         state.authExpiresSec = parsed.exp - nowSecs

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
         state.authExpiresSec = 0
         state.authMessage = ""
         state.role = ""
         state.lockedOut = false
         state.checkouts.splice(0, state.checkouts.length)
         state.bills.splice(0, state.bills.length)
         Vue.$cookies.remove("v4_optout")
         localStorage.removeItem("v4_jwt")
      },
      setBills(state, bills) {
         state.bills = bills
      },
   },

   actions: {
      getAuthToken(ctx) {
        ctx.commit('setAuthorizing', true)
        return axios.post("/authorize").then((response) => {
          console.log("Set new auth token for user")
          ctx.commit('setAuthToken', response.data)
          ctx.commit('setAuthorizing', false)
        }).catch((error) => {
          ctx.commit('setAuthToken', '')
          ctx.commit('system/setFatal', "Authorization failed: " + error.response.data, { root: true })
          ctx.commit('setAuthorizing', false)
        })
      },

      async refreshAuth(ctx) {
         // if the user has signed out already, don't refresh
         if (ctx.state.signedInUser == "" ||  ctx.state.sessionType == "" || ctx.state.sessionType == "none" ) {
            return
         }

         return axios.post("/api/reauth", null).then((response) => {
            console.log("Session refreshed")
            ctx.commit("setUserJWT", response.data )
         }).catch((_error) => {
            ctx.commit('system/setSessionExpired', null, { root: true })
            ctx.commit('clear')
          })
      },

      overrideClaims(ctx) {
         if (ctx.getters.isAdmin){
            ctx.commit('setAuthorizing', true)
            let claims = ctx.state.parsedJWT
            return axios.post("api/admin/claims", claims).then((_response) => {
               let jwtStr = Vue.$cookies.get("v4_jwt")
               ctx.commit('setAuthToken', jwtStr)
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
         ctx.commit('setLookingUp', true)

         return axios.all([axios.get(`/api/users/${ctx.state.signedInUser}/holds`),
                    axios.get(`/api/users/${ctx.state.signedInUser}/illiad`),
         ]).then(axios.spread((holdResponse, illiadResponse) => {
            ctx.commit('setRequests', {
               holds: holdResponse.data.holds,
               illiad: illiadResponse.data
            })
         })).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         }).finally(() => { ctx.commit('setLookingUp', false) })
      },

      getAccountInfo(ctx) {
         if (ctx.rootGetters["user/hasAccountInfo"] ) return
         if (ctx.rootGetters["user/isSignedIn"] == false) return

         ctx.commit('setLookingUp', true)
         return axios.get(`/api/users/${ctx.state.signedInUser}`).then((response) => {
            ctx.commit('setAccountInfo', response.data)
            let prefs = migratePreferences( ctx.rootState.pools.list, response.data.preferences)
            ctx.commit('preferences/setPreferences', prefs, { root: true })
            if (prefs.migrated && prefs.migrated == true) {
               ctx.dispatch('preferences/savePreferences', null, { root: true })
            }
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },

      renewItem(ctx, barcode) {
         if (ctx.rootGetters["user/isSignedIn"] == false) return

         ctx.commit('setLookingUp', true)
         let data = {item_barcode: barcode}
         axios.post(`/api/users/${ctx.state.signedInUser}/checkouts/renew`, data).then((response) => {
            ctx.commit('setCheckouts', response.data.checkouts)
            ctx.commit('setRenewResults', response.data.renewResults)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },

      renewAll(ctx) {
         if (ctx.rootGetters["user/isSignedIn"] == false) return

         ctx.commit('setLookingUp', true)
         let data = {item_barcode: "all"}
         axios.post(`/api/users/${ctx.state.signedInUser}/checkouts/renew`, data).then((response) => {
            ctx.commit('setCheckouts', response.data.checkouts)
            ctx.commit('setRenewResults', response.data.renewResults)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },

      async getCheckouts(ctx) {
         if ( ctx.state.checkouts.length > 0) {
            return
         }

         if ( ctx.getters.hasAccountInfo == false) {
            await this.dispatch("user/getAccountInfo")
         }

         const axInst = axios.create({
            timeout: 30*1000,
         })
         return axInst.get(`/api/users/${ctx.state.signedInUser}/checkouts`).then((response) => {
            ctx.commit('setCheckouts', response.data)
            ctx.commit('sortCheckouts', "AUTHOR_ASC")
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
          })
      },

      getBillDetails(ctx) {
         if ( ctx.state.bills.length > 0) return

         ctx.commit('setLookingUp', true)
         axios.get(`/api/users/${ctx.state.signedInUser}/bills`).then((response) => {
            ctx.commit('setBills', response.data)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },

      async signout(ctx, redirectPath) {
         if ( ctx.state.signedInUser == "") return

         try {
            await axios.post("/signout", null)
            ctx.commit('clear')
            ctx.commit('resetSearchResults', null, { root: true })
            ctx.commit('bookmarks/clear', null, { root: true })
            ctx.commit('preferences/clear', null, { root: true })
            ctx.commit('searches/clear', null, { root: true })
            ctx.commit('query/clear', null, { root: true })
            ctx.commit('filters/reset', null, { root: true })
            await ctx.dispatch('getAuthToken')
         } catch (e) {
            console.error("Signout failed: "+e)
         }

         if (router.currentRoute.path != redirectPath) {
            router.push(redirectPath)
         }
      },

      signin(ctx, data) {
         ctx.commit('setAuthorizing', true)
         axios.post("/authenticate/public", data).then((_response) => {
            let jwtStr = Vue.$cookies.get("v4_jwt")
            ctx.commit("setUserJWT", jwtStr )
            ctx.commit('setAuthorizing', false)
            ctx.commit('restore/load', null, { root: true })
            ctx.dispatch("getAccountInfo")   // needed for search preferences
            ctx.dispatch("getCheckouts")     // needed so the alert icon can show in menubar
            router.push( ctx.rootState.restore.url )
         }).catch((error) => {
            ctx.commit('setAuthorizing', false)
            ctx.commit('setAuthFailure', error)
          })
      },

      netbadge(ctx) {
         ctx.commit('setAuthorizing', true)
         window.location.href = "/authenticate/netbadge"
      },

      changePIN(ctx, data) {
         data['barcode'] = ctx.state.accountInfo['barcode']
         return axios.post("/api/change_pin", data)
      },
   }
}

function migratePreferences( pools, prefsStr ) {
   try {
      let jsonPrefs = JSON.parse(prefsStr)
      if ( jsonPrefs.targetPoolURL ) {
         jsonPrefs.migrated = true
         jsonPrefs.targetPool = getPoolID(pools, jsonPrefs.targetPoolURL)
         delete jsonPrefs.targetPoolURL
      }
      if ( jsonPrefs.excludePoolURLs ) {
         jsonPrefs.migrated = true
         jsonPrefs.excludePools = []
         jsonPrefs.excludePoolURLs.forEach( url => {
            jsonPrefs.excludePools.push( getPoolID(pools, url))
         })
         delete jsonPrefs.excludePoolURLs
      }
      return jsonPrefs
   } catch (e) {
      // just return blank obj
      return {}
   }
}
function getPoolID( pools, url ) {
   let p = pools.find( p => p.url == url)
   return p.id
}

export default user
