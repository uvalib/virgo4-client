import axios from 'axios'
import Vue from 'vue'
import router from '../../router'
import * as utils from './utils'

const user = {
   namespaced: true,
   state: {
      authToken: "",
      authorizing: false,
      signedInUser: "",
      sessionType: "",
      accountInfo: {},
      checkouts: [],
      bookmarks: [],
      bills: [],
      requests: [],
      newBookmarkInfo: null,
      lookingUp: false,
      authTriesLeft: 5,
      authMessage: "",
      lockedOut: false
   },

   getters: {
      isCommunityUser: (state, getters) => {
         if (getters.hasAccountInfo == false ) return false
         return state.accountInfo.communityUser
      },
      isUndergraduate: (state,getters) => {
         if (getters.hasAccountInfo == false ) return false
         // NOTE: profile comes from Sirsi, desc comes from LDAP
         let profile = state.accountInfo.profile.toLowerCase().trim()
         let desc = state.accountInfo.description.toLowerCase().trim()
         if (desc.indexOf("undergraduate") == 0) {
            return true
         }
         if (profile.indexOf("ugrad") == 0 || profile.indexOf("undergrad") == 0) {
            return true
         }
         return false
      },
      isGraduate: (state,getters) => {
         if (getters.hasAccountInfo == false ) return false
         let profile = state.accountInfo.profile.toLowerCase().trim()
         let desc = state.accountInfo.description.toLowerCase().trim()
         if (desc.indexOf("graduate student") == 0) {
            return true
         }
         if (profile.indexOf("grad") == 0 ){
            return true
         }
         return false
      },
      isAlumni: (state,getters) => {
         if (getters.hasAccountInfo == false ) return false
         let profile = state.accountInfo.profile.toLowerCase().trim()
         if (profile.match(/Alumn/i)) {
            return true
         }
         return false
      },
      canMakeReserves: (state, getters) => {
         if (getters.hasAccountInfo == false ) return false
         let profile = state.accountInfo.profile.toLowerCase().trim()
         if (getters.isGraduate || getters.isUndergraduate) {
            return false
         }
         if (profile.match(/Virginia Borrower|Other VA Faculty|Alumn/i)) {
            return false
         }

         return true
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
        return state.authToken.length > 0
      },
      isSignedIn: state => {
         return state.signedInUser != ""  
      },
      hasAccountInfo: state => {
         if (state.signedInUser.length == 0)  return false
         if (state.accountInfo == null) return false 
         if (state.accountInfo.id != state.signedInUser) return false 
         return true
      },
      hasBookmarks: state => {
         if ( state.bookmarks == null ) return false 
         if ( state.bookmarks.length === 0) return false
         return true
      },
      bookmarks: state => {
         if ( state.bookmarks == null ) return []
         return state.bookmarks
      },
      bookmarkFolders: state => {
         if ( state.bookmarks == null ) return []
         let out = []
         let foundGeneral = false
         state.bookmarks.forEach( (folderObj) => {
            if ( folderObj.folder == "General") {
               foundGeneral = true
            }
            out.push( {id: folderObj.id, name: folderObj.folder} )
         })
         if (foundGeneral == false ) {
            out.push( {id: 0, name: "General"} )
         }
         return out.sort( (a,b) => {
            if (a.name < b.name) return -1 
            if (a.name > b.name) return 1 
            return 0
         })
      },
      addingBookmark: state => {
         return state.newBookmarkInfo != null
      }
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      setCheckouts(state, co) {
         state.checkouts = co
      },
      setRequests(state, req) {
         state.requests = req
      },
      setRenewResults(state, renewResults) {
         renewResults.results.forEach( renew => {
            if (renew.success == false) {
               let co = state.checkouts.find( co => co.barcode == renew.barcode)
               co.message = renew.message
            }
         })
      },
      showAddBookmark(state, bookmarkData) {
         state.newBookmarkInfo = bookmarkData
      },
      closeAddBookmark(state) {
         state.newBookmarkInfo = null
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
      setSignedInUser(state, user) {
         state.authMessage = ""
         state.lockedOut = false
         state.signedInUser = user.userId
         state.authToken = user.token
         state.sessionType = user.type
         axios.defaults.headers.common['Authorization'] = "Bearer "+state.authToken
      },
      setAccountInfo(state, data) {
         // data content {user, authToken, bookmarks}
         // bookmarks = [ {id, folder, addedAt, bookmarks: [id,pool,identifier, details{author, title}] } ] 
         state.accountInfo = data.user
         state.authToken = data.authToken
         state.bookmarks = data.bookmarks
      },
      signOutUser(state) {
         state.signedInUser = ""
         state.sessionType = ""
         state.accountInfo = {}
         state.authTriesLeft = 5
         state.authMessage = ""
         state.lockedOut = false
         state.checkouts.splice(0, state.checkouts.length)
         state.bookmarks.splice(0, state.bookmarks.length)
         state.bills.splice(0, state.bills.length)
         Vue.cookies.remove("v4_auth_user")
      },
      setBookmarks(state, bookmarks) {
         state.bookmarks = []
         state.bookmarks = bookmarks
      },
      setBills(state, bills) {
         state.bills = bills
      }
   },

   actions: {
      getAuthToken(ctx) {
        ctx.commit('setAuthorizing', true)
        return axios.post("/authorize").then((response) => {
          ctx.commit('setAuthToken', response.data)
          ctx.commit('setAuthorizing', false)
        }).catch((error) => {
          ctx.commit('setAuthToken', '')
          ctx.commit('system/setFatal', "Authorization failed: " + error.response.data, { root: true })
          ctx.commit('setAuthorizing', false)
        })
      },
      getRequests(ctx) {
         if (ctx.rootGetters["user/isSignedIn"] == false) return
         ctx.commit('setLookingUp', true)
         axios.get(`/api/users/${ctx.state.signedInUser}/illiad`).then((response) => {
            ctx.commit('setRequests', response.data)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },
      getAccountInfo(ctx) {
         if (ctx.rootGetters["user/hasAccountInfo"] ) return
         if (ctx.rootGetters["user/isSignedIn"] == false) return
         
         ctx.commit('setLookingUp', true)
         return axios.get(`/api/users/${ctx.state.signedInUser}`).then((response) => {
            ctx.commit('setAccountInfo', response.data)
            ctx.commit('preferences/setPreferences', response.data.preferences, { root: true })
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
            ctx.commit('setLookingUp', false)
            return
         }

         if ( ctx.getters.hasAccountInfo == false) {
            await this.dispatch("user/getAccountInfo")
            ctx.commit('setLookingUp', true)
         }

         axios.get(`/api/users/${ctx.state.signedInUser}/checkouts`).then((response) => {
            ctx.commit('setCheckouts', response.data)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
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
      signout(ctx) {
         ctx.commit('setAuthorizing', true)
         axios.post(`/api/users/${ctx.state.signedInUser}/signout`).finally(function () {
            ctx.commit('signOutUser')
            ctx.commit('setAuthorizing', false)
            ctx.commit('resetSearchResults', null, { root: true })
            ctx.commit('preferences/clear', null, { root: true })
            ctx.commit('query/clear', null, { root: true })
            ctx.commit('filters/reset', null, { root: true })
            router.push("/signedout")
         })
      },
      signin(ctx, data) {
         ctx.commit('setAuthorizing', true)
         // response: {barcode, signedId, message, attemptsLeft}
         axios.post("/authenticate/public", data).then((response) => {
            ctx.commit("setSignedInUser", {userId: response.data.barcode, 
               token: ctx.state.authToken, type: "public", quiet: false} )
            ctx.commit('setAuthorizing', false)
            router.push("/account")
         }).catch((error) => {
            ctx.commit('setAuthorizing', false)
            ctx.commit('setAuthFailure', error)
          })
      },
      netbadge(ctx) {
         ctx.commit('setAuthorizing', true)
         window.location.href = "/authenticate/netbadge"
      },

      async getBookmarks(ctx) {
         if (ctx.rootGetters["user/hasAccountInfo"] == false) {
            await ctx.dispatch("getAccountInfo")
         }
         ctx.commit('setLookingUp', true)
         return axios.get(`/api/users/${ctx.state.signedInUser}/bookmarks`).then((response) => {
            ctx.commit('setBookmarks', response.data)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', true)
          })
      },
      addBookmark(ctx, folder ) {
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/items`
         let bm = ctx.state.newBookmarkInfo
         let data = {folder: folder, pool: bm.pool, identifier: bm.data.identifier}

         // required details: title, author, call number, location, library, availability
         data['details'] = {title :bm.data.header.title, 
            author: bm.data.header.author.join(", "),
            callNumber: utils.getFieldValue("call_number", bm.data),
            location: utils.getFieldValue("location", bm.data),
            library: utils.getFieldValue("library", bm.data),
            availability: utils.getFieldValue("availability", bm.data),
         }
         return axios.post(url, data).then((response) => {
            ctx.commit('setBookmarks', response.data)
         })
      },
      addFolder(ctx, folder) {
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/folders`
         return axios.post(url, {name: folder}).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
      renameFolder(ctx, folder) {
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/folders/${folder.id}`
         axios.post(url, {name: folder.name}).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
      removeFolder(ctx, folderID) {
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/folders/${folderID}`
         axios.delete(url).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
      removeBookmarks(ctx, bookmarks) {
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/delete`
         axios.post(url, {bookmarkIDs: bookmarks}).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
      moveBookmarks(ctx, data) {
         let bookmarkIDs = data.bookmarks
         let folderID = data.folderID
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/move`
         axios.post(url, {folderID: folderID, bookmarkIDs: bookmarkIDs}).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
   }
}

export default user