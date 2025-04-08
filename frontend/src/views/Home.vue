<template>
   <div class="home">
      <V4Spinner  v-if="resultStore.searching" message="Searching..." v-bind:overlay="true" v-bind:dots="false"/>
      <div class="search-panel">
         <template v-if="queryStore.mode=='basic'">
            <label class="screen-reader-text" for="search">Search Virgo for books, articles, and more.</label>
            <div class="basic-search">
               <input class="basic"
                  @keyup.enter="searchClicked"
                  v-model="queryStore.basic"
                  autocomplete="off"
                  type="text"
                  id="search"
                  placeholder="Search Virgo for books, articles, and more"
               >
               <VirgoButton @click="searchClicked" class="search">Search</VirgoButton>
            </div>
            <div class="controls-wrapper">
               <SourceSelector mode="basic"/>
               <SearchTips />
            </div>
            <div class="search-mode">
               <router-link tabindex="0" to="/search?mode=advanced">Advanced Search</router-link>
            </div>
         </template>
         <AdvancedSearch v-else/>
      </div>
      <Welcome  v-if="isHomePage && resultStore.hasResults==false && queryStore.mode=='basic'" />
      <SearchResults v-if="resultStore.hasResults" />
   </div>
</template>

<script setup>
import SearchTips from "@/components/modals/SearchTips.vue"
import SearchResults from "@/components/SearchResults.vue"
import AdvancedSearch from "@/components/advanced/AdvancedSearch.vue"
import Welcome from "@/components/Welcome.vue"
import SourceSelector from "@/components/SourceSelector.vue"
import { useAnnouncer } from '@vue-a11y/announcer'
import { scrollToItem } from '@/utils'
import { routeutils } from '@/routeutils'
import analytics from '@/analytics'
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useRestoreStore } from "@/stores/restore"
import { useSystemStore } from "@/stores/system"
import { useSearchStore } from "@/stores/search"
import { useUserStore } from "@/stores/user"
import { usePoolStore } from "@/stores/pool"
import { useBookmarkStore } from "@/stores/bookmark"
import { watchDeep } from '@vueuse/core'

const router = useRouter()
const route = useRoute()
const queryStore = useQueryStore()
const resultStore = useResultStore()
const restore = useRestoreStore()
const systemStore = useSystemStore()
const searchStore = useSearchStore()
const userStore = useUserStore()
const poolStore = usePoolStore()
const { polite, assertive } = useAnnouncer()

const isHomePage = computed(()=>{
   return (route.path == "/")
})

function setPageTitle() {
   systemStore.pageTitle = "Search"
   if (queryStore.mode != "basic") {
      systemStore.pageTitle = "Advanced Search"
   }
}

watchDeep( route, () => {
   console.log("NEW HOME ROUTE "+ route.fullPath)
   if ( queryStore.userSearched && userStore.isSignedIn) {
      searchStore.updateHistory(userStore.signedInUser, route.fullPath)
   }
   handleQueryParamChange()
   setPageTitle()
})

onMounted( async () =>{
   // When restoring a saved search, the call will be /search/:token
   let token = route.params.id
   if ( token ) {
      // Load the search from the token and restore it
      await queryStore.loadSearch(token)
   }
   if ( route.query.pool ) {
      // if a pool is set on initial page load, narrow the search to just that pool
      queryStore.searchSources = route.query.pool
   }
   handleQueryParamChange()
   setPageTitle()

   if ( queryStore.mode == "basic") {
      polite(`virgo search has loaded`)
   }
})

const handleQueryParamChange = ( async( ) => {
   routeutils.mapQueryParams(router, route.query, async (pool) => {
      assertive(`search in progress`)
      if (pool == "all") {
         await resultStore.searchAllPools()
      } else {
         await resultStore.searchPool({pool: poolStore.poolDetails(pool)})
      }
      if ( restore.pendingBookmark && restore.pendingBookmark.origin == "SEARCH" ) {
         handlePendingBookmark()
         restore.clear()
      } else {
         if ( resultStore.lastSearchScrollPosition > 0 && (route.path == "/" || route.path == "/search")) {
            window.scrollTo({
               top: resultStore.lastSearchScrollPosition,
               behavior: "auto"
            })
         }
      }
   })
})

function handlePendingBookmark() {
   const bookmarks = useBookmarkStore()
   let newBM = restore.pendingBookmark
   let showAdd = ( bookmarks.bookmarkCount( newBM.pool, newBM.hit.identifier ) == 0 )

   let triggerBtn = document.getElementById(`bm-btn-${ newBM.hit.identifier}`)
   if (  newBM.hit.groupParent ) {
      // The group accordion watches this value. When set, the accordion will auto-expand,
      // adding the target item to the DOM
      let parent = resultStore.selectedResults.hits.find( r=> r.identifier == newBM.hit.groupParent)
      resultStore.autoExpandGroupID = `group-${parent.identifier}`
   }
   scrollToItem(newBM.hit.identifier, false)

   if ( showAdd ) {
      bookmarks.showAddBookmark( newBM.pool, newBM.hit, triggerBtn, "SEARCH")
   }
}

async function searchClicked() {
   if ( userStore.isSignedIn ) {
      analytics.trigger('Search', 'BASIC_SEARCH', "SIGNED_IN")
   } else {
      analytics.trigger('Search', 'BASIC_SEARCH', "SIGNED_OUT")
   }
   routeutils.setBasicSearchParams(router, route.query)
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
         border-right: 0;
         margin: 0 !important;
         border-radius: 0.3rem 0 0 0.3rem;
         flex: 1 1 auto;
         min-width: 100px;
      }
      .search {
         border-radius: 0 0.3rem 0.3rem 0;
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
   .controls-wrapper  {
      max-width: 800px;
      margin: 15px auto 20px auto;
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
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
