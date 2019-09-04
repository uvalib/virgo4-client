import axios from 'axios'
import Vue from 'vue'
import router from '../../router'

const user = {
   namespaced: true,
   state: {
      authToken: "",
      authorizing: false,
      signedInUser: "",
      signInMessage: "",
      sessionType: "",
      accountInfo: null,
      bookmarks: null,
      newBookmarkInfo: null
   },

   getters: {
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
         return Array.from( state.bookmarks.keys()).length > 0
      },
      bookmarks: state => {
         if ( state.bookmarks == null ) return []
         return state.bookmarks
      },
      folders: state => {
         if ( state.bookmarks == null ) return []
         let out = []
         state.bookmarks.forEach( (folder) => {
            out.push( {id: folder.id, name: folder.folder} )
         })
         return out.sort()
      },
      addingBookmark: state => {
         return state.newBookmarkInfo != null
      }
   },

   mutations: {
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
         if (user.quiet === false) {
            state.signInMessage = `You are now signed in as '${state.signedInUser}'`
         }
      },
      setAccountInfo(state, data) {
         // data content {user, authToken, bookmarks}
         // bookmarks = [ {id, foder, addedAt, bookmarks: [id,pool,identifier,details{}] } ] 
         state.accountInfo = data.user
         state.authToken = data.authToken
         state.bookmarks = data.bookmarks
      },
      clearSignInMessage(state) {
         state.signInMessage = ""
      },
      signOutUser(state) {
         state.accountInfo = null
         state.bookmarks = null
         state.signedInUser = ""
         state.authToken = ""
         state.signInMessage = "" 
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
          ctx.commit('setFatal', "Authorization failed: " + error.response.data, { root: true })
          ctx.commit('setAuthorizing', false)
        })
      },
      getAccountInfo(ctx) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         return axios.get(`/api/users/${ctx.state.signedInUser}`).then((response) => {
            ctx.commit('setAccountInfo', response.data)
          }).catch((error) => {
            ctx.commit('setError', error, { root: true })
          })
      },
      signout(ctx) {
         ctx.commit('setAuthorizing', true)
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         axios.post(`/api/users/${ctx.state.signedInUser}/signout`).finally(function () {
            ctx.commit('signOutUser')
            ctx.commit('setAuthorizing', false)
            ctx.commit('resetSearch', null, { root: true })
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
            router.push("/")
         }).catch((_error) => {
            ctx.commit('setAuthorizing', false)
            router.push("/forbidden")
          })
      },
      netbadge(ctx) {
         ctx.commit('setAuthorizing', true)
         window.location.href = "/authenticate/netbadge"
      },

      getBookmarks(ctx) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         return axios.get(`/api/users/${ctx.state.signedInUser}/bookmarks`).then((response) => {
            ctx.commit('setBookmarks', response.data)
          }).catch((error) => {
            ctx.commit('setError', error, { root: true })
          })
      },
      addBookmark(ctx, folder ) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/items`
         // expected: {"folder":"FolderOne", "pool": "video", "identifier": "u15772", "details": {"title": "Jaws", "author":"Peter Benchly"}}
         let data = {folder: folder, pool: ctx.state.newBookmarkInfo.pool, identifier: ctx.state.newBookmarkInfo.identifier}
         data['details'] = {title: ctx.state.newBookmarkInfo.title, author: ctx.state.newBookmarkInfo.author  }
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
      async removeFolder(ctx, folderID) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/folders/${folderID}`
         await axios.delete(url).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('setError', error, { root: true })
         })
      },
      async removeBookmark(ctx, bmID) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/items/${bmID}`
         await axios.delete(url).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('setError', error, { root: true })
         })
      },
   }
}

export default user