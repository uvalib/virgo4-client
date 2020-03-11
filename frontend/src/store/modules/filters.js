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
      poolFacets: [],
      poolFilters: [],
      updatingFacets: false,

      // Global availability and hard-coded filter values
      globalAvailability: {id: "any", name: "All"},
      availabilityFacet: "FacetAvailability",
      availabilityValues: {"online": "Online",
         "shelf": "On Shelf Now"}
   },

   getters: {
      poolFacets: (state) => (idx) => {
         if ( idx == -1 || idx >= state.poolFacets.length) {
            return []
         }
         return  state.poolFacets[idx]
      },

      hasFilter: (state) => (idx) => {
         if (idx < 0) return false
         if ( state.globalAvailability.id != "any" ) return true
         let hasFilter = false
         let filters = state.poolFilters[idx]
         if (filters) {
            hasFilter =  filters.length > 0
         }
         return hasFilter
      },

      poolFilter: (state) => (idx) => {
         let globalVal = state.availabilityValues[state.globalAvailability.id]
         let out = []
         if (state.poolFilters[idx]) {
            out = state.poolFilters[idx].slice(0)
         }

         if (state.globalAvailability.id != "any") {
            out.unshift({facet_id: state.availabilityFacet, 
               facet_name: "Availability", value: globalVal})
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

      initialize(state, numPools) {
         // only initialize filters ONCE to preserve user changes.
         // The only time fiters are cleared us upon a user clicking clear
         // or starting a new search
         let addEmptyFilters = (state.poolFilters.length == 0)
         state.poolFacets.splice(0, state.poolFacets.length)
         for (let i=0; i<numPools; i++) {
            // add an empty array to contain facets for each pool
            state.poolFacets.push([])
            if ( addEmptyFilters) {
               state.poolFilters.push([])    
            }
         }
      },

      setPoolFacets(state, data) {
         // cler out all facets for the selected pool, the repopulate
         // them with data from the response
         let tgtFacets = state.poolFacets[data.poolResultsIdx]
         let tgtFilter = state.poolFilters[data.poolResultsIdx]
         tgtFacets.splice(0, tgtFacets.length)
         
         // If there are no facets, wipe out all filters and bail
         if (data.facets === false || data.facets.length == 0) {
            tgtFilter.splice(0, tgtFilter.length)
            return
         }

         // remove any filters that are no longer present in the facet list
         tgtFilter.forEach( (filter,idx,filters) => {
            if ( filter.id == "FacetAvailability") return
            let existIdx = data.facets.findIndex( facet => facet.id == filter.id )
            if (existIdx == -1) {
               filters.splice(idx, 1);
            }
         })

         data.facets.forEach( function(facet) {
            // Availability is global and handled differently; skip it
            if ( facet.id == "FacetAvailability") return

            let facetInfo = {id: facet.id, name: facet.name, buckets: []}
            if ( facet.type) {
               facetInfo.type = facet.type 
            }

            // first add any facets that are part of the filter
            tgtFilter.filter(filter => filter.facet_id == facet.id).forEach( af=> {
               facetInfo.buckets.push( {value: af.value, count: -1} )  
            })

            // next add the rest, without duplicating what was added above
            facet.buckets.forEach(function (b) {
               let applied = facetInfo.buckets.find( fb => fb.value == b.value)
               if ( applied ) {
                  applied.count = b.count
               } else {
                  facetInfo.buckets.push( {value: b.value, count: b.count} )
                  if (b.selected) {
                     let idx = tgtFilter.findIndex( f=> f.facet_id == facetInfo.id && f.value == b.value ) 
                     if ( idx == -1) {
                        tgtFilter.push( {facet_id: facetInfo.id, facet_name: facetInfo.name, value: b.value} )
                     }
                  }
               }
            })
            tgtFacets.push(facetInfo)
         })
      },

      toggleFilter(state, data) {
         // data = {poolResultsIdx: idx, facet: facetID, value: facet bucket value
         let allPoolFacets = state.poolFacets[data.poolResultsIdx]
         let facetInfo = allPoolFacets.find(f => f.id === data.facetID) 
         let filter = state.poolFilters[data.poolResultsIdx]

         if ( facetInfo.type == "radio") {
            // get a list of all filters that are not this one. Wipe out the 
            // original filters and add the elements in the new array one at a time
            // This ensures that filter array remains reactive
            let others = filter.filter( f => f.facet_id != data.facetID )
            filter.splice(0, filter.length)
            others.forEach( f=> {
               filter.push(f)  
            })
            filter.push( {facet_id: facetInfo.id, facet_name: facetInfo.name, value: data.value})
         } else {
            let filterIdx = filter.findIndex( f=> f.facet_id == data.facetID && f.value == data.value ) 
            if (filterIdx > -1) {
               filter.splice(filterIdx, 1)
            } else {
               // Add a new filter to the list. A filter is just FacetID and value
               // Tack on a display obect to each to facilitate filter display in UI
               filter.push( {facet_id: facetInfo.id, facet_name: facetInfo.name, value: data.value})
            }
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
         state.poolFacets.splice(0, state.poolFacets.length)
         state.poolFilters.splice(0, state.poolFilters.length)
         for (let i=0; i<numPools; i++) {
            state.poolFacets.push([])
            state.poolFilters.push([])    
         }
      },

      restoreFilters(state, data) {
         // data.filters is array of {facet_id, facet_name, value}
         // facet_id = FacetAvailability gets moved into state.globalAvailability
         // all others go into state.poolFilters. Init facets and filters 
         // to blank arrays with length numPools
         state.poolFacets.splice(0, state.poolFacets.length)
         state.poolFilters.splice(0, state.poolFilters.length)
         for (let i=0; i< data.numPools; i++) {
            state.poolFacets.push([])   
            state.poolFilters.push([])   
         }

         // set global filter if present
         let avail = data.filters.find( f => f.facet_id=="FacetAvailability")
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

         // set all other filters
         data.filters.filter(f => f.facet_id != "FacetAvailability").forEach( pf => {
            state.poolFilters[data.resultsIdx].push(pf)
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
