import { defineStore } from 'pinia'
import axios from 'axios'
import analytics from '../analytics'
import * as utils from '../utils'
import { useSystemStore } from "@/stores/system"
import { usePreferencesStore } from "@/stores/preferences"
import { useSortStore } from "@/stores/sort"
import { useQueryStore } from "@/stores/query"
import { useFilterStore } from "@/stores/filter"
import { useCollectionStore } from "@/stores/collection"
import { usePoolStore } from "@/stores/pool"

export const useResultStore = defineStore('result', {
   state: () => ({
      noSpinner: false,
      searching: false,
      pageSize: 20,
      results: [{ total: 0, hits: [], pool: { description: "", id: "none", name: "None", summary: "", url: "" } }],
      suggestions: [],
      total: -1,
      autoExpandGroupID: "",
      selectedResultsIdx: 0,
      selectedHitIdx: -1,
      selectedHitGroupIdx: -1,
      lastSearchScrollPosition: 0,
      lastSearchURL: "",
   }),

   getters: {
      selectedHit: state => {
         let hit = state.results[state.selectedResultsIdx].hits[state.selectedHitIdx]
         if (hit) {
            if (hit.grouped && state.selectedHitGroupIdx > -1 ) {
               return hit.group[state.selectedHitGroupIdx]
            }
         }
         return hit
      },
      nextHitAvailable(state) {
         return state.selectedHitIdx > -1 && this.selectedHit.number < this.selectedResults.total
      },
      prevHitAvailable(state) {
         return state.selectedHitIdx > -1 && this.selectedHit.number > 1
      },
      hasResults: state => {
         return state.searching == false && state.total >= 0
      },
      selectedResults: state => {
         return state.results[state.selectedResultsIdx]
      },
      hasMoreHits: state => {
         let tgtResults = state.results[state.selectedResultsIdx]
         let resultsCnt = 0
         tgtResults.hits.forEach( r => {
            if (r.grouped) {
               resultsCnt += r.count
            } else {
               resultsCnt++
            }
         })
         return tgtResults.total > resultsCnt
      },
   },

   actions: {
      hitSelected(identifier) {
         this.selectedHitIdx = -1
         this.selectedHitGroupIdx = -1

         this.results[this.selectedResultsIdx].hits.some( (h,idx) => {
            if (h.identifier == identifier) {
               this.selectedHitIdx = idx
            } else if ( h.grouped == true) {
               let gIdx = h.group.findIndex( g => g.identifier == identifier)
               if ( gIdx > -1 ) {
                  this.selectedHitIdx = idx
                  this.selectedHitGroupIdx = gIdx
               }
            }
            return this.selectedHitIdx != -1
          })
          if ( this.selectedHitIdx != -1 ) {
             // this also gets called on from details page. Only update last if route is home or search
            if (this.router.currentRoute.value.path == "/search" ||  this.router.currentRoute.value.path == "/") {
               this.lastSearchURL = this.router.currentRoute.value.fullPath
               this.lastSearchScrollPosition = window.scrollY
            }
          }
      },
      priorHit() {
         if ( this.selectedHitIdx == -1) return
         let currHit = this.results[this.selectedResultsIdx].hits[this.selectedHitIdx]

         // are we currently on a grouped result and not on the head?
         if ( currHit.grouped && this.selectedHitGroupIdx >= 0) {
            // just go to prior item in the group
            this.selectedHitGroupIdx--
         } else {
            // paging back to a new hit; must check if it is grouped and select
            // the last member of the group if so
            this.selectedHitGroupIdx = -1
            this.selectedHitIdx--
            currHit = this.results[this.selectedResultsIdx].hits[this.selectedHitIdx]
            if ( currHit.grouped ) {
               this.selectedHitGroupIdx = currHit.group.length-1
            }
         }
      },
      setSearching(flag) {
         if (this.noSpinner) {
            this.noSpinner = false
         } else {
            this.searching = flag
         }
      },

      clearSelectedPoolResults() {
         // When the results are cleared, reset pagination, remove pool
         // total from overal total and reset pool total to 0
         let tgtPool = this.results[this.selectedResultsIdx]
         let oldPoolTotal = tgtPool.total
         tgtPool.total = 0
         tgtPool.page = 0
         this.results[this.selectedResultsIdx].hits = []
         this.total -= oldPoolTotal
         this.lastSearchScrollPosition = 0
         this.lastSearchURL = ""
      },

      addPoolSearchResults(poolResults) {
         let tgtPool = this.results[this.selectedResultsIdx]
         if ( !tgtPool) {
            let result = {
               pool: poolResults.pool,
               sort: poolResults.sort,
               total: poolResults.pagination.total,
               page: 0,
               timeMS: poolResults.elapsed_ms,
               hits: [],
               statusCode: poolResults.status_code, statusMessage: poolResults.status_msg
            }
            this.results.push(result)
            this.selectedResultsIdx = 0
            this.total = poolResults.pagination.total
            tgtPool = this.results[0]
         } else {
            // Update total
            tgtPool.total = poolResults.pagination.total
            // Only update overall total when paging if searching 1 pool.
            if(this.results.length == 1){
               this.total = poolResults.pagination.total
            }
         }
         let lastHit = tgtPool.hits[tgtPool.hits.length-1]

         // When a facet is applied, the results are cleared and there is no last hit
         let hitNumber = 1
         if (lastHit) {
            hitNumber = lastHit.number+1
            if (lastHit.grouped) {
               hitNumber = lastHit.group[lastHit.group.length-1].number+1
            }
         }

         tgtPool.timeMS = poolResults.elapsed_ms
         tgtPool.statusCode = 200
         tgtPool.statusMessage = ""
         if (tgtPool.total == 0) {
            // if pool total is zero add the new results total to overall
            tgtPool.total = poolResults.pagination.total
            this.total += poolResults.pagination.total
         }

         if (poolResults.group_list) {
            poolResults.group_list.forEach(group => {
               utils.preProcessHitFields(tgtPool.pool.url, group.record_list)
               if (group.count == 1) {
                  let hit = group.record_list[0]
                  hit.grouped = false
                  hit.count = 1
                  hit.number = hitNumber
                  tgtPool.hits.push(hit)
                  hitNumber++
               } else {
                  let hit = { grouped: true, count: group.count, number: hitNumber, group: group.record_list }
                  utils.getGroupHitMetadata(group, hit)
                  tgtPool.hits.push(hit)
                  hitNumber+=group.count
               }
            })
         }
      },

      setSearchResults(data, tgtPool) {
         // this is called from top level search; resets results from all pools
         const pools = usePoolStore()
         this.total = -1
         this.results = []
         let firstPoolWithHits = -1
         let tgtPoolIdx = -1

         data.pool_results.forEach((pr, idx) => {
            if (!pr.group_list) {
               pr.group_list = []
            }

            // reset hit counter for each pool
            let hitNum = 1

            // if a preffered pool was set in prefs (or url) track its index in results
            // so it can be selected after all results are updated
            if (pr.pool_id == tgtPool) {
               tgtPoolIdx = idx
            }

            // Find the pool the results are associated with and populate some top level response info
            let pool = data.pools.find(p => p.id == pr.pool_id)
            let result = {
               pool: pool, sort: pr.sort, total: pr.pagination.total, page: 0, timeMS: pr.elapsed_ms,
               hits: [], statusCode: pr.status_code, statusMessage: pr.status_msg
            }
            if (
              (firstPoolWithHits == -1 && pr.pagination.total > 0) ||
              (pool.id == "uva_library" && pr.status_code == 408)
            ) {
              firstPoolWithHits = idx
            }

            // Next, drill into group_list data. It contains a count and a record_list
            // record list is a list of fields in the hit. field is {name,label,type,value,visibility,display}
            pr.group_list.forEach(group => {

               let poolObj = pools.list.find( p => p.id == pr.pool_id)

               // for each hit in the list, merge repeated fields into arrays, pull out
               // key fields like identifer to top-level named field and split others into basic and detail
               if (group.record_list) {
                  utils.preProcessHitFields(poolObj.url, group.record_list)
               }

               // Different handling for grouped and single items
               if (group.count == 1) {
                  let hit = group.record_list[0]
                  hit.grouped = false
                  hit.count = 1
                  hit.number = hitNum
                  result.hits.push(hit)
                  hitNum++
               } else {
                  let hit = { grouped: true, count: group.count, number: hitNum }
                  utils.getGroupHitMetadata(group, hit)
                  result.hits.push(hit)
                  hitNum += group.count
               }
            })

            this.results.push(result)
         })

         if (tgtPoolIdx > -1) {
            this.selectedResultsIdx = tgtPoolIdx
         } else {
            if (firstPoolWithHits == -1) {
               firstPoolWithHits = 0
            }
            this.selectedResultsIdx = firstPoolWithHits
         }

         this.total = data.total_hits
      },

      setSuggestions(data) {
         this.suggestions = []
         data.forEach(d => {
            this.suggestions.push(d)
         })
      },

      setPage(pageOveride) {
         this.noSpinner = true
         this.results[this.selectedResultsIdx].page = pageOveride
      },

      resetSearchResults() {
         this.suggestions = []
         this.results = [{ total: 0, hits: [], pool: { description: "", id: "none", name: "None", summary: "", url: "" } }]
         this.total = -1
         this.lastSearchScrollPosition = 0
         this.lastSearchURL = ""
         this.selectedHitIdx = -1
         this.selectedHitGroupIdx = -1
         this.selectedResultsIdx = 0
      },

      resetSearch() {
         const query = useQueryStore()
         const prefs = usePreferencesStore()
         this.resetSearchResults()
         query.resetAdvancedForm()
         query.clear()
         useFilterStore().reset()
         useSortStore().reset()
         useCollectionStore().clearCollectionDetails()
         if ( prefs.hasSearchTemplate ) {
            query.setTemplate(prefs.searchTemplate)
         }
      },

      async moreResults() {
         this.noSpinner = true
         this.results[this.selectedResultsIdx].page++
         let sr = this.selectedResults
         let params = {
            pool: sr.pool,
            page: sr.page
         }
         await this.searchPool(params)
      },
      async nextHit() {
         if ( this.selectedHitIdx == -1 ) return

         // is this the last hit in the currently available results?
         let tgtResults = this.selectedResults
         if ( this.selectedHitIdx == tgtResults.hits.length-1 ) {
            if (this.hasMoreHits == false) {
               let currHit= this.selectedHit
               if (currHit.grouped ) {
                  if (this.selectedHitGroupIdx == currHit.group.length-1 ) {
                     // last grouped hit. done
                     return
                  }
               } else {
                  // last hit. done.
                  return
               }
            } else {
               await this.moreResults()
            }
         }

         let currHit = this.results[this.selectedResultsIdx].hits[this.selectedHitIdx]
         if ( currHit.grouped) {
            if ( this.selectedHitGroupIdx == currHit.group.length-1) {
               this.selectedHitIdx++
               this.selectedHitGroupIdx = -1
            } else {
               this.selectedHitGroupIdx++
            }
         } else {
            this.selectedHitIdx++
         }

      },

      // Search ALL configured pools. This is the initial search call using only the basic or
      // advanced search parameters and will always start at page 1.
      async searchAllPools() {
         const system = useSystemStore()
         const query = useQueryStore()
         const filters = useFilterStore()
         const poolStore = usePoolStore()
         const sorting = useSortStore()

         system.clearMessage()
         let req = {
            query: query.string,
            pagination: { start: 0, rows: this.pageSize },
            filters: filters.allPoolFilters,
            pool_sorting: sorting.pools
         }

         if (req.query == "") {
            let err = {message: 'EMPTY QUERY', caller: 'searchAllPools', query: query.stateObject}
            system.reportError(err)
         }

         this.setSearching(true)
         this.lastSearchScrollPosition = 0
         this.lastSearchURL = ""

         // POST the search query and wait for the response
         await axios.post(`${system.searchAPI}/api/search`, req).then((response) => {
            poolStore.setPools(response.data.pools)
            this.setSearchResults( response.data, query.targetPool )
            sorting.setActivePool( this.results[this.selectedResultsIdx].pool.id )
            this.setSuggestions(response.data.suggestions)
            this.setSearching(false)
            if ( response.data.total_hits == 0) {
               analytics.trigger('Results', 'NO_RESULTS', this.router.currentRoute.value.fullPath)
            }
         }).catch((error) => {
            console.error("SEARCH FAILED: " + error)
            this.setSearching(false)
            if (error.response && error.response.status != 401) {
               if (error.response && error.response.data && error.response.data.message) {
                  let msg =  error.response.data.message
                  msg += "<p>We regret the inconvenience. If this problem persists, "
                  msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a></p>"
                  let err = {
                     message: msg,
                     detail: error.response.data.details
                  }
                  system.setSearchError(err)
               } else {
                  let msg = "System error, we regret the inconvenience. If this problem persists, "
                  msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a>"
                  system.setError(msg)
               }
            }
         })
      },

      // searchPool wil search only the pool specified. It can be used to filter, sort and page
      // existing results or as a standalone query to a single pool
      async searchPool(params) {
         const system = useSystemStore()
         const query = useQueryStore()
         const filterStore = useFilterStore()
         const poolStore = usePoolStore()
         const sortStore = useSortStore()

         this.setSearching(true)
         let filters = filterStore.poolFilter(params.pool.id)
         let sort = sortStore.poolSort(params.pool.id)
         let filterObj = { pool_id: params.pool.id, facets: filters }
         let startPage = params.page
         if (!startPage) {
            startPage = 0
         }
         let pagination = { start: startPage * this.pageSize, rows: this.pageSize }

         let req = {
            query: query.string,
            pagination: pagination,
            sort: sort,
            filters: [filterObj]
         }

         if (req.query == "") {
            let err = {message: 'EMPTY QUERY', caller: 'searchSelectedPool', query: query.stateObject}
            system.reportError(err)
         }

         let url = params.pool.url + "/api/search"
         await axios.post(url, req).then( response => {
            if ( startPage == 0 ) {
               // when single pool seach is called to start a search, pool is required in response. Reset the results
               // to an empty array so the default empty result is not present in the results
               let pool = poolStore.list.find( p => p.id == params.pool.id)
               response.data.pool = pool
               this.total = -1
               this.results = []
            }

            // Note: for pagination, filtering, etc, the existing pool results will be appended.
            // if this is a direct single pool search, there will be no existing results. This call
            // will create them.
            this.addPoolSearchResults(response.data)
            if ( response.data.pagination.total == 0 ) {
               analytics.trigger('Results', 'NO_RESULTS', this.router.currentRoute.value.fullPath)
            }

            this.setSearching(false)
         }).catch((error) => {
            console.error("SINGLE POOL SEARCH FAILED: " + JSON.stringify(error))
            this.setSearching(false)
            if (error.response && error.response.status == 400) {
               let msg = "This query is malformed or unsupported. Please ensure that all quotes and parenthesis are matched."
               msg += "<p>We regret the inconvenience. If this problem persists, "
               msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a></p>"
               let err = {
                  message: msg,
               }
               system.setSearchError(err)
            } else if (error.response && error.response.data && error.response.data.message) {
               let err = {
                  message: error.response.data.message,
               }
               system.setSearchError(err)

            } else if (error.response && error.response.status != 401) {
               let msg = "System error, we regret the inconvenience. If this problem persists, "
               msg += "<a href='https://v4.lib.virginia.edu/feedback' target='_blank'>please contact us.</a>"
               system.setError(msg)
            }
         })
      },

      dropOtherResults( keepPoolID ) {
         this.searching = true
         this.results = this.results.filter( r => r.pool.id == keepPoolID)
         this.selectPoolResults(0)
         this.searching = false
      },

      // Select pool results and get all facet info for the result
      selectPoolResults(resultIdx) {
         if (this.selectedResultsIdx != resultIdx) {
            this.selectedResultsIdx = resultIdx
            const sortStore = useSortStore()
            sortStore.setActivePool(this.results[this.selectedResultsIdx].pool.id)
         }
      },
   },
})
