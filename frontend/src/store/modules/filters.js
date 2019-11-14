import axios from 'axios'

import Vue from 'vue'
import Vuex from 'vuex'

import { getField, updateField } from 'vuex-map-fields'

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
      getField,
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
      facetBuckets: (state,getters) => (idx, facetID) => {
         if ( idx == -1 || idx >= state.poolFacets.length) {
            return []
         }
         // facetInfo struct:  { facet{id,name}, buckets[ {value,display} ] }
         // filters struct: [ {facet_id, value }]
         let facetInfo = state.poolFacets[idx].find(f => f.facet.id === facetID) 
         let buckets = facetInfo.buckets.slice();
         let filters = getters.poolFilter(idx, "api")
         filters.forEach( filter => {
            // see if a filter already exists using the selected facet
            if (filter.facet_id == facetInfo.facet.id) {
               // remove filter.value from buckets items (item.value)
               buckets = buckets.filter(b => b.value != filter.value)
            }
         })
         return buckets
      },

      hasFilter: (state) => (idx) => {
         if ( state.globalAvailability.id != "any" ) return true
         if (idx < 0) return false
         let defaultFacets = state.poolDefaultFacets[idx]
         let hasDefaults = false
         if ( defaultFacets ) {
            hasDefaults =  defaultFacets.length > 0
         }
         let hasFilter = false
         let filters = state.poolFilters[idx]
         if (filters) {
            hasFilter =  filters.length > 0
         }
         return (hasFilter || hasDefaults)
      },

      poolFilter: (state) => (idx) => {
         let globalVal = state.availabilityValues[state.globalAvailability.id]
         let out = state.poolFilters[idx].slice(0)

         if (state.globalAvailability.id != "any") {
            out.push({facet_id: state.availabilityFacet, value: globalVal})
         }

         let defaultFacets = state.poolDefaultFacets[idx]
         if (defaultFacets) {
           // Already formatted in setAllAvailableFacets
           out.push(...defaultFacets)
         }

         return out
      },

      // This is only used to get the API-formatted filter for use in global search
      globalFilter: (state) =>  {
         let filter = []
         if (state.globalAvailability.id != "any") {
            let globalVal = state.availabilityValues[state.globalAvailability.id]
            filter.push({facet_id: state.availabilityFacet, value: globalVal})
         }
         return filter
      }
   },

   mutations: {
      updateField,
      setAllAvailableFacets(state, data) {
         state.poolFacets = []
         state.poolFilters = []
         state.defaultFacets = []
         data.pool_results.forEach(function (pr, resultIdx) {
            let poolFacets = []
            let defaultFacets = []
            state.poolFilters.push([]) // add empty filter for each pool

            if ( pr.available_facets) {
               // NOTE: Facet is an object with .id and .name
               pr.available_facets.forEach( function(f) {
                  poolFacets.push( {facet: f, buckets: []} )
               })
            }
            state.poolFacets[resultIdx] = poolFacets

            if ( pr.default_facets) {
              pr.default_facets.forEach( function(f) {
                // Format default facets
                let defaultFacet = {"id": f.facet_id, name: f.name}
                defaultFacets.push( {facet: defaultFacet, values: f.values} )
              })
            }
            state.poolDefaultFacets[resultIdx] = defaultFacets
         })
      },

      setFacets(state, data) {
         let allPoolFacets = state.poolFacets[data.poolResultsIdx]
         data.facets.forEach( function(facet) {
            let facetInfo = allPoolFacets.find(f => f.facet.id === facet.id) 
            facetInfo.buckets = []
            facet.buckets.forEach(function (b) {
               // b = {value, count}
               facetInfo.buckets.push( {value: b.value, display: `${b.value} (${b.count})`} )
            })
         })
      },

      toggleFilter(state, data) {
         // data = {poolResultsIdx: idx, facet: facetID, value: facet bucket value
         let allPoolFacets = state.poolFacets[data.poolResultsIdx]
         let facetInfo = allPoolFacets.find(f => f.facet.id === data.facetID) 
         let filter = state.poolFilters[data.poolResultsIdx]
         let filterIdx = filter.findIndex( f=> f.facet_id == data.facetID && f.value == data.value ) 
         if (filterIdx > -1) {
            filter.splice(filterIdx, 1)
         } else {
            // Add a new filter to the list. A filter is just FacetID and value
            filter.push( {facet_id: facetInfo.facet.id, value: data.value})
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
         let req = {
            query: ctx.rootGetters['query/string'],
            pagination: { start: 0, rows: 0 },
            facet: "all",
            filters: ctx.getters.poolFilter(resultsIdx, "api")
          }
         let tgtURL = pool.url+"/api/search"
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         ctx.commit('setUpdatingFacets', true)
         axios.post(tgtURL, req).then((response) => {
            ctx.commit("setFacets", {poolResultsIdx: resultsIdx, 
               facets: response.data.facet_list})
            ctx.commit('setUpdatingFacets', false)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setUpdatingFacets', false)
          })
      }
   }
}

export default filters
