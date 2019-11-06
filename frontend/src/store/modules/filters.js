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
      adding: false,
      updatingBuckets: false,

      // Global availability and hard-coded filter values
      globalAvailability: {id: "any", name: "Any"},
      availabilityFacet: "FacetAvailability",
      availabilityValues: {"online": "Online",
         "shelf": "On shelf"},

      applyDefaultFacets: []

   },

   getters: {
      getField,
      poolFacets: (state) => (idx) => {
         if ( idx == -1 || idx >= state.poolFacets.length) {
            return []
         }
         // Facets array contains some nested bucket info; map only facet
         return  state.poolFacets[idx].map( f => f.facet )
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

      // By default the data stored for the filter is heirarchical; one facet 
      // owning a list of values: [ {facet: name, values: [v1,v2,...]}, ... ]
      // The API wants a simple flat list with multiple facet/value pairs like:
      // [ {name: facet, value: v1}, ...]
      // This getter takes a fmt param that is either api or raw to control the response
      poolFilter: (state) => (idx, fmt) => {
         let apiFilter = []
         let globalVal = state.availabilityValues[state.globalAvailability.id]
         let out = state.poolFilters[idx].slice(0)
         let globalIncluded = false
         out.forEach(function(filterObj) {
            filterObj.values.forEach(function(val){
               if (filterObj.facet.id == state.availabilityFacet && val == globalVal) {
                  globalIncluded = true
               }
               apiFilter.push({facet_id: filterObj.facet.id, value: val})
            } )
         })

         if (fmt == "api") {
            if (state.globalAvailability.id != "any" && globalIncluded == false) {
               apiFilter.push({facet_id: state.availabilityFacet, value: globalVal})
            }
            return apiFilter
         }

         if (state.globalAvailability.id != "any" && globalIncluded == false) {
            let availFacet = {"id": state.availabilityFacet, name: "Availability"}
            out.push( {"facet": availFacet, "values": [globalVal]})
         }

         let defaultFacets = state.poolDefaultFacets[idx]
         if (state.applyDefaultFacets[idx] && defaultFacets) {
           // Already formatted in setAllAvailableFacets
           out.push(...defaultFacets)
         }
         state.applyDefaultFacets[idx] = false

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

            if ( state.applyDefaultFacets && pr.default_facets) {
              pr.default_facets.forEach( function(f) {
                // Format default facets
                let defaultFacet = {"id": f.facet_id, name: f.name}
                defaultFacets.push( {facet: defaultFacet, values: f.values} )
              })
              state.poolDefaultFacets[resultIdx] = defaultFacets
              state.applyDefaultFacets[resultIdx] = true
            } else {
              state.applyDefaultFacets[resultIdx] = false
            }
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
               // b = {value, count}
               facetInfo.buckets.push( {value: b.value, display: `${b.value} (${b.count})`} )
            })
         })
      },

      addFilter(state, data) {
         // data = {poolResultsIdx: idx, facet: name, values: VALUES
         // IMPORTANT: VALUES comes from vue-multiselect which binds 
         // the whole json object for the option into the array. Just add value
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
         })/*.catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setUpdatingBuckets', false)
          })*/
      }
   }
}

export default filters
