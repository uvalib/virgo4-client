import axios from 'axios'
import Vue from 'vue'
import router from '../../router'

const auth = {
   namespaced: true,
   state: {
      authToken: "",
      authorizing: false,
      signedInUser: "",
      signInMessage: "",
      sessionType: "",
      accountInfo: null
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
      }
   },

   mutations: {
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
         // NOTES: The redirect below and the subsequent redirect 
         // back to V4 will wipe out the Vuex data model.  Any info that 
         // needs to be preserved must be set in a cookie. These will 
         // be passed back to the client in another cookie to be processed 
         // and re-introduced to vuex in the SignIn page beforeEnter handling.
         // Right now, the only useful info is the auth token.
         Vue.cookies.set("v4_auth", ctx.state.authToken, 5)
         window.location.href = "/authenticate/netbadge"
      }
   }
}

export default auth