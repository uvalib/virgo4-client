import axios from 'axios'

const filters = {
   namespaced: true,
   state: {
      facets: [],
      facetBuckets: {},
      filters: [],
      adding: false,
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
      },
      facetValuesAvailable: (state) => (facet) => {
         return (facet in state.facetBuckets)
      },
      facetBuckets: (state) => (facet) => {
         return state.facetBuckets[facet]
      }
   },

   mutations: {
      setAllAvailableFacets(state, data) {
         state.facets = []
         state.filters = []
         state.facetBuckets = {}
         data.pool_results.forEach(function (pr) {
            state.facets.push( pr.available_facets.filter(f => f != "all") )
         })
      },
      showAdd(state) {
         state.adding = true
      },
      closeAdd(state) {
         state.adding = false
      },
      setFacetBuckets(state, data) {
         state.facetBuckets[data.facet] = []
         data.buckets.forEach(function (b) {
            state.facetBuckets[data.facet].push( {value: b.value, name: `${b.value} (${b.count})`} )
         })
      }
   },

   actions: {
      getBuckets({ _state, commit, rootState, rootGetters}, data) {
         // Recreate the query for the target pool, but include a 
         // request for facet/bucket info for the  specified facet
         let poolURL = rootGetters['pools/poolURL'](data.poolIdx)
         let req = {
            query: rootGetters['query/string'],
            pagination: { start: 0, rows: 0 },
            facet: data.facet
          }
         let tgtURL = poolURL+"/api/search"
         axios.defaults.headers.common['Authorization'] = "Bearer "+rootState.auth.authToken
         commit('setSearching', true, { root: true })
         axios.post(tgtURL, req).then((response) => {
            commit("setFacetBuckets", {facet: data.facet, buckets: response.data.facet_list[0].buckets})
            commit('setSearching', false, { root: true })
         }).catch((error) => {
            commit('setError', error, { root: true })
            commit('setSearching', false, { root: true })
          })
      }
   }
}

export default filters