import axios from 'axios'

const auth = {
   namespaced: true,
   state: {
      authToken: "",
      authorizing: false,
   },

   getters: {
      hasAuthToken: state => {
        return state.authToken.length > 0
      },
   },

   mutations: {
      setAuthToken(state, token) {
         state.authToken = token
      },
      setAuthorizing(state, auth) {
         state.authorizing = auth
      },
   },

   actions: {
      getAuthToken(ctx) {
        ctx.commit('setAuthorizing', true)
        axios.post("/authorize").then((response) => {
          ctx.commit('setAuthToken', response.data)
          ctx.commit('setAuthorizing', false)
        }).catch((error) => {
          ctx.commit('setAuthToken', '')
          ctx.commit('setFatal', "Authorization failed" + error.response.data)
          ctx.commit('setAuthorizing', false)
        })
      },
   }
}

export default auth