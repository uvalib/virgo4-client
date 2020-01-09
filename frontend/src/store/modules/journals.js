import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'

const journals = {
   namespaced: true,
   state: {
      query: "",
      searching: false
   },
   getters: {
      getField,
   },
   mutations: {
      updateField,
      setSearching(state, flag) {
         state.searching = flag
      }
   },
   actions: {
      searchJournals(ctx) {
         ctx.commit("setSearching", true)
         let q = ctx.state.query
         axios.get(`/api/journals/browse?title=${q}`).then((response) => {
            ctx.commit("setSearching", false)
            alert(JSON.stringify(response.data))
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      }
   }
}

export default journals