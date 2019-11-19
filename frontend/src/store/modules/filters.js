import axios from 'axios'

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const filters = {
   namespaced: true,
   state: {
      // facet/filter array indexes match main poolResults array
      // IMPORTANT: Must use arrays here instead of a map from 
      // resultsIdx -> filter data as vuex cannot detect state changes 
      // in nested objects!
      poolDefaultFacets: [],
      poolFacets: [],
      poolFilters: [],
      updatingFacets: false,

      // Global availability and hard-coded filter values
      globalAvailability: {id: "any", name: "Any"},
      availabilityFacet: "FacetAvailability",
      availabilityValues: {"online": "Online",
         "shelf": "On shelf"}
   },

   getters: {
      poolFacets: (state) => (idx) => {
         if ( idx == -1 || idx >= state.poolFacets.length) {
            return []
         }
         return  state.poolFacets[idx]
      },
      poolDefaultFacets: (state) => (idx) => {
         if ( idx == -1 || idx >= state.poolDefaultFacets.length) {
            return []
         }
         return  state.poolDefaultFacets[idx]
      },

      hasFilter: (state) => (idx) => {
         if (idx < 0) return false
         if ( state.globalAvailability.id != "any" ) return true
         let hasFilter = false
         let filters = state.poolFilters[idx]
         if (filters) {
            hasFilter =  filters.length > 0
         }
         return (hasFilter || hasDefaults)
      },

      poolFilter: (state) => (idx) => {
         let globalVal = state.availabilityValues[state.globalAvailability.id]
         let out = []
         if (state.poolFilters[idx]) {
            out = state.poolFilters[idx].slice(0)
         }

         if (state.globalAvailability.id != "any") {
            out.unshift({facet_id: state.availabilityFacet, value: globalVal,
               display: {facet: "Availability", value: globalVal}})
         }

         return out
      },

      // This is only used to get the filter map for use in global search
      globalFilter: (_state, getters, rootState) =>  {
         let out = []
         rootState.results.forEach( (r,idx) => {
            let filter = getters.poolFilter(idx)
            let poolId = r.pool.id
            let add = {pool_id: poolId, facets: filter}
            out.push(add)
         })    
         return out  
      }
   },

   mutations: {
      setGlobalAvailability(state, avail) {
         state.globalAvailability = avail
      },
      setAllAvailableFacets(state, data) {
         state.poolFacets = []
         Vue.set(vm.someObject, 'myArrayName', [1,2,3]);

         // If filters are present, don't remove them
         let addEmptyFilters = (state.poolFilters.length == 0)
         
         data.pool_results.forEach(function (pr, resultIdx) {
            let poolFacets = []
            if (addEmptyFilters) {
               state.poolFilters.push([]) // add empty filter for each pool
            }

            if ( pr.available_facets) {
               // NOTE: Facet is an object with .id and .name
               pr.available_facets.forEach( function(f) {
                  poolFacets.push( {id: f.id, name: f.name, buckets: []} )
               })
            }
            state.poolFacets[resultIdx] = poolFacets
         })
      },

      setFacets(state, data) {
         let allPoolFacets = state.poolFacets[data.poolResultsIdx]
         data.facets.forEach( function(facet) {
            let facetInfo = allPoolFacets.find(f => f.id === facet.id) 
            facetInfo.buckets = []
            facet.buckets.forEach(function (b) {
               // b = {value, count}
               facetInfo.buckets.push( {value: b.value, count: b.count} )
            })
         })
      },

      toggleFilter(state, data) {
         // data = {poolResultsIdx: idx, facet: facetID, value: facet bucket value
         let allPoolFacets = state.poolFacets[data.poolResultsIdx]
         let facetInfo = allPoolFacets.find(f => f.id === data.facetID) 
         let fValue = facetInfo.buckets.find(b => b.value === data.value) 
         let filter = state.poolFilters[data.poolResultsIdx]
         let filterIdx = filter.findIndex( f=> f.facet_id == data.facetID && f.value == data.value ) 
         if (filterIdx > -1) {
            filter.splice(filterIdx, 1)
         } else {
            // Add a new filter to the list. A filter is just FacetID and value
            // Tack on a display obect to each to facilitate filter display in UI
            filter.push( {facet_id: facetInfo.id, value: data.value, 
               display: {facet: facetInfo.name, value: fValue.value}})
         }
      },

      clearAllFilters(state, idx) {
         state.poolFilters[idx].splice(0, state.poolFilters[idx].length)
      },

      setUpdatingFacets(state, flag) {
         state.updatingFacets = flag
      },

      reset(state) {
         state.poolFacets = []
         state.poolFilters = []
      }
   },

   actions: {
      // Get all facets for the selected result set / query / pool
      getAllFacets(ctx) {
         // Recreate the query for the target pool, but include a 
         // request for ALL facet info
         let resultsIdx = ctx.rootState.selectedResultsIdx
         let pool = ctx.rootState.results[resultsIdx].pool
         let filters = ctx.getters.poolFilter(resultsIdx)
         let filterObj = {pool_id: pool.id, facets: filters}
         
         let req = {
            query: ctx.rootGetters['query/string'],
            pagination: { start: 0, rows: 0 },
            filters: [filterObj]
          }
         let tgtURL = pool.url+"/api/search/facets"
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         ctx.commit('setUpdatingFacets', true)
         axios.post(tgtURL, req).then((response) => {
            let facets = response.data.facet_list 
            if (!facets) {
               facets = []
            }
            ctx.commit("setFacets", {poolResultsIdx: resultsIdx, facets: facets})
            ctx.commit('setUpdatingFacets', false)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setUpdatingFacets', false)
          })
      }
   }
}

export default filters
