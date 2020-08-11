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
      asQueryParam:  (_state, getters) => (poolID) => {
         let filter = getters.poolFilter(poolID)
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

      poolFacets: (state) => (poolID) => {
         let pfObj = state.poolFacets.find( pf => pf.pool == poolID)
         if (!pfObj) {
            return []
         }
         return pfObj.facets
      },

      poolFilter: (state) => (poolID) => {
         let globalVal = state.availabilityValues[state.globalAvailability.id]
         let pfObj = state.poolFacets.find( pf => pf.pool == poolID)
         let filter = [] 
         if (!pfObj) return filter
         if ( !pfObj.facets) return filter
         
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

         pfObj.facets.forEach( f => {
            f.buckets.forEach( bucket => {
               if (bucket.selected == true ) {
                  filter.push( {facet_id: f.id, facet_name: f.name, value: bucket.value})   
               }
            })
         })

         return filter
      },

      // This is only used to get the filter map for use in global search
      allPoolFilters: (_state, getters, rootState) =>  {
         let out = []
         rootState.pools.list.forEach( p => {
            let filter = getters.poolFilter(p.id)
            let add = {pool_id: p.id, facets: filter}
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

      setPoolFacets(state, data) {
         // Get currently selected facets, then clear everything out
         // repopulate with data from API call, and restore prior selected state
         let tgtPFObj = state.poolFacets.find(pf => pf.pool == data.pool)
         if (!tgtPFObj) {
            tgtPFObj = {pool: data.pool, facets: []}
            state.poolFacets.push(tgtPFObj)    
         }
         let tgtFacets = tgtPFObj.facets
         let selected = tgtFacets.filter( f => f.selected == true)
         tgtFacets.splice(0, tgtFacets.length)
         data.facets.forEach( function(facet) {
            // Availability/Circulation are global and handled differently; skip 
            if ( facet.id ==  state.availabilityFacet.id || facet.id == state.circulatingFacet.id) return

            // if this is in the preserved selected items, select it
            if ( selected.some( f => f.id == facet.id) ) {
               facet.selected = true
            }
            tgtFacets.push(facet)
         })
      },

      toggleFilter(state, data) {
         let pfOj = state.poolFacets.find(pf => pf.pool == data.pool)
         let facetInfo = pfOj.facets.find(f => f.id === data.facetID) 

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

      resetPoolFilters(state, pool) {
         let pfObj = state.poolFacets.find( pf => pf.pool == pool) 
         if (pfObj ) {
            pfObj.facets.splice(0, pfObj.facets.length)   
         }  
         state.globalAvailability = {id: "any", name: "All"}
         state.globalCirculating = false
      },

      reset(state) {
         // NOTE: clearing array by setting it to [] breaks vuex
         // responsiveness. Only array methods like push,pop and splice
         // should be used as they preserve responsiveness...
         // https://vuejs.org/v2/guide/list.html#Array-Change-Detection
         state.globalAvailability = {id: "any", name: "Any"}
         state.globalCirculating = false
         state.poolFacets.forEach( pf => {
            pf.facets.splice(0, pf.facets.length)
         })
      },

      restoreFromURL(state, data ) {
         // The filter URL param is just facetID.value,facetID,value,...
         let filter = data.filter 
         let pfIdx = state.poolFacets.findIndex( pf => pf.pool == data.pool)
         let pfObj = null
         if (pfIdx == -1) {
            pfObj = {pool: data.pool, facets: []}
         } else {
            pfObj = state.poolFacets[pfIdx]
         }

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

            let facet = pfObj.facets.find(f => f.id == facetID)
            if ( facet  ) {
               let bucket = facet.buckets.find( b => b.value == filterVal)
               if (bucket) {
                  bucket.selected = true
               } else {
                  facet.buckets.push({value: filterVal, selected: true})
               }
            } else {
               let newFacet = {id: facetID, buckets: [ {selected: true, value: filterVal} ]}
               pfObj.facets.push( newFacet )    
            }
         })
         if ( pfIdx > -1) {
            state.poolFacets.splice(pfIdx,1)
         }
         state.poolFacets.push(pfObj)
      },
   },

   actions: {
      // Get all facets for the selected result set / query / pool
      async getSelectedResultFacets(ctx) {
         // Recreate the query for the target pool, but include a 
         // request for ALL facet info
         let resultsIdx = ctx.rootState.selectedResultsIdx
         let pool = ctx.rootState.results[resultsIdx].pool
         if (!ctx.rootGetters['pools/facetSupport'](pool.id)) {
            // this pool doesn't support facets; nothing more to do
            return
         }

         let filters = ctx.getters.poolFilter(pool.id)
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
            ctx.commit("setPoolFacets", {pool: pool.id, facets: facets})
            ctx.commit('setUpdatingFacets', false)
         }).catch((error) => {
            if (error.response && error.response.status == 501) {
               ctx.commit("setPoolFacets", {pool: pool.id, facets: false})
            }
            ctx.commit('setUpdatingFacets', false)
          })
      }
   }
}

export default filters
