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
         // Faceets array contains some nested bucket info; map only facet name
         return  state.poolFacets[idx].map( f => f.facet )
      },
      facetBuckets: (state) => (idx, facetName) => {
         if ( idx == -1 || idx >= state.poolFacets.length) {
            return []
         }
         let facet = state.poolFacets[idx].find(f => f.facet === facetName) 
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
                  apiFilter.push({name: filterObj.facet, value: val})
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
            pr.available_facets.forEach( function(f) {
               poolFacets.push( {facet: f, buckets: []} )
            })
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
         let allPoolFacets = state.poolFacets[data.poolResultsIdx]
         let facetInfo = allPoolFacets.find(f => f.facet === data.facet) 
         facetInfo.buckets = []
         data.buckets.forEach(function (b) {
            facetInfo.buckets.push( {value: b.value, name: `${b.value} (${b.count})`} )
         })
      },
      addFilter(state, data) {
         // data = {poolResultsIdx: idx, facet: name, values: VALUES
         // IMPORTANT: VALUES comes from vue-multiselect which binds 
         // the whole json object for the option into the array
         // Simplify the value objects into just an array of string values
         let filter = state.poolFilters[data.poolResultsIdx]
         filter.push( {facet: data.facet, values: data.values.map(f=>f.value)})
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
      }
   },

   actions: {
      // ctx members:  getters, rootGetters, rootState, state
      getBuckets(ctx, data) {
         // Recreate the query for the target pool, but include a 
         // request for facet/bucket info for the  specified facet
         let poolURL = ctx.rootGetters['poolResultsURL'](data.poolResultsIdx)
         let req = {
            query: ctx.rootGetters['query/string'],
            pagination: { start: 0, rows: 0 },
            facet: data.facet,
            filters: ctx.getters.poolFilter(data.poolResultsIdx, "api")
          }
         let tgtURL = poolURL+"/api/search"
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.auth.authToken
         ctx.commit('setUpdatingBuckets', true)
         axios.post(tgtURL, req).then((response) => {
            ctx.commit("setFacetBuckets", {poolResultsIdx: data.poolResultsIdx, 
               facet: data.facet, buckets: response.data.facet_list[0].buckets}
            )
            ctx.commit('setUpdatingBuckets', false)
         }).catch((error) => {
            ctx.commit('setError', error, { root: true })
            ctx.commit('setUpdatingBuckets', false)
          })
      }
   }
}

export default filters