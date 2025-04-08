import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useSortStore } from "@/stores/sort"
import { usePoolStore } from "@/stores/pool"

export function useRouteUtils( router,route ) {

   // Map query params to the various stores. If a search is needed, the
   // searchCallback will be called with the new search scope
   const queryParamsChanged = ( async (searchCallback) => {
      const queryStore = useQueryStore()
      const resultStore = useResultStore()
      const filters = useFilterStore()
      const sortStore = useSortStore()

      let query = route.query
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
   })

   const searchChanged = ( () => {
      const queryStore = useQueryStore()
      const resultStore = useResultStore()
      const filters = useFilterStore()
      const sortStore = useSortStore()
      const poolStore = usePoolStore()

      let newQ = Object.assign({}, route.query)
      newQ.q = queryStore.string
      if (queryStore.mode == "advanced") {
         if ( resultStore.hasResults == false && filters.preSearchFilterApplied ) {
            filters.promotePreSearchFilters()
            newQ.filter = filters.asQueryParam('presearch')
         }
         sortStore.promotePreSearchSort( poolStore.list )
      }

      queryStore.userSearched = true
      router.push({path: "/search", query: newQ})
   })

   const collectionSearchChanged = ( () => {
      const queryStore = useQueryStore()
      const filters = useFilterStore()

      let newQ = Object.assign({}, route.query)
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
   })

   const scopeChanged = ( () => {
      const queryStore = useQueryStore()
      const resultStore = useResultStore()

      let newQ = Object.assign({}, route.query)
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

   const sortChanged = (() => {
      const sortStore = useSortStore()

      let newQ = Object.assign({}, route.query)
      newQ.sort = sortStore.activeSort
      router.push({path: "/search", query: newQ})
   })

   const poolChanged = (() => {
      const sortStore = useSortStore()
      const filters = useFilterStore()
      const resultStore = useResultStore()
      const queryStore = useQueryStore()

      let newQ = Object.assign({}, route.query)
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
      if ( route.query != newQ ) {
         router.push({path: "/search", query: newQ})
      }
   })

   const filterChanged = (() => {
      const filters = useFilterStore()
      const queryStore = useQueryStore()
      const resultStore = useResultStore()

      let newQ = Object.assign({}, route.query)
      delete newQ.page
      delete newQ.filter
      let fqp = filters.asQueryParam( resultStore.selectedResults.pool.id )
      if (fqp != "{}") {
         newQ.filter = fqp
      }
      queryStore.userSearched = true
      router.push({path: "/search", query: newQ})
   })

   return {
      queryParamsChanged, searchChanged, poolChanged,
      scopeChanged, sortChanged, filterChanged, collectionSearchChanged
   }
}

