import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useSortStore } from "@/stores/sort"
import { usePoolStore } from "@/stores/pool"
import { usePreferencesStore } from "@/stores/preferences"

function isEmpty(obj) {
   for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
         return false;
      }
   }
   return true;
}

export function useRouteUtils( router,route ) {

   // Map query params to the various stores. If a search is needed, the
   // searchCallback will be called with the new search scope
   const queryParamsChanged = ( async (searchCallback) => {
      const queryStore = useQueryStore()
      const resultStore = useResultStore()
      const filters = useFilterStore()
      const sortStore = useSortStore()
      const query = route.query

      // no query params, nothing to do
      if ( isEmpty(query) ) return

      // Flags to control search and facet refresh. They will be updated below. userSearched will always trigger both.
      let runSearch = queryStore.userSearched      // changes in sort, filter and query will run search
      let refreshFacets = queryStore.userSearched  // changes in filter and query will refresh facets

      if (query.mode == 'advanced') {
         queryStore.setAdvancedSearch()
      } else {
         queryStore.setBasicSearch()
      }

      // be sure to set target pool first as the query parsing depends on it being set
      queryStore.setTargetPool( query.pool )

      // use the poolQuersyString here to ensure any pool-specific addons are included
      const oldQ = queryStore.poolQueryString  
      if (query.q) {
         queryStore.restoreFromURL(query.q)
         if ( oldQ != query.q) {
            runSearch = true
            refreshFacets = true
         }
      }

      if (query.pool) {
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

      // Use the filter mode from the query params to determine filter behavior
      // If this code is the result of the user interacting with the UI (as opposed 
      // to clicking a link), the query param will match the preference
      let queryFilterMode = query.filtermode
      if ( !queryFilterMode ) {
         // Older searches will not have the filtermode param. They always 
         // used OR as the facet join mode
         queryFilterMode = "OR"   
      }

      // only re-run search when query, sort or filtering has changed - or a user has initiated a search with a UI element
      if ( runSearch == true ) {
         queryStore.userSearched = false
         queryStore.filtersCleared = false
 
         await searchCallback( queryFilterMode )

         if (query.sort === undefined || query.pool === undefined) {
            // Ensure pool and sort are always part of the URL. This will re-trigger queryParamsChanged.
            let newQ = Object.assign({}, query)
            newQ.pool = resultStore.selectedResults.pool.id
            sortStore.setActivePool(resultStore.selectedResults.pool.id)
            newQ.sort = sortStore.activeSort
            router.replace({path: "/search", query: newQ})
         } else {
            // only request facets if the URL isn't replaced above since the URL replacement
            // will trigger another pass thru queryParamsChanged and the facets will be requesed below
            // Send the filtermode query param. It will override preferences
            filters.getSelectedResultFacets(refreshFacets, queryFilterMode)
         }
      } else {
         // just a pool change, don't force a reload - but facets will reload if marked dirty, or none have previously been loaded
         // Send the filtermode query param. It will override preferences
         filters.getSelectedResultFacets(false, queryFilterMode)
         resultStore.ignoreExclusion = "" // reset any temporary overrides to avoid unexpected behavior
      }
   })

   // when the user clicks the search or advanced search button, this is an entirely
   // new search and the newSearch flag will be set - unless it has been
   // requested to preserve prior filters
   const searchChanged = ( ( newSearch = false ) => {
      const queryStore = useQueryStore()
      const resultStore = useResultStore()
      const filters = useFilterStore()
      const sortStore = useSortStore()
      const poolStore = usePoolStore()

      let newQ = Object.assign({}, route.query)

      console.log(`SEARCH CHANGED; POOL ${queryStore.targetPool} NEW ${newSearch} PRESERVE ${queryStore.keepSettings}`)

      if ( newSearch &&  queryStore.keepSettings == false ) {
         console.log("RESET FILTERS / SORT FOR NEW QUERRY")
         delete newQ.filter
         queryStore.resetAllDateFilters()
         if (queryStore.mode == "advanced") {
            newQ.mode = "advanced"                             // ensure mode is in the query params
            newQ.filter = filters.asQueryParam('presearch')    // set the filters in the query params
            sortStore.promotePreSearchSort( poolStore.list )   // promote presearch filter to all pools that support it 
            filters.promotePreSearchFilters()
         } else {
            filters.reset()  
         }
      } else {
         console.log("PRESERVE SETTINGS")
         if ( queryStore.filtersCleared ) {
            // NOTES: see notes in AppliedFilters.vie for why this is here
            queryStore.filtersCleared = false
            delete newQ.page
            delete newQ.filter
         }
         if (queryStore.mode == "advanced") {
            newQ.mode = "advanced"                             // ensure mode is in the query params
            sortStore.promotePreSearchSort( poolStore.list )   // set the filters in the query params

            // if this is a new search with presearch filters picked, add them to query params
            if ( resultStore.hasResults == false && filters.preSearchFilterApplied ) {
               newQ.filter = filters.asQueryParam('presearch')
               filters.promotePreSearchFilters()
            }
         }
      }

      // use the poolQuersyString here to ensure any pool-specific addons are included
      newQ.q = queryStore.poolQueryString 

      filters.setDirty()
      queryStore.userSearched = true
      router.push({path: "/search", query: newQ})
   })

   const collectionSearchChanged = ( () => {
      const queryStore = useQueryStore()
      const filters = useFilterStore()

      let newQ = Object.assign({}, route.query)
      delete newQ.page

      queryStore.setBasicSearch()
      // use the poolQuersyString here to ensure any pool-specific addons are included
      newQ.q = queryStore.poolQueryString
      newQ.filter = filters.asQueryParam( "presearch" )
      newQ.pool = queryStore.targetPool

      router.push({path: "/search", query: newQ })
   })

   const sortChanged = (() => {
      const sortStore = useSortStore()
      const queryStore = useQueryStore()

      let newQ = Object.assign({}, route.query)
      newQ.sort = sortStore.activeSort
      queryStore.userSearched = true
      router.push({path: "/search", query: newQ})
   })

   const poolChanged = (() => {
      const sortStore = useSortStore()
      const filters = useFilterStore()
      const resultStore = useResultStore()
      const queryStore = useQueryStore()
      const prefs = usePreferencesStore()

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
            newQ.filtermode = prefs.facetMode
         }
         if (sortStore.activeSort.length > 0) {
            newQ.sort = sortStore.activeSort
         }
         if (resultStore.selectedResults.page > 0) {
            newQ.page = resultStore.selectedResults.page +1
         }
         newQ.q = queryStore.poolQueryString
      }
      if ( route.query != newQ ) {
         router.push({path: "/search", query: newQ})
      }
   })

   const filterChanged = (() => {
      const filters = useFilterStore()
      const queryStore = useQueryStore()
      const resultStore = useResultStore()
      const prefs = usePreferencesStore()

      let newQ = Object.assign({}, route.query)
      delete newQ.page
      delete newQ.filter
      let fqp = filters.asQueryParam( resultStore.selectedResults.pool.id )
      if (fqp != "{}") {
         newQ.filter = fqp
         newQ.filtermode = prefs.facetMode
      }
      queryStore.userSearched = true
      router.push({path: "/search", query: newQ})
   })

   return {
      queryParamsChanged, searchChanged, poolChanged,
      sortChanged, filterChanged, collectionSearchChanged
   }
}
