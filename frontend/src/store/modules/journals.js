import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'

const journals = {
   namespaced: true,
   state: {
      query: "",
      searching: false,
      titles: [],
      browseTotal: -1
   },
   getters: {
      getField,
      query(state) {
        return state.query
      },
   },
   mutations: {
      updateField,
      setSearching(state, flag) {
         state.searching = flag
      },
      setTitleResults(state, results) {
         state.titles.splice(0, state.titles.length)
         results.forEach( res => {
            state.titles.push( res )
         })
         state.browseTotal = results.length
      },
      setQuery(state, q) {
        state.query = q
      }

   },
   actions: {
      searchJournals(ctx) {
         ctx.commit("setSearching", true)
         let q = ctx.state.query
         axios.get(`/api/journals/browse?title=${q}`).then((response) => {
            ctx.commit("setSearching", false)
            ctx.commit("setTitleResults", response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      }
   }
}

export default journals
