import axios from 'axios'

const filters = {
   namespaced: true,
   state: {
      // facet/filter array indexes match main poolResults array
      // IMPORTANT: Must use arrays here instead of a map from 
      // resultsIdx -> filter data as vuex cannot detect state changes 
      // in nested objects!
      poolFacets: [], 
      poolFilters: [],
      adding: false,
      updatingBuckets: false
   },

   getters: {
      poolFacets: (state) => (idx) => {
         if ( idx == -1 || idx >= state.poolFacets.length) {
            return []
         }
         // Facets array contains some nested bucket info; map only facet
         return  state.poolFacets[idx].map( f => f.facet )
      },

      facetBuckets: (state) => (idx, facetID) => {
         if ( idx == -1 || idx >= state.poolFacets.length) {
            return []
         }
         let facet = state.poolFacets[idx].find(f => f.facet.id === facetID) 
         // TODO filter this list to exclude values that are being used 
         // in filters
         return facet.buckets
      },

      hasFilter: (state) => (idx) => {
         return state.poolFilters[idx].length > 0
      },

      // By default the data stored for the filter is heirarchical; one facet
      // owning a list of values: [ {facet: name, values: [v1,v2,...]}, ... ]
      // The API wants a simple flat list with multiple facet/value pairs like:
      // [ {name: facet, value: v1}, ...]
      // This getter takes a fmt param that is either api or raw to control the response
      poolFilter: (state) => (idx, fmt) => {
         if (fmt == "api") {
            let apiFilter = []
            state.poolFilters[idx].forEach(function(filterObj) {
               filterObj.values.forEach(function(val){
                  apiFilter.push({facet_id: filterObj.facet.id, value_id: val})
               } )
            })
            return apiFilter
         }
         return state.poolFilters[idx]
      }
   },

   mutations: {
      setAllAvailableFacets(state, data) {
         state.poolFacets = []
         state.poolFilters = []
         data.pool_results.forEach(function (pr, resultIdx) {
            let poolFacets = []
            state.poolFilters.push([])  // add empty filter for each pool
            if ( pr.available_facets) {
               pr.available_facets.forEach( function(f) {
                  poolFacets.push( {facet: f, buckets: []} )
               })
            } 
            state.poolFacets[resultIdx] = poolFacets
         })
      },

      showAdd(state) {
         state.adding = true
      },

      closeAdd(state) {
         state.adding = false
      },

      setFacetBuckets(state, data) {
         // NOTE: for all pools but EDS, the facets array is length one
         let allPoolFacets = state.poolFacets[data.poolResultsIdx]
         data.facets.forEach( function(facet) {
            let facetInfo = allPoolFacets.find(f => f.facet.id === facet.id) 
            facetInfo.buckets = []
            facet.buckets.forEach(function (b) {
               // b = {id, value, count}
               facetInfo.buckets.push( {value: b.id, display: `${b.value} (${b.count})`} )
            })
         })
      },

      addFilter(state, data) {
         // data = {poolResultsIdx: idx, facet: name, values: VALUES
         // IMPORTANT: VALUES comes from vue-multiselect which binds 
         // the whole json object for the option into the array
         let allPoolFacets = state.poolFacets[data.poolResultsIdx]
         let facetInfo = allPoolFacets.find(f => f.facet.id === data.facetID) 
         let filter = state.poolFilters[data.poolResultsIdx]
         filter.push( {facet: facetInfo.facet, values: data.values.map(f=>f.value)})
      },

      removeFilter(state, data) {
         // data = {poolResultsIdx: idx, filterIdx: fidx}
         let filters = state.poolFilters[data.poolResultsIdx]
         filters.splice(data.filterIdx,1)
      },
      clearAllFilters(state, idx) {
         state.poolFilters[idx].splice(0, state.poolFilters[idx].length)
      },
      setUpdatingBuckets(state, flag) {
         state.updatingBuckets = flag
      },
      reset(state) {
         state.poolFacets = []
         state.poolFilters = []
      }
   },

   actions: {
      getBuckets(ctx, data) {
         // Recreate the query for the target pool, but include a 
         // request for facet/bucket info for the  specified facet
         let pool = ctx.rootState.results[data.poolResultsIdx].pool
         let req = {
            query: ctx.rootGetters['query/string'],
            pagination: { start: 0, rows: 0 },
            facet: data.facet,
            filters: ctx.getters.poolFilter(data.poolResultsIdx, "api")
          }
         let tgtURL = pool.url+"/api/search"
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         ctx.commit('setUpdatingBuckets', true)
         axios.post(tgtURL, req).then((response) => {
            ctx.commit("setFacetBuckets", {poolResultsIdx: data.poolResultsIdx, 
               facets: response.data.facet_list})
            ctx.commit('setUpdatingBuckets', false)
         }).catch((error) => {
            ctx.commit('setError', error, { root: true })
            ctx.commit('setUpdatingBuckets', false)
          })
      }
   }
}

export default filters