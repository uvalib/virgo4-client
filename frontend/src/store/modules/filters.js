const filters = {
   namespaced: true,
   state: {
      facets: [],
      filters: []
   },

   getters: {
      poolFacets: (state) => (idx) => {
         if (idx == -1) {
            return []
         }
         return state.facets[idx]
      },
      hasFilter: (state) => {
         return state.filters.length > 0
      }
   },

   mutations: {
      setAllAvailableFacets(state, data) {
         state.facets = []
         state.filters = []
         data.pool_results.forEach(function (pr) {
            state.facets.push(pr.available_facets)
         })
      }
   },

   actions: {
   }
}

export default filters