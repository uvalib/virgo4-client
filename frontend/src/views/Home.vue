<template>
   <div class="home">
      <V4Spinner  v-if="resultStore.searching" message="Searching..." v-bind:overlay="true" v-bind:dots="false"/>
      <div class="search-panel pure-form">
         <template v-if="basicSearch">
            <div v-if="systemStore.hasTranslateMessage" class="translate-message">
               {{systemStore.translateMessage}}
            </div>
            <label class="screen-reader-text" for="search">Search Virgo for books, articles, and more.</label>
            <label class="screen-reader-text" for="source-select">Search in</label>
            <div class="basic-search">
               <input class="basic"
                  @keyup.enter="searchClicked"
                  v-model="queryStore.basic"
                  autocomplete="off"
                  type="text"
                  id="search"
                  placeholder="Search Virgo for books, articles, and more"
               >
               <V4Button @click="searchClicked" class="search" mode="primary">Search</V4Button>
            </div>
            <div class="controls-wrapper">
               <SourceSelector mode="basic"/>
            </div>
            <div class="search-mode">
               <router-link tabindex="0" to="/search?mode=advanced">Advanced Search</router-link>
            </div>
            <div class="search-mode">
               <V4BarcodeScanner @scanned="barcodeScanned"/>
            </div>
         </template>
         <AdvancedSearch v-else/>
      </div>
      <Welcome  v-if="isHomePage && resultStore.hasResults==false" />
      <SearchResults v-if="resultStore.hasResults" />
   </div>
</template>

<script setup>
import SearchResults from "@/components/SearchResults.vue"
import AdvancedSearch from "@/components/advanced/AdvancedSearch.vue"
import Welcome from "@/components/Welcome.vue"
import V4BarcodeScanner from "@/components/V4BarcodeScanner.vue"
import SourceSelector from "@/components/SourceSelector.vue"
import { useAnnouncer } from '@vue-a11y/announcer'
import * as utils from '../utils'
import analytics from '@/analytics'
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useRestoreStore } from "@/stores/restore"
import { useSystemStore } from "@/stores/system"
import { useSearchStore } from "@/stores/search"
import { useUserStore } from "@/stores/user"
import { usePoolStore } from "@/stores/pool"
import { useSortStore } from "@/stores/sort"
import { useFilterStore } from "@/stores/filter"


const router = useRouter()
const route = useRoute()
const queryStore = useQueryStore()
const resultStore = useResultStore()
const restore = useRestoreStore()
const systemStore = useSystemStore()
const searchStore = useSearchStore()
const userStore = useUserStore()
const poolStore = usePoolStore()
const sortStore = useSortStore()
const filters = useFilterStore()
const { polite, assertive } = useAnnouncer()

const queryMessage = ref("")

const basicSearch = computed(()=>{
   return queryStore.searchMode != "advanced"
})
const isHomePage = computed(()=>{
   return (route.path == "/")
})

resultStore.$subscribe((mutation) => {
   if (mutation.events.key == "searching" && mutation.events.newValue === false)  {
      if (restore.url == "/") {
         nextTick( () => {
            let r = document.getElementById("results-container")
            if (r) {
               // sometimes results may not be availble - maybe auth session problems for one
               r.focus({preventScroll:true})
               utils.scrollToItem(r)
            }
         })
      }
      if ( queryMessage.value != "") {
         systemStore.setMessage(queryMessage.value)
         queryMessage.value = ""
      }
   }
})

onBeforeRouteUpdate((to) => {
   console.log("NEW HOME ROUTE "+ to.fullPath)
   if ( queryStore.userSearched) {
      searchStore.updateHistory(to.fullPath)
   }
   this.restoreSearchFromQueryParams(to.query)
   systemStore.pageTitle = "Search"
   if (queryStore.searchMode != "basic") {
      systemStore.pageTitle = "Advanced Search"
   }
})

onMounted( async () =>{
   // When restoring a saved search, the call will be /search/:token
   let token = route.params.id
   if ( token ) {
      // Load the search from the token and restore it
      await queryStore.loadSearch(token)
   }
   handleLegacyQueries( route.query )

   if ( queryStore.searchMode == "basic") {
      polite(`virgo search has loaded`)
   }
})

function handleLegacyQueries( query ) {
   let unsupported = []
   var changed = false
   let newQ = Object.assign({}, query )

   // Scope and exclude are not used, but preserve the target pool
   if (newQ.exclude) {
      unsupported.push("exclude="+newQ.exclude)
      delete newQ.exclude
      changed = true
   }
   if (newQ.scope ) {
      if (newQ.scope != "all") {
         unsupported.push("scope="+newQ.scope)
      }
      changed = true
      delete newQ.scope
   }
   if ( newQ.mode == "basic") {
      delete newQ.mode
      changed = true
   }
   if (newQ.filter && newQ.filter.indexOf("Facet") > -1) {
      unsupported.push("filter="+newQ.filter)
      delete newQ.filter
      changed = true
   }
   if (newQ.pool && !poolStore.poolDetails(newQ.pool)) {
      unsupported.push("pool="+newQ.pool)
      delete newQ.pool
      changed = true
   }

   let queryStr = newQ.q
   if ( queryStr) {
      let idx0 = queryStr.indexOf(" AND filter:")
      if ( idx0 > -1) {
         unsupported.push("q="+newQ.q)
         newQ.q = queryStr.substring(0,idx0).trim()
         changed = true
      } else {
         idx0 = queryStr.indexOf("filter:")
         if ( idx0 > -1) {
            unsupported.push("q="+newQ.q)
            queryStr = queryStr.replace(/filter:.*AND\s/g, '')
            queryStr = queryStr.replace(/filter:.*}/g, '')
            newQ.q = queryStr
            changed = true
         }
      }
   }

   if ( newQ.q == "" && !newQ.filter) {
      let msg = "<p>This query has no supported parameters, and cannot be issued. Please fix the issues below and retry.</p>"
      msg += `<p><b>Unsupported parameters:</b></p><div style="margin-left: 15px">${unsupported.join("<br/>")}</div>`
      systemStore.setMessage(msg)
      router.push("/")
      return
   }

   queryStore.searchSources = "all"
   if (newQ.pool == "images") {
      queryStore.searchSources = "images"
   } else if (newQ.pool == "articles") {
      queryStore.searchSources = "articles"
   } else if (newQ.pool == "uva_library") {
      queryStore.searchSources = "uva_library"
   }

   if ( changed) {
      if ( unsupported.length > 0) {
         queryMessage.value = "<p>This query contained unsupported parameters. It was automatically simplified to provide results.</p>"
         queryMessage.value += `<p><b>Unsupported parameters:</b></p><div style="margin-left: 15px">${unsupported.join("<br/>")}</div>`
      }
      router.push({query: newQ, replace: true})
   } else {
      restoreSearchFromQueryParams(route.query)
   }
}

async function restoreSearchFromQueryParams( query ) {
   if  (!query.q) {
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

   if ( query.pool ) {
      poolChanged = (query.pool != this.currentPool)
      targetPool = query.pool
      queryStore.setTargetPool(targetPool)

      // get sort from URL (but preserve current sort)...
      let oldSortObj = sortStore.poolSort(targetPool)
      oldSort = `${oldSortObj.sort_id}_${oldSortObj.order}`
      if (query.sort  ) {
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
      filters.restoreFromURL(query.filter, targetPool )
   } else {
      filters.resetPoolFilters(targetPool)
   }

   if ( query.q ) {
      queryStore.restoreFromURL(query.q)
   }

   // If there is a query or filter in params it may be necessary to run a search
   if ( query.q || query.filter) {
      // console.log(`Q: ${queryStore.string} vs ${oldQ}`)
      // console.log(`F: ${filters.asQueryParam(targetPool)} vs ${oldFilterParam}`)
      // console.log(`S: ${sortStore.activeSort} vs ${oldSort}`)
      // console.log(`U: ${queryStore.userSearched}`)

      // only re-run search when query, sort or filtering has changed
      if ( queryStore.string != oldQ || filters.asQueryParam(targetPool) != oldFilterParam ||
            sortStore.activeSort != oldSort || queryStore.userSearched == true ) {
         resultStore.resetSearchResults()
         let changed = queryStore.string != oldQ || filters.asQueryParam(targetPool) != oldFilterParam || queryStore.userSearched == true

         if ( queryStore.userSearched ) {
            queryStore.userSearched = false
         }

         assertive(`search in progress`)
         if (queryStore.searchSources == "all") {
            await resultStore.searchAllPools()
         } else {
            let p = poolStore.poolDetails(queryStore.searchSources)
            await resultStore.searchPool({pool: p})
         }
         filters.getSelectedResultFacets(changed)
      } else {
         if (poolChanged) {
            filters.getSelectedResultFacets(false)
         }
      }

      // make sure the currently selected pool is always in URL
      if (resultStore.selectedResults.pool.id != "none" && query.pool != resultStore.selectedResults.pool.id) {
         let newQ = Object.assign({}, query)
         newQ.pool = resultStore.selectedResults.pool.id
         await router.replace({query: newQ})
      }

      // make sure the currently selected pool SORT is always in URL. This should only happen the first time a search is made
      if ( oldSort != "" && query.sort === undefined ) {
         let newQ = Object.assign({}, query)
         newQ.sort = oldSort
         await router.replace({query: newQ})
      }

      if ( resultStore.lastSearchScrollPosition > 0 && (route.path == "/" || route.path == "/search")) {
         window.scrollTo({
            top: resultStore.lastSearchScrollPosition,
            behavior: "auto"
         })
      }

      let bmTarget = restore.bookmarkTarget
      if (bmTarget.id != "") {
         showAddBookmark(bmTarget)
         restore.clear()
      } else if ( restore.restoreSaveSearch ) {
         let saveBtn = document.getElementById("save-modal-open")
         if (saveBtn) {
            saveBtn.focus()
            saveBtn.click()
         }
      }
   }
}

function showAddBookmark( bmRestore ) {
   let identifier = bmRestore.id
   let bmData = {pool: resultStore.selectedResults.pool.id, data: null}
   if ( bmRestore.parent && bmRestore.parent != "") {
      // find the item in the group that was targeted for a bookmark
      let parent = resultStore.selectedResults.hits.find( r=> r.identifier == bmRestore.parent)
      bmData.data = parent.group.find( r=> r.identifier == identifier)

      // The group accordion watches this value. When set, the accordion will auto-expand
      resultStore.setAutoExpandGroupID(bmRestore.parent)

      // once the group is expanded, scroll to the target group item
      setTimeout( ()=>{
         let sel = `.group-hit[data-identifier="${identifier}"]`
         let tgtEle = document.body.querySelector(sel)
         if ( tgtEle ) {
            utils.scrollToItem(tgtEle)
         }
      }, 250)

   } else {
         let sel = `.hit[data-identifier="${identifier}"]`
         let tgtEle = document.body.querySelector(sel)
         if ( tgtEle) {
            this.$utils.scrollToItem(tgtEle)
            bmData.data = resultStore.selectedResults.hits.find( r=> r.identifier == identifier)
         }
   }
   let bmEle = document.getElementById(`bm-modal-${identifier}-btn`)
   if (bmEle) {
      bmEle.focus()
      bmEle.click()
   }
}

async function searchClicked() {
   if ( userStore.isSignedIn ) {
      analytics.trigger('Search', 'BASIC_SEARCH', "SIGNED_IN")
   } else {
      analytics.trigger('Search', 'BASIC_SEARCH', "SIGNED_OUT")
   }
   let newQ = Object.assign({}, route.query)
   newQ.q = queryStore.string
   queryStore.userSearched = true
   await router.replace({query: newQ})
}

function barcodeScanned( barcode ) {
   queryStore.basic = barcode
   searchClicked()
}
</script>

<style lang="scss" scoped>
.home {
   min-height: 400px;
   position: relative;
   h2 {
      margin-top:30px;
      color: #444;
   }
   .search-panel {
      margin: 0 auto 0 auto;
      text-align: center;
      padding: 10px 2vw 10px 2vw;
      font-size: 0.95em;
   }
   .basic-search {
      display: flex;
      flex-flow: row nowrap;
      align-items: stretch;
      justify-content: flex-start;
      max-width: 800px;
      margin: 0 auto 0 auto;

      input[type=text].basic {
         font-size: 1.15em;
         padding: 0.5vw 0.75vw;
         border: 1px solid var(--uvalib-grey);
         border-right: 0;
         margin: 0 !important;
         border-radius: 5px 0 0 5px;
         flex: 1 1 auto;
         min-width: 100px;
      }
      .search {
         border-radius: 0 5px 5px 0;
         margin: 0;
         padding: 0 40px;
      }
   }
   div.advanced {
      margin-top: 10px;
      font-size: 1em;
      text-align: right;
   }
   div.translate-message {
      margin: 5px 0 15px 0;
      font-size: 0.85em;
   }
   span.sep {
      margin: 0 5px;
   }
   .controls-wrapper  {
      max-width: 800px;
      margin: 0 auto 20px auto;
      .controls {
         padding: 10px 0;
         display: flex;
         flex-flow: row wrap;
         align-items: center;
         justify-content: flex-end;
      }
      .controls  > * {
         flex: 0 1 auto;
      }
   }
   .search-mode {
      text-align: center;
      margin: 10px 0 5px 0;
   }
}

@media only screen and (min-width: 768px) {
  div.searching-box {
    padding: 20px 90px;
  }
}

@media only screen and (max-width: 768px) {
  div.searching-box {
      width: 95%;
      padding: 20px 0;
      margin-top:30%;
  }
  ::-webkit-input-placeholder {
    color:transparent;
  }
  :-moz-placeholder { /* Firefox 18- */
    color:transparent;
  }
  ::-moz-placeholder {  /* Firefox 19+ */
    color:transparent;
  }
  :-ms-input-placeholder {
    color:transparent;
  }
}
</style>
