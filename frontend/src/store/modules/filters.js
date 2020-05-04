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
      asQueryParam:  (_state, getters) => (idx) => {
         let filter = getters.poolFilter(idx)
         if (filter.length == 0) {
            return ""
         }
         let out = []
         filter.forEach(f => {
            if ( f.value.length > 0) {
               out.push(`${f.facet_id}.${f.value}`)
            } else {
               out.push(f.facet_id)   
            }
         })
         // string of id.val|id.val|...
         return out.join("|")
      },
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
         if (!facets) return []
         
         if (state.globalCirculating == true ) {
            filter.push({facet_id: state.circulatingFacet.id, 
               // NOTE the value here is not used. Just the presense of this facet implies true
               facet_name: state.circulatingFacet.name, value: ""})    
         }

         if (state.globalAvailability.id == "shelf") {
            filter.push({facet_id: state.availabilityFacet.id, 
               facet_name: state.availabilityFacet.name, value: "On shelf"})
         } else if (state.globalAvailability.id != "any") {
            filter.push({facet_id: state.availabilityFacet.id, 
               facet_name: state.availabilityFacet.name, value: globalVal})
         }

         facets.forEach( f => {
            f.buckets.forEach( bucket => {
               if (bucket.selected == true ) {
                  filter.push( {facet_id: f.id, facet_name: f.name, value: bucket.value})   
               }
            })
         })

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

      restoreFromURL(state, data ) {
         // The filter URL param is just facetID.value,facetID,value,...
         let filter = data.filter 
         let resultIdx = data.resultIdx
         let facets = state.poolFacets[resultIdx]

         filter.split("|").forEach( fp => {
            let facetID = fp.split(".")[0]
            let filterVal = fp.split(".")[1]

            if (facetID == state.availabilityFacet.id) {
               Object.entries(state.availabilityValues).forEach( ([key,value])=>{
                  if (value  == filterVal) {
                     state.globalAvailability = {id: key, name: filterVal}
                  }
               })
               return
            }

            if (facetID == state.circulatingFacet.id) {
               state.globalCirculating = true
               return
            }

            let facet = facets.find(f => f.id == facetID)
            if ( facet != null ) {
               let bucket = facet.buckets.find( b => b.value == filterVal)
               if (bucket) {
                  bucket.selected = true
               } else {
                  facet.buckets.push({value: filterVal, selected: true})
               }
            } 
         })
      },
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
