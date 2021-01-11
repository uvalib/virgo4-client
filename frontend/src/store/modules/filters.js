import axios from 'axios'

import Vue from 'vue'
import Vuex from 'vuex'

import { getField, updateField } from 'vuex-map-fields'

import analytics from '../../analytics'

Vue.use(Vuex)

const filters = {
   namespaced: true,
   state: {
      poolFacets: [],
      updatingFacets: false,
   },

   getters: {
      getField,
      asQueryParam:  (_state, getters) => (poolID) => {
         let filter = getters.poolFilter(poolID)
         if (filter.length == 0) {
            return ""
         }
         let outObj = {}
         filter.forEach(f => {
            if (Object.prototype.hasOwnProperty.call(outObj, f.facet_id) == false) {
               outObj[f.facet_id] = []
            }
            if ( f.value.length > 0) {
               outObj[f.facet_id].push(f.value)
            }
         })
         let outStr = JSON.stringify(outObj)
         return outStr
      },

      poolFacets: (state) => (poolID) => {
         let pfObj = state.poolFacets.find( pf => pf.pool == poolID)
         if (!pfObj) {
            return []
         }
         return pfObj.facets
      },

      notApplicableFilters: (state) => (poolID) => {
         let pfObj = state.poolFacets.find( pf => pf.pool == poolID)
         let out = []
         if (!pfObj) return out
         if ( !pfObj.facets) return out
         pfObj.facets.filter( ff => ff.id == "NotApplicable").forEach( f => {
            f.buckets.forEach( nab => {
               out.push(nab.value)
            })
         })
         return out
      },

      poolFilter: (state) => (poolID) => {
         let pfObj = state.poolFacets.find( pf => pf.pool == poolID)
         if (!pfObj) {
            pfObj = {pool: poolID, facets: []}
         }
         let filter = []
         pfObj.facets.forEach( f => {
            if (f.id != "NotApplicable") {
               f.buckets.forEach( bucket => {
                  if (bucket.selected == true ) {
                     filter.push( {facet_id: f.id, facet_name: f.name, value: bucket.value})
                  }
               })
            }
         })

         return filter
      },

      preSearchFilterApplied: state => {
         if ( state.updatingFacets) return false

         let found = false
         let psf = state.poolFacets.find( pf => pf.pool == "presearch")
         if (psf) {
            psf.facets.some( pf => {
               pf.buckets.some( b => {
                  if (b.selected) {
                     found = true
                  }
                  return found == true
               })
               return found == true
            })
         }
         return found
      },

      preSearchFilters: state => {
         if ( state.updatingFacets) return []
         let psf = state.poolFacets.find( pf => pf.pool == "presearch")
         if (psf) {
            return psf.facets
         }
         return []
      },

      // This is only used to get the filter map for use in global search
      allPoolFilters: (_state, getters, rootState) =>  {
         let out = []
         rootState.pools.list.forEach( p => {
            let filter = getters.poolFilter(p.id)
            if (filter.length > 0) {
               let add = {pool_id: p.id, facets: filter}
               out.push(add)
            }
         })
         return out
      }
   },

   mutations: {
      updateField,
      setPreSearchFilters(state, filters) {
         // Clear out PRESEARCH filter only. Leave others alone because they
         // may have been restored from query params
         let psfIdx = state.poolFacets.findIndex( pf => pf.pool == "presearch")
         if ( psfIdx > -1) {
            state.poolFacets.splice(psfIdx, 1)
         }

         // Place all of this data into a transient 'presearch' pool that can be
         // used to apply filters to any pool before search
         let tgtPFObj = {pool: "presearch", facets: []}
         filters.forEach( f => {
            // pre-search filter data format: { id,label,values: [{value,count}] }
            // POSTsearch filter format:      { id,name,type,sort, buckets: [{value,count,selected}] }
            let newF = {id: f.id, name: f.label, type: "", sort: "", hidden: f.hidden, buckets: []}
            f.values.forEach( v => {
               newF.buckets.push( {selected: false, value: v.value, count: v.count} )
            })
            tgtPFObj.facets.push(newF)
         })
         state.poolFacets.push(tgtPFObj)

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
         let selected = []
         tgtFacets.forEach( f => {
            f.buckets.filter( b => b.selected == true).forEach( sb => {
               selected.push({id: f.id, value: sb.value})
            })
         })

         tgtFacets.splice(0, tgtFacets.length)
         data.facets.forEach( function(facet) {
            // if this is in the preserved selected items, select it and remove from saved list
            if ( facet.buckets) {
               facet.buckets.forEach( fb => {
                  let idx = selected.findIndex( s => facet.id == s.id && fb.value == s.value )
                  if ( idx > -1) {
                     fb.selected  = true
                     selected.splice(idx,1)
                  }
               })
            } else {
               facet.buckets = []
               selected.filter( s => s.id == facet.id).forEach( sb => {
                  facet.buckets.push({value: sb.value, selected: true, count: 0})
               })
            }
            if ( facet.buckets.length > 0) {
               tgtFacets.push(facet)
            }
         })
         if (selected.length > 0) {
            let notApplicable = {id: "NotApplicable", name: "Not Applicable", buckets: []}
            selected.forEach( s => {
               notApplicable.buckets.push({value: s.value, selected: true, count: 0})
            })
            tgtFacets.push(notApplicable)
         }
      },

      toggleFilter(state, data) {
         let pfOj = state.poolFacets.find(pf => pf.pool == data.pool)
         let facetInfo = pfOj.facets.find(f => f.id === data.facetID)
         let bucket = facetInfo.buckets.find( b=> b.value == data.value )
         bucket.selected = !bucket.selected
         if ( bucket.selected ) {
            if ( data.pool == "presearch") {
               analytics.trigger('Filters', 'PRE_SEARCH_FILTER_SET', `${data.facetID}:${data.value}`)
            } else {
               analytics.trigger('Filters', 'SEARCH_FILTER_SET', `${data.facetID}:${data.value}`)
            }
         } else {
            if ( data.pool == "presearch") {
               analytics.trigger('Filters', 'PRE_SEARCH_FILTER_REMOVED', `${data.facetID}:${data.value}`)
            } else {
               analytics.trigger('Filters', 'SEARCH_FILTER_REMOVED', `${data.facetID}:${data.value}`)
            }
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

         let pre = state.poolFacets.find( pf => pf.pool=="presearch")
         if (pre) {
            pre.facets.forEach( f => {
               f.buckets.forEach(b => {
                  b.selected = false
               })
            })
            state.poolFacets.splice(0, state.poolFacets.length)
            state.poolFacets.push(pre)
         }
      },

      reset(state) {
         console.log("reset filters")
         let pre = state.poolFacets.find( pf => pf.pool=="presearch")
         if (pre) {
            // if presearch filters exist, just flag them all as unselected instead of removing
            // this is because they are only requested once at initial search page load
            pre.facets.forEach( f => {
               f.buckets.forEach(b => {
                  b.selected = false
               })
            })
            state.poolFacets.splice(0, state.poolFacets.length)
            state.poolFacets.push(pre)
         } else {
            state.poolFacets.splice(0, state.poolFacets.length)
         }
      },

      restoreFromURL(state, data ) {
         let filterStr = data.filter
         let pfIdx = state.poolFacets.findIndex( pf => pf.pool == data.pool)
         let pfObj = null
         if (pfIdx == -1) {
            pfObj = {pool: data.pool, facets: []}
         } else {
            pfObj = state.poolFacets[pfIdx]
         }

         let decoded = decodeURIComponent(filterStr).trim()
         let filter =  JSON.parse( decoded )
         Object.keys( filter ).forEach( facetID => {
            let facet = pfObj.facets.find(f => f.id == facetID)
            if ( !facet ) {
               facet = {id: facetID, buckets: []}
               pfObj.facets.push( facet )
            }
            filter[facetID].forEach( filterVal => {
               let bucket = facet.buckets.find( b => b.value == filterVal)
               if (bucket) {
                  bucket.selected = true
               } else {
                  facet.buckets.push({value: filterVal, selected: true})
               }
            })
         })
         if ( pfIdx > -1) {
            state.poolFacets.splice(pfIdx,1, pfObj)
         } else {
            state.poolFacets.push(pfObj)
         }
      },
   },

   actions: {
      promotePreSearchFilters(ctx) {
         console.log("PROMOTE PRE-SEARCH FILTERS")
         let psf = ctx.state.poolFacets.find( pf => pf.pool == "presearch")
         ctx.rootState.pools.list.forEach( pool => {
            let tgtPFObj = ctx.state.poolFacets.find( pf => pf.pool == pool.id)
            if ( !tgtPFObj ) {
               tgtPFObj = {pool: pool.id, facets: []}
               ctx.state.poolFacets.push(tgtPFObj)
            }
            psf.facets.forEach( pf => {
               pf.buckets.forEach( b => {
                  if (b.selected) {
                     let tgtFacet = tgtPFObj.facets.find( tf => tf.id == pf.id)
                     if ( !tgtFacet ) {
                        tgtFacet = {id: pf.id, name: pf.name, sort: pf.sort, type: pf.type, buckets: []}
                        tgtPFObj.facets.push(tgtFacet)
                     }
                     tgtFacet.buckets.push({value: b.value, selected: true})
                  }
               })
            })
         })
      },

      async getPreSearchFilters(ctx) {
         ctx.commit('setUpdatingFacets', true)
         let url = `${ctx.rootState.system.searchAPI}/api/filters`
         return axios.get(url).then((response) => {
            ctx.commit('setPreSearchFilters', response.data)
            ctx.commit('setUpdatingFacets', false)
         }).catch((error) => {
            ctx.commit('setUpdatingFacets', false)
            console.warn("Unable to get pre-search filters: "+JSON.stringify(error))
         })
      },
      // Get all facets for the selected result set / query / pool
      // This is called from 3 different places: when all pools are search, when a specifi pool
      // is search and when a new pool is selected. The first 2 should ALWAYS request new facets
      // as the query has changed. The pool select should only change of there are no facets yet.
      async getSelectedResultFacets(ctx) {
         // Recreate the query for the target pool, but include a
         // request for ALL facet info
         let resultsIdx = ctx.rootState.selectedResultsIdx
         let pool = ctx.rootState.results[resultsIdx].pool
         console.log("GET NEW FACETS FOR "+pool.id)
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

         if (req.query == "") {
            let err = {message: 'EMPTY QUERY', caller: 'getSelectedResultFacets', query: ctx.rootGetters['query/getState']}
            this.dispatch("system/reportError", err)
         }

         let tgtURL = pool.url+"/api/search/facets"
         console.log("GET NEW FACETS CALLING: "+tgtURL)
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
