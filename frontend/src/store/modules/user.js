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
      accountInfo: null,
      checkouts: null,
      bookmarks: null,
      newBookmarkInfo: null,
      lookingUp: false,
   },

   getters: {
      canMakeReserves: (state, getters) => {
         if (getters.isSignedIn == false ) return false
         if (getters.hasAccountInfo == false ) return false

         // can reserve if !undergraduate? && !virginia_borrower?
         // va borrower: profile.match?(/Virginia Borrower|Other VA Faculty|Alumn/i)
         let profile = state.accountInfo.profile.toLowerCase().trim()
         let desc = state.accountInfo.description.toLowerCase().trim()
         if (desc.indexOf("undergraduate") == 0) {
            return false
         }
         if (profile.indexOf("ugrad") == 0 || profile.indexOf("undergrad") == 0) {
            return false
         }
         if (profile.match(/Virginia Borrower|Other VA Faculty|Alumn/i)) {
            return false
         }

         return true
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
         let found = false
         state.bookmarks.some( folderInfo=> {
            found = folderInfo.bookmarks.length > 0
            return found == true
         })
         return found
      },
      bookmarks: state => {
         if ( state.bookmarks == null ) return []
         return state.bookmarks
      },
      folders: state => {
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
      showAddBookmark(state, bookmarkData) {
         state.newBookmarkInfo = bookmarkData
      },
      closeAddBookmark(state) {
         state.newBookmarkInfo = null
      },
      setAuthToken(state, token) {
         state.authToken = token
      },
      setAuthorizing(state, auth) {
         state.authorizing = auth
      },
      setSignedInUser(state, user) {
         state.signedInUser = user.userId
         state.authToken = user.token
         state.sessionType = user.type
      },
      setAccountInfo(state, data) {
         // data content {user, authToken, bookmarks}
         // bookmarks = [ {id, folder, addedAt, bookmarks: [id,pool,identifier, details{author, title}] } ] 
         state.accountInfo = data.user
         state.authToken = data.authToken
         state.bookmarks = data.bookmarks
      },
      signOutUser(state) {
         state.accountInfo = null
         state.bookmarks = null
         state.signedInUser = ""
         state.authToken = ""
         Vue.cookies.remove("v4_auth_user")
      },
      setBookmarks(state, bookmarks) {
         state.bookmarks = []
         state.bookmarks = bookmarks
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
      getAccountInfo(ctx) {
         ctx.commit('setLookingUp', true)
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         return axios.get(`/api/users/${ctx.state.signedInUser}`).then((response) => {
            ctx.commit('setAccountInfo', response.data)
            ctx.commit('preferences/setPreferences', response.data.preferences, { root: true })
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },
      getCheckouts(ctx) {
         ctx.commit('setLookingUp', true)
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         axios.get(`/api/users/${ctx.state.signedInUser}/checkouts`).then((response) => {
            ctx.commit('setCheckouts', response.data)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },
      signout(ctx) {
         ctx.commit('setAuthorizing', true)
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
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
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         axios.post("/authenticate/public", data).then((response) => {
            ctx.commit("setSignedInUser", {userId: response.data, 
               token: ctx.state.authToken, type: "public", quiet: false} )
            ctx.commit('setAuthorizing', false)
            router.push("/account")
         }).catch((_error) => {
            ctx.commit('setAuthorizing', false)
            router.push("/forbidden")
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
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         return axios.get(`/api/users/${ctx.state.signedInUser}/bookmarks`).then((response) => {
            ctx.commit('setBookmarks', response.data)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', true)
          })
      },
      addBookmark(ctx, folder ) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
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
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/folders`
         return axios.post(url, {name: folder}).then((response) => {
            ctx.commit('setBookmarks', response.data)
         })
      },
      removeFolder(ctx, folderID) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/folders/${folderID}`
         axios.delete(url).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
      removeBookmark(ctx, bmID) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/items/${bmID}`
         axios.delete(url).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
   }
}

export default user