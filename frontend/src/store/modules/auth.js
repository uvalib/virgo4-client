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
      sessionType: ""
   },

   getters: {
      hasAuthToken: state => {
        return state.authToken.length > 0
      },
      isSignedIn: state => {
         return state.signedInUser != ""  
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
         state.signInMessage = `You are now signed in as '${state.signedInUser}'`
         Vue.cookies.remove("v4_auth")
         Vue.cookies.remove("v4_auth_user")
      },
      clearSignInMessage(state) {
         state.signInMessage = ""
      },
      signOutUser(state) {
         state.signedInUser = ""
         state.authToken = ""
         state.signInMessage = "" 
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
      signout(ctx) {
         ctx.commit('signOutUser')
         router.push("/signedout")
      },
      signin(ctx, data) {
         ctx.commit('setAuthorizing', true)
         axios.post("/authenticate/public", data).then((response) => {
            ctx.commit("setSignedInUser", {userId: response.data, 
               token: ctx.state.authToken, type: "public"} )
            ctx.commit('setAuthorizing', false)
            router.push("/signedin")
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