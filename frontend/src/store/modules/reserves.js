import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'

const reserves = {
   namespaced: true,
   state: {
      searching: false,
      query: ""
   },

   getters: {
      getField,
   },

   mutations: {
      updateField,
      setSearching(state, flag) {
         state.searching = flag
      },
   }, 

   actions: {
      getDesks(ctx) {
         ctx.commit('setSearching', true)
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         axios.get(`/api/reserves/desks`).then((response) => {
            ctx.commit('setDesks', response.data)
            ctx.commit('setSearching', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setSearching', false)
          })
      }
   }
}

export default reserves