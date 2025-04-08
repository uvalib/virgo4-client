import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useSortStore } from "@/stores/sort"
import { usePoolStore } from "@/stores/pool"

export const routeutils = {

   // Map query params to the various stores. If a search is needed, the
   // searchCallback will be called with the new search scope
   mapQueryParams: (async (router, query, searchCallback) => {
      const queryStore = useQueryStore()
      const resultStore = useResultStore()
      const filters = useFilterStore()
      const sortStore = useSortStore()

      if (!query.q) {
         // only reset the search when there is NO query present,
         // otherwise the search is re-excuted each time a tab changes
         resultStore.resetSearch()
      }

      // Interrogate query params and convert them to a search in the model (if present)
      let oldQ = queryStore.string
      if (query.mode == 'advanced') {
         queryStore.setAdvancedSearch()
      } else {
         queryStore.setBasicSearch()
      }

      let targetPool = "presearch"
      let oldFilterParam = ""
      let oldSort = ""
      let poolChanged = false

      if (query.pool) {
         poolChanged = (query.pool != queryStore.targetPool)
         targetPool = query.pool
         queryStore.setTargetPool(targetPool)

         // get sort from URL (but preserve current sort)...
         let oldSortObj = sortStore.poolSort(targetPool)
         oldSort = `${oldSortObj.sort_id}_${oldSortObj.order}`
         if (query.sort) {
            sortStore.setPoolSort(targetPool, query.sort)
            sortStore.setActivePool(targetPool)
         } else {
            sortStore.setPoolSort(targetPool, oldSort)
            sortStore.setActivePool(targetPool)
         }
      }

      // get pool filters from URL (but preserve current)...
      oldFilterParam = filters.asQueryParam(targetPool)
      if (query.filter) {
         filters.restoreFromURL(query.filter, targetPool)
      } else {
         filters.resetPoolFilters(targetPool)
      }

      if (query.q) {
         queryStore.restoreFromURL(query.q)
      }

      // If there is a query or filter in params it may be necessary to run a search
      if (query.q || query.filter) {
         // console.log(`Q: ${queryStore.string} vs ${oldQ}`)
         // console.log(`F: ${filters.asQueryParam(targetPool)} vs ${oldFilterParam}`)
         // console.log(`S: ${sortStore.activeSort} vs ${oldSort}`)
         // console.log(`U: ${queryStore.userSearched}`)

         // only re-run search when query, sort or filtering has changed
         if (queryStore.string != oldQ || filters.asQueryParam(targetPool) != oldFilterParam ||
            sortStore.activeSort != oldSort || queryStore.userSearched == true) {
            resultStore.resetSearchResults()

            if (queryStore.userSearched) {
               queryStore.userSearched = false
            }

            await searchCallback(queryStore.searchSources)

            // don't refresh facets if only sorting changed
            let refreshFacets = queryStore.string != oldQ || filters.asQueryParam(targetPool) != oldFilterParam || queryStore.userSearched == true
            filters.getSelectedResultFacets(refreshFacets)

            if (query.sort === undefined || query.pool != resultStore.selectedResults.pool.id) {
               let newQ = Object.assign({}, query)
               newQ.pool = resultStore.selectedResults.pool.id
               newQ.sort = sortStore.activeSort
               router.replace({path: "/search", query: newQ})
            }
         } else {
            if (poolChanged) {
               filters.getSelectedResultFacets(false)
            }
         }
      }
   }),

   setBasicSearchParams: ( (router, query) => {
      const queryStore = useQueryStore()

      let newQ = Object.assign({}, query)
      newQ.q = queryStore.string
      queryStore.userSearched = true
      router.push({path: "/search", query: newQ})
   }),

   setAdvancedSearchParams: ( (router, query) => {
      const queryStore = useQueryStore()
      const resultStore = useResultStore()
      const filters = useFilterStore()
      const sortStore = useSortStore()
      const poolStore = usePoolStore()

      let newQ = Object.assign({}, query)
      newQ.q = queryStore.string
      if ( resultStore.hasResults == false && filters.preSearchFilterApplied ) {
         filters.promotePreSearchFilters()
         newQ.filter = filters.asQueryParam('presearch')
      }
      sortStore.promotePreSearchSort( poolStore.list )
      queryStore.userSearched = true
      router.push({path: "/search", query: newQ})
   }),

   setCollectionSearchParams: ( (router, query ) => {
      const queryStore = useQueryStore()
      const filters = useFilterStore()

      let newQ = Object.assign({}, query)
      delete newQ.page
      delete newQ.filter
      delete newQ.q
      if ( queryStore.queryEntered ) {
         newQ.q = queryStore.string
      }
      newQ.filter = filters.asQueryParam( "presearch" )
      newQ.pool = queryStore.targetPool

      queryStore.userSearched = true
      router.push({path: "/search", query: newQ })
   }),

   setPoolParams: ((router, query) => {
      const sortStore = useSortStore()
      const filters = useFilterStore()
      const resultStore = useResultStore()
      const queryStore = useQueryStore()

      let newQ = Object.assign({}, query)
      delete newQ.pool
      delete newQ.filter
      delete newQ.sort
      delete newQ.page

      if ( queryStore.targetPool != "" ) {
         newQ.pool = queryStore.targetPool
         let fqp = filters.asQueryParam( queryStore.targetPool )
         if (fqp != "{}") {
            newQ.filter = fqp
         }
         if (sortStore.activeSort.length > 0) {
            newQ.sort = sortStore.activeSort
         }
         if (resultStore.selectedResults.page > 0) {
            newQ.page = resultStore.selectedResults.page +1
         }
      }
      if ( query != newQ ) {
         router.push({path: "/search", query: newQ})
      }
   }),

   setFilterParam: ((router,query) => {
      const filters = useFilterStore()
      const queryStore = useQueryStore()
      const resultStore = useResultStore()

      let newQ = Object.assign({}, query)
      delete newQ.page
      delete newQ.filter
      let fqp = filters.asQueryParam( resultStore.selectedResults.pool.id )
      if (fqp != "{}") {
         newQ.filter = fqp
      }
      queryStore.userSearched = true
      router.push({path: "/search", query: newQ})
   }),

   setSortParam: ((router,query) => {
      const sortStore = useSortStore()

      let newQ = Object.assign({}, query)
      newQ.sort = sortStore.activeSort
      router.push({path: "/search", query: newQ})
   }),

   scopeChanged: ( (router, query) => {
      const queryStore = useQueryStore()
      const resultStore = useResultStore()

      let newQ = Object.assign({}, query)
      delete newQ.page
      if (queryStore.searchSources == newQ.pool && queryStore.searchSources != "all") {
         resultStore.dropOtherResults(queryStore.searchSources)
      } else {
         newQ.q = queryStore.string
         delete newQ.pool
         if ( queryStore.searchSources != "all") {
            newQ.pool = queryStore.searchSources
         }
         queryStore.userSearched = true
         router.push({path: "/search", query: newQ })
      }
   })
}