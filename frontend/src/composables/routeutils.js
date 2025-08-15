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
      if (!query.q ) {
         // only reset the search when there is NO query present
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

      // get existing sort
      let oldSortObj = sortStore.poolSort(targetPool)
      let oldSort = `${oldSortObj.sort_id}_${oldSortObj.order}`

      // do not process any sort params if a pool was not specified
      if ( targetPool != "presearch" ) {
         if (query.sort) {
            sortStore.setPoolSort(targetPool, query.sort)
            sortStore.setActivePool(targetPool)
         }
      }

      // get pool filters from URL
      let oldFilterParam = filters.asQueryParam(targetPool)
      if (query.filter) {
         // In the collection search link from item details, no pool is specified. Target pool will be presearch.
         // Always allow this to happen so the logic that detects when to run a search is tripped (filters willl be different from original)
         filters.restoreFromURL(query.filter, targetPool)
         if ( !query.pool ) {
            // if filters are specified but no pool, apply the filter to all pools
            filters.setAllFromURL(query.filter)
         }
      } else {
         filters.resetPoolFilters(targetPool)
      }

      // get query and preserve current
      let oldQ = queryStore.string
      if (query.q) {
         queryStore.restoreFromURL(query.q)
      }

      // console.log(`Q: ${queryStore.string} vs ${oldQ}`)
      // console.log(`F: ${filters.asQueryParam(targetPool)} vs ${oldFilterParam}`)
      // console.log(`S: ${sortStore.activeSort} vs ${oldSort}`)
      // console.log(`user search: ${queryStore.userSearched}`)

      // only re-run search when query, sort or filtering has changed - or a user has initiated a search with a UI element, or explicitly resetting
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
            // remove any existing reset parameter from new search
            delete newQ.reset
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

