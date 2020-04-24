import axios from 'axios'

import Vue from 'vue'
import Vuex from 'vuex'

import { getField, updateField } from 'vuex-map-fields'

Vue.use(Vuex)

const filters = {
   namespaced: true,
   state: {
      poolFacets: [],
      updatingFacets: false,

      // Global availability and hard-coded filter values
      globalAvailability: {id: "any", name: "All"},
      availabilityFacet: {id: "FacetAvailability", name: "Availability"},
      availabilityValues: {"online": "Online",
         "shelf": "On shelf"},

      // global circulating flag; set to TRUE to hide non-circulating items
      circulatingFacet: {id: "FacetCirculating", name: "Hide items limited to in-Library use"},
      globalCirculating: false
   },

   getters: {
      getField,
      poolFacets: (state) => (idx) => {
         if ( idx == -1 || idx >= state.poolFacets.length) {
            return []
         }
         return  state.poolFacets[idx]
      },

      poolFilter: (state) => (idx) => {
         let globalVal = state.availabilityValues[state.globalAvailability.id]
         let facets = state.poolFacets[idx]
         let filter = [] 
         facets.forEach( f => {
            f.buckets.forEach( bucket => {
               if (bucket.selected == true ) {
                  filter.push( {facet_id: f.id, facet_name: f.name, value: bucket.value})   
               }
            })
         })

         if (state.globalCirculating == true ) {
            filter.unshift({facet_id: state.circulatingFacet.id, 
               // NOTE the value here is not used. Just the presense of this facet implies true
               facet_name: state.circulatingFacet.name, value: ""})    
         }

         if (state.globalAvailability.id == "shelf") {
            filter.unshift({facet_id: state.availabilityFacet.id, 
               facet_name: state.availabilityFacet.name, value: "On shelf"})
         } else if (state.globalAvailability.id != "any") {
            filter.unshift({facet_id: state.availabilityFacet.id, 
               facet_name: state.availabilityFacet.name, value: globalVal})
         }

         return filter
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
      updateField,
      setGlobalAvailability(state, avail) {
         state.globalAvailability = avail
      },
      initialize(state, numPools) {
         state.poolFacets.splice(0, state.poolFacets.length)
         for (let i=0; i<numPools; i++) {
            // add an empty array to contain facets for each pool
            state.poolFacets.push([])
         }
      },

      setPoolFacets(state, data) {
         // clear out all facets for the selected pool, the repopulate
         // them with data from the response
         let tgtFacets = state.poolFacets[data.poolResultsIdx]
         tgtFacets.splice(0, tgtFacets.length)
         data.facets.forEach( function(facet) {
            // Availability/Circulatin is global and handled differently; skip it
            if ( facet.id ==  state.availabilityFacet.id || facet.id == state.circulatingFacet.id) return

            tgtFacets.push(facet)
         })
      },

      toggleFilter(state, data) {
         let allPoolFacets = state.poolFacets[data.poolResultsIdx]
         let facetInfo = allPoolFacets.find(f => f.id === data.facetID) 

         if ( facetInfo.type == "radio") {
            // only one value can be selected in radio buckets
            facetInfo.buckets.forEach( b=>{
               if (b.value == data.value) {
                  b.selected = true
               } else {
                  b.selected = false
               }
            })
         } else {
            let bucket = facetInfo.buckets.find( b=> b.value == data.value ) 
            bucket.selected = !bucket.selected
         }
      },

      setUpdatingFacets(state, flag) {
         state.updatingFacets = flag
      },

      reset(state) {
         // NOTE: clearing array by setting it to [] breaks vuex
         // responsiveness. Only array methods like push,pop and splice
         // should be used as they preserve responsiveness...
         // https://vuejs.org/v2/guide/list.html#Array-Change-Detection
         let numPools = state.poolFacets.length
         state.globalAvailability = {id: "any", name: "Any"}
         state.globalCirculating = false
         state.poolFacets.splice(0, state.poolFacets.length)
         for (let i=0; i<numPools; i++) {
            state.poolFacets.push([])
         }
      },

      // Reset all fliters and add global
      // data struct: data.numPools, data.resultsIdx, data.filters
      // data.filters is array of {facet_id, facet_name, value}
      // NOTE: This must be called after search so the facet data is available
      restoreFilters(state, data) {
          // facet_id = FacetAvailability gets moved into state.globalAvailability
          let avail = data.filters.find( f => f.facet_id==state.availabilityFacet.id)
          if ( avail ) {
             let gaID = ""
             Object.entries(state.availabilityValues).forEach( ([key,value])=>{
                if (value  == avail.value) {
                   gaID = key
                }
             })
             if (gaID.length > 0) {
                state.globalAvailability = {id: gaID, name: avail.value}
             }
          }
 
          // set global circulating filter if present
          let circ = data.filters.find( f => f.facet_id==state.circulatingFacet.id)
          if (circ && circ.value == true) {
             state.globalCirculating = true
          }

         // flag filters as selected
         let facets = state.poolFacets[data.resultsIdx]
         data.filters.forEach( filter => {
            if ( filter.facet_id ==  state.availabilityFacet.id || filter.facet_id == state.circulatingFacet.id) return
            let facet = facets.find(f => f.id == filter.facet_id)
            if ( facet != null ) {
               let bucket = facet.buckets.find( b => b.value == filter.value)
               if (bucket) {
                  bucket.selected = true
               }
            }
         })
      }
   },

   actions: {
      // Get all facets for the selected result set / query / pool
      getSelectedResultFacets(ctx) {
         // Recreate the query for the target pool, but include a 
         // request for ALL facet info
         let resultsIdx = ctx.rootState.selectedResultsIdx
         let pool = ctx.rootState.results[resultsIdx].pool
         if (!ctx.rootGetters['pools/facetSupport'](pool.id)) {
            // this pool doesn't support facets; nothing more to do
            return
         }

         let filters = ctx.getters.poolFilter(resultsIdx)
         let filterObj = {pool_id: pool.id, facets: filters}
         
         let req = {
            query: ctx.rootGetters['query/string'],
            pagination: { start: 0, rows: 0 },
            filters: [filterObj]
          }
         let tgtURL = pool.url+"/api/search/facets"
         ctx.commit('setUpdatingFacets', true)
         return axios.post(tgtURL, req).then((response) => {
            let facets = response.data.facet_list 
            if (!facets) {
               facets = []
            }
            ctx.commit("setPoolFacets", {poolResultsIdx: resultsIdx, facets: facets})
            ctx.commit('setUpdatingFacets', false)
         }).catch((error) => {
            if (error.response && error.response.status == 501) {
               ctx.commit("setPoolFacets", {poolResultsIdx: resultsIdx, facets: false})
            }
            ctx.commit('setUpdatingFacets', false)
          })
      }
   }
}

export default filters
