import axios from 'axios'
import analytics from '../analytics'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { usePoolStore } from "@/stores/pool"
import { useResultStore } from "@/stores/result"
import { useQueryStore } from "@/stores/query"
import { useCollectionStore } from "@/stores/collection"

export const useFilterStore = defineStore('filter', {
	state: () => ({
      facets: [],
      updatingFacets: false,
      getPresearchFacets: false,
   }),

   getters: {
      asQueryParam() {
         return (poolID) => {
            let filter = this.poolFilter(poolID)
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
         }
      },

      poolFacets: state => {
         return (poolID) => {
            let pfObj = state.facets.find( pf => pf.pool == poolID)
            if (!pfObj) {
               return []
            }
            return pfObj.facets
         }
      },

      poolFilter: (state) => {
         return (poolID) => {
            let pfObj = state.facets.find( pf => pf.pool == poolID)
            if (!pfObj) {
               pfObj = {pool: poolID, facets: []}
            }
            let filter = []
            pfObj.facets.forEach( f => {
               f.buckets.forEach( bucket => {
                  if (bucket.selected == true ) {
                     let na = (bucket.na === true)
                     filter.push( {facet_id: f.id, facet_name: f.name, value: bucket.value, na: na})
                  }
               })
            })

            return filter
         }
      },

      preSearchFilterApplied: state => {
         if ( state.updatingFacets) return false

         let found = false
         let psf = state.facets.find( pf => pf.pool == "presearch")
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
         let psf = state.facets.find( pf => pf.pool == "presearch")
         if (psf) {
            return psf.facets
         }
         return []
      },

      // This is only used to get the filter map for use in global search
      allPoolFilters()  {
         let out = []
         const pools = usePoolStore()
         pools.list.forEach( p => {
            let filter = this.poolFilter(p.id)
            if (filter.length > 0) {
               let add = {pool_id: p.id, facets: filter}
               out.push(add)
            }
         })
         return out
      }
   },

   actions: {
      setDirty() {
         this.facets.forEach( f => {
            if (f.pool != "presearch") {
               f.dirty = true
            }
         })
      },
      setPreSearchFilters(filters) {
         // Clear out PRESEARCH filter only. Leave others alone because they
         // may have been restored from query params
         let psfIdx = this.facets.findIndex( pf => pf.pool == "presearch")
         if ( psfIdx > -1) {
            this.facets.splice(psfIdx, 1)
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
         this.facets.push(tgtPFObj)

      },

      setPoolFacets(data) {
         // Get currently selected facets (both valid and N/A), then clear everything out
         // repopulate with data from API call, and restore prior selected state
         let tgtPFObj = this.facets.find(pf => pf.pool == data.pool)
         if (!tgtPFObj) {
            tgtPFObj = {pool: data.pool, facets: []}
            this.facets.push(tgtPFObj)
         }
         delete tgtPFObj.dirty
         delete tgtPFObj.placeholder
         let tgtFacets = tgtPFObj.facets
         let selected = []
         tgtFacets.forEach( f => {
            f.buckets.filter( b => b.selected == true).forEach( sb => {
               let existIdx = selected.findIndex( s => s.facet_id == f.id && s.value == sb.value)
               if (existIdx == -1) {
                  selected.push({facet_id: f.id, value: sb.value})
               }
            })
         })

         tgtFacets.splice(0, tgtFacets.length)
         data.facets.forEach( facet => {
            // if this is in the preserved selected items, select it and remove from saved list
            facet.buckets.forEach( fb => {
               let idx = selected.findIndex( s => facet.id == s.facet_id && fb.value == s.value )
               if ( idx > -1) {
                  fb.selected  = true
                  selected.splice(idx,1)
               }
            })

            if ( facet.buckets.length > 0) {
               tgtFacets.push(facet)
            }
         })

         selected.forEach( s => {
            let nafIdx = tgtFacets.findIndex( f => f.id == s.facet_id)
            let naf = null
            if ( nafIdx == -1) {
               naf = {id: s.facet_id, na: true, buckets: []}
               nafIdx = tgtFacets.length
            } else {
               naf = tgtFacets[nafIdx]
            }
            naf.buckets.push({value: s.value, selected: true, na: true})
            tgtFacets.splice(nafIdx, 1, naf)
         })
      },

      toggleFilter(pool, facetID, value) {
         let idx = this.facets.findIndex(pf => pf.pool == pool)
         let pfObj = this.facets[idx]
         let fIdx = pfObj.facets.findIndex(f => f.id === facetID)
         let facetInfo = pfObj.facets[fIdx]
         let bIdx = facetInfo.buckets.findIndex( b=> b.value == value )
         let bucket = facetInfo.buckets[bIdx]
         bucket.selected = !bucket.selected
         if ( bucket.selected ) {
            if ( pool == "presearch") {
               analytics.trigger('Filters', 'PRE_SEARCH_FILTER_SET', `${facetID}:${value}`)
            } else {
               analytics.trigger('Filters', 'SEARCH_FILTER_SET', `${facetID}:${value}`)
            }
         } else {
            if ( pool == "presearch") {
               analytics.trigger('Filters', 'PRE_SEARCH_FILTER_REMOVED', `${facetID}:${value}`)
            } else {
               analytics.trigger('Filters', 'SEARCH_FILTER_REMOVED', `${facetID}:${value}`)
            }
         }
         if ( bucket.na ) {
            facetInfo.buckets.splice(bIdx,1)
            if ( facetInfo.buckets.length == 0) {
               pfObj.facets.splice(fIdx,1)
            }
         }
         this.facets.splice(idx, 1, pfObj)
      },

      resetPoolFilters(pool) {
         let pfObj = this.facets.find( pf => pf.pool == pool)
         if (pfObj ) {
            pfObj.facets.forEach( f => {
               if ( f.buckets) {
                  f.buckets.forEach(b => {
                     b.selected = false
                  })
               }
            })
         }
      },

      reset() {
         let pre = this.facets.find( pf => pf.pool=="presearch")
         if (pre) {
            // if presearch filters exist, just flag them all as unselected instead of removing
            // this is because they are only requested once at initial search page load
            pre.facets.forEach( f => {
               f.buckets.forEach(b => {
                  b.selected = false
               })
            })
            this.facets.splice(0, this.facets.length)
            this.facets.push(pre)
         } else {
            this.facets.splice(0, this.facets.length)
         }
         this.setUpdatingPresearchFacets = false
         this.updatingFacets = false
      },

      restoreFromURL( filterStr, pool ) {
         let pfIdx = this.facets.findIndex( pf => pf.pool == pool)
         let pfObj = null
         if (pfIdx == -1) {
            pfObj = {pool: pool, facets: []}
         } else {
            pfObj = this.facets[pfIdx]
         }

         let decoded = decodeURIComponent(filterStr).trim()
         let filter =  JSON.parse( decoded )
         Object.keys( filter ).forEach( facetID => {
            let facet = pfObj.facets.find(f => f.id == facetID)
            if ( !facet ) {
               facet = {id: facetID, buckets: [], placeholder: true}
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
            this.facets.splice(pfIdx,1, pfObj)
         } else {
            this.facets.push(pfObj)
         }
      },

      promotePreSearchFilters() {
         const pools = usePoolStore()
         let psf = this.facets.find( pf => pf.pool == "presearch")
         pools.list.forEach( pool => {
            let tgtPFObj = this.facets.find( pf => pf.pool == pool.id)
            if ( !tgtPFObj ) {
               tgtPFObj = {pool: pool.id, facets: [], placeholder: true}
               this.facets.push(tgtPFObj)
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

      async getPreSearchFilters() {
         const system = useSystemStore()
         this.getPresearchFacets = true
         let url = `${system.searchAPI}/api/filters`
         return axios.get(url).then((response) => {
            this.setPreSearchFilters(response.data)
            this.getPresearchFacets = false
         }).catch((error) => {
            this.getPresearchFacets = false
            console.warn("Unable to get pre-search filters: "+JSON.stringify(error))
         })
      },

      // Get all facets for the selected result set / query / pool
      // This is called from 3 different places: when all pools are searched, when a specific pool
      // is searched and when a new pool is selected. The first 2 should ALWAYS request new facets
      // as the query has changed. The pool select should only change of there are no facets yet.
      getSelectedResultFacets(paramsChanged) {
         const resultStore = useResultStore()
         const query = useQueryStore()
         const collectionStore = useCollectionStore()

         let resultsIdx = resultStore.selectedResultsIdx
         if ( resultsIdx == -1) {
            return
         }
         if (this.updatingFacets) {
            return
         }

         let pool = resultStore.results[resultsIdx].pool
         let filters = this.poolFilter(pool.id)
         let filterObj = {pool_id: pool.id, facets: filters}
         if (paramsChanged == false) {
            // check filter for either: no filters or placeholder filters (presearch promotions or restored from url)
            let poolFacetObj = this.facets.find( pf => pf.pool == pool.id)
            if ( poolFacetObj ) {
               if ( poolFacetObj.dirty === true ) {
                  console.log("pool "+poolFacetObj.pool+" facets marked dirty by a new search; refreshing")
               } else {
                  // if there are no facets present, they must be requested
                  let requestFacets = (poolFacetObj.facets.length == 0)
                  if ( requestFacets == false ) {
                     // some facets are present, see if any are placeholders. If so a request is needed
                     poolFacetObj.facets.forEach( pf => {
                        if ( pf.placeholder === true ) {
                           requestFacets = true
                        }
                     })
                  }

                  if ( requestFacets === false ) {
                     console.log("pool "+poolFacetObj.pool+" facets are current, do not refresh")
                     return
                  }
               }
            }
         }

         // this lets a SINGLE collection context show up at the top of the search results
         collectionStore.clearCollectionDetails()
         let done = false
         collectionStore.collections.some( c => {
            let filter = filterObj.facets.find( f=>f.facet_id == c.filter_name && f.value == c.title)
            if (filter) {
               collectionStore.getCollectionContext(filter.value)
               done = true
            }
            return done == true
         })

         // Recreate the query for the target pool, but include a request for ALL facet info
         let req = {
            query: query.string,
            pagination: { start: 0, rows: 0 },
            filters: [filterObj]
         }
         if (req.query == "") {
            const system = useSystemStore()
            let err = {message: 'EMPTY QUERY', caller: 'getSelectedResultFacets', query: query.stateObject}
            system.reportError(err)
            return
         }

         let tgtURL = pool.url+"/api/search/facets"
         this.updatingFacets = true
         axios.post(tgtURL, req).then((response) => {
            let facets = response.data.facet_list
            if (!facets) {
               facets = []
            }
            this.setPoolFacets({pool: pool.id, facets: facets})
            this.updatingFacets = false
         }).catch((error) => {
            if (error.response && error.response.status == 501) {
               this.setPoolFacets({pool: pool.id, facets: false})
            }
            this.updatingFacets = false
          })
      }
   }
})
