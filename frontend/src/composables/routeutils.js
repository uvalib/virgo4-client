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
      if (query.mode == 'advanced') {
         queryStore.setAdvancedSearch()
      } else {
         queryStore.setBasicSearch()
      }

      let targetPool = "presearch"
      if (query.pool) {
         targetPool = query.pool
         queryStore.setTargetPool(targetPool)
      }

      // get sort from URL (but preserve current sort)...
      let oldSortObj = sortStore.poolSort(targetPool)
      let oldSort = `${oldSortObj.sort_id}_${oldSortObj.order}`
      if (query.sort) {
         sortStore.setPoolSort(targetPool, query.sort)
         sortStore.setActivePool(targetPool)
      } else {
         sortStore.setPoolSort(targetPool, oldSort)
         sortStore.setActivePool(targetPool)
      }

      // get pool filters from URL (but preserve current)...
      let oldFilterParam = filters.asQueryParam(targetPool)
      if (query.filter) {
         filters.restoreFromURL(query.filter, targetPool)
      } else {
         filters.resetPoolFilters(targetPool)
      }

      // get query and preserve current
      let oldQ = queryStore.string
      if (query.q) {
         queryStore.restoreFromURL(query.q)
      }

      // only re-run search when query, sort or filtering has changed - or a user has initiated a search with a UI element
      if ( queryStore.string != oldQ || filters.asQueryParam(targetPool) != oldFilterParam ||
           sortStore.activeSort != oldSort || queryStore.userSearched == true) {
         resultStore.resetSearchResults()
         let refreshFacets = queryStore.string != oldQ || filters.asQueryParam(targetPool) != oldFilterParam || queryStore.userSearched == true
         queryStore.userSearched = false

         await searchCallback(queryStore.searchSources)

         if (query.sort === undefined || query.pool != resultStore.selectedResults.pool.id) {
            // Ensure pool and sort are always part of the URL. This will re-trigger queryParamsChanged.
            let newQ = Object.assign({}, query)
            newQ.pool = resultStore.selectedResults.pool.id
            newQ.sort = sortStore.activeSort
            router.replace({path: "/search", query: newQ})
         } else {
            // only request facets if the URL isn't replaced above since the URL replacement
            // will trigger another pass thru queryParamsChanged and the facets will be requesed below
            filters.getSelectedResultFacets(refreshFacets)
         }
      } else {
         // just a pool change, don't force a reload - but facets will reload if marked dirty, or none have previously been loaded
         filters.getSelectedResultFacets(false)

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

      filters.setDirty()   // new search entered; flag exisiting facets for refresh
      queryStore.userSearched = true
      router.push({path: "/search", query: newQ})
   })

   const collectionSearchChanged = ( () => {
      const queryStore = useQueryStore()
      const filters = useFilterStore()

      let newQ = Object.assign({}, route.query)
      delete newQ.page

      queryStore.setBasicSearch()
      newQ.q = queryStore.string
      newQ.filter = filters.asQueryParam( "presearch" )
      newQ.pool = queryStore.targetPool

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

