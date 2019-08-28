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
         if (state.accountInfo == null) return false 
         if (state.accountInfo.bookmarks == null) return false 
         return Object.keys(state.accountInfo.bookmarks).length > 0
      },
      bookmarks: state => {
         if (state.accountInfo == null) return {}
         if (state.accountInfo.bookmarks == null) return {}
         return state.accountInfo.bookmarks
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
         state.accountInfo = data
      },
      clearSignInMessage(state) {
         state.signInMessage = ""
      },
      signOutUser(state) {
         state.signedInUser = ""
         state.authToken = ""
         state.signInMessage = "" 
         Vue.cookies.remove("v4_auth_user")
      },
      setBookmarks(state, bookmarks) {
         if (!state.accountInfo) {
            state.accountInfo = {}
         }
         state.accountInfo.bookmarks = bookmarks
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
          }).catch((_error) => {
            router.push("/forbidden")
          })
      },
      signout(ctx) {
         ctx.commit('setAuthorizing', true)
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         axios.post(`/api/users/${ctx.state.signedInUser}/signout`).then((_response) => {
            ctx.commit('signOutUser')
            ctx.commit('setAuthorizing', false)
            router.push("/signedout")
          }).catch((_error) => {
            ctx.commit('signOutUser')
            ctx.commit('setAuthorizing', false)
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
          }).catch((_error) => {
            router.push("/forbidden")
          })
      },
      removeBookmark(ctx, identifier) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/items?identifier=${identifier}`
         axios.delete(url).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('setError', error, { root: true })
         })
      },
      removeFolder(ctx, folder) {
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         let url = `/api/users/${ctx.state.signedInUser}/bookmarks/folders?name=${folder}`
         axios.delete(url).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('setError', error, { root: true })
         })
      }
   }
}

export default user