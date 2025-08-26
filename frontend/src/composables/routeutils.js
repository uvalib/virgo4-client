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
      const query = route.query

      // Flags to control search and facet refresh. They will be updated below. userSearched will always trigger both.
      let runSearch = queryStore.userSearched      // changes in sort, filter and query will run search
      let refreshFacets = queryStore.userSearched  // changes in filter and query will refresh facets

      if (query.mode == 'advanced') {
         queryStore.setAdvancedSearch()
      } else {
         queryStore.setBasicSearch()
      }

      const oldQ = queryStore.string
      if (query.q) {
         queryStore.restoreFromURL(query.q)
         if ( oldQ != query.q) {
            runSearch = true
            refreshFacets = true
         }
      }

      if (query.pool) {
         queryStore.setTargetPool( query.pool )

         const oldSortObj = sortStore.poolSort( query.pool )
         const oldSort = `${oldSortObj.sort_id}_${oldSortObj.order}`
         if (query.sort) {
            sortStore.setPoolSort( query.pool , query.sort)
            sortStore.setActivePool( query.pool )
         }
         if (oldSort != query.sort) {
            runSearch = true
         }

         const oldFilterParam = filters.asQueryParam( query.pool )
         if (query.filter) {
            filters.restoreFromURL(query.filter,  query.pool )
         }
         if (oldFilterParam != filters.asQueryParam( query.pool )) {
            runSearch = true
            refreshFacets = true
         }
      } else {
          if (query.filter) {
            // if filters are specified but no pool, apply the filter to all pools
            filters.setAllFromURL(query.filter)
            runSearch = true
            refreshFacets = true
          }
      }

      // only re-run search when query, sort or filtering has changed - or a user has initiated a search with a UI element
      if ( runSearch == true ) {
         resultStore.resetSearchResults()
         queryStore.userSearched = false

         await searchCallback(queryStore.searchSources)

         if (query.sort === undefined || query.pool === undefined) {
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
      const filters = useFilterStore()
      const sortStore = useSortStore()

      // If a single pool was the prior scope, results would be length 1.
      // Any more than that means scope was everything
      const wasEverythingSearched = (resultStore.results.length > 1)

      // NOTES: The scope radio buttons directly update queryStore.searchSources. This means that
      // in the logic below, queryStore will have the newly selected scope and newQ/route.query will have the original
      let newQ = Object.assign({}, route.query)
      delete newQ.page
      delete newQ.filter
      delete newQ.sort
      delete newQ.pool

      // If the previous scope was everything, the only way this logic can be called is if
      // a single pool was selected for the scope
      if ( wasEverythingSearched ) {
         // scope narrowed to a single pool; drop all other results. No need to trigger a new search with userSearched=true
         console.log("NARROW SCOPE ALL TO "+queryStore.searchSources)
         resultStore.dropOtherResults(queryStore.searchSources)
      } else {
         // Two causes to be here:
         //    1. single pool scope changed to a different pool
         //    2. single pool scope widened to everything
         // In either case, any previous results have been lost and a re-search needs to be triggerred
         console.log(`SCOPE CHANGED FROM: ${route.query.pool} TO ${queryStore.searchSources}`)
         queryStore.userSearched = true
      }

      if ( queryStore.searchSources != "all") {
         newQ.pool = queryStore.searchSources

         // restore any previously defined sort and filter for the new scope
         const selectedSortObj = sortStore.poolSort( queryStore.searchSources )
         newQ.sort = `${selectedSortObj.sort_id}_${selectedSortObj.order}`
         const selectedFilter = filters.asQueryParam( queryStore.searchSources )
         if (selectedFilter != '{}') {
            newQ.filter = selectedFilter
         }
      }

      router.push({path: "/search", query: newQ })
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
