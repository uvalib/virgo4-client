import { getField, updateField } from 'vuex-map-fields'

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
      }
   }
}

export default journals