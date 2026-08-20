<template>
   <div class="pool-results">
      <div class="pool-header">
         <div class="desc" v-html="selectedResults.pool.description">
         </div>
         <div v-if="hasLogo" class="source-logo">
            <a v-if="hasURL" :href="poolStore.externalURL(selectedResults.pool.id)" target="_blank" aria-describedby="new-window">
               <img class ="logo" :src="poolStore.logo(selectedResults.pool.id)">
            </a>
             <img v-else class ="logo" :src="poolStore.log(selectedResults.pool.id)">
         </div>
         <CollectionContext />
         <div class="actions-section">
            <div class="left-acts">
               <VirgoButton v-if="selectedResults.hits.length > 0 && hasFacets" @click="filtersClicked()" label="Filters" icon="fa-light fa-sliders" severity="secondary" />
               <SaveSearch />
               <VirgoButton v-if="showPrintButton" severity="secondary" @click="printResults" label="Print Results" icon="fa-light fa-print"/>
               <VirgoButton v-if="canUseSuggestor" severity="secondary" @click="suggestor.toggle" label="Suggestions" icon="fas fa-lightbulb" :disabled="suggestor.open"/>
            </div>
            <V4Sort :pool="selectedResults.pool" />
         </div>
      </div>
      <div  v-if="selectedResults.hits.length == 0" class="hit-wrapper none">
         <template v-if="selectedResults.statusCode == 408">
            <span>Search timed out</span>
            <p class="note">
               Sorry, the source providing this data took too long to respond.  You may wish to try your search again, or try a different search.
               If the problem persists, <a href='https://www.library.virginia.edu/askalibrarian' target='_blank' aria-describedby="new-window">Ask a Librarian</a> may be able to help.
            </p>
            <VirgoButton @click="retrySearch">Retry Search</VirgoButton>
         </template>
         <template v-else>
            <span>No results found</span>
            <p class="error" v-if="selectedResults.statusCode != 200 && selectedResults.statusMessage">
               {{selectedResults.statusMessage}}
            </p>
            <div v-else>
               <p class="note">Suggestions</p>
               <ul >
                  <li>Check your spelling.</li>
                  <li>Use more generic search terms.</li>
                  <li v-if="queryStore.mode=='basic'">Use <router-link to="/search?mode=advanced">Advanced Search</router-link> to create a more targeted search.</li>
                  <li>Clear any active filters.</li>
               </ul>
            </div>
         </template>
      </div>
      <div v-else class="detail-content">
         <FacetSidebar />
         <div class="hits" role="region" aria-label="search results">
            
            <SearchSuggestions v-if="canUseSuggestor" />

            <ul v-if="selectedResults.pool.mode=='image'" class="image hits-content" role="list">
               <li role="listitem" v-for="hit in selectedResults.hits" class="image hit-wrapper" :key="`img-${hit.identifier}`">
                  <ImageSearchHit :pool="selectedResults.pool.id" :hit="hit"/>
               </li>
            </ul>
            <div v-else class="hits-content" role="list">
               <div role="listitem" v-for="hit in selectedResults.hits" class="hit-wrapper" :key="`hit-${hit.number}-${hit.identifier}`">
                  <SearchHit :pool="selectedResults.pool.id" :count="hit.number" :hit="hit"/>
               </div>
            </div>
         </div>
      </div>
      <span role="toolbar"  v-if="selectedResults.hits.length > 0">
         <div v-if="user.isSignedIn == false" class="reminder">
            <div>Results from {{ poolExclusionString }} are turned off for guest users.</div>
            <div><VirgoButton link @click="signInClicked" label="Sign in to see all results"/></div>
         </div>
         <div v-else-if="user.isSignedIn && preferences.searchExclusions.length > 0" class="reminder">
            <div>Results from {{ poolExclusionString }} are turned off. You may see more results by turning them on.</div>
            <div><VirgoButton text @click="removeSearchExclusions">Click to here turn on all results.</VirgoButton></div>
         </div>
         <VirgoButton v-if="resultStore.hasMoreHits" @click="loadMoreResults">
            <V4Spinner v-if="loadingMore" color="white"/>
            <span v-else>Load More Results</span>
         </VirgoButton>
      </span>
   </div>
</template>

<script setup>
import SearchHit from "@/components/SearchHit.vue"
import ImageSearchHit from "@/components/ImageSearchHit.vue"
import V4Sort from "@/components/V4Sort.vue"
import SaveSearch from "@/components/modals/SaveSearch.vue"
import CollectionContext from "@/components/CollectionContext.vue"
import { ref,computed, nextTick } from 'vue'
import { useUserStore } from "@/stores/user"
import { useResultStore } from "@/stores/result"
import { usePoolStore } from "@/stores/pool"
import { useFilterStore } from "@/stores/filter"
import { usePreferencesStore } from "@/stores/preferences"
import { useQueryStore } from "@/stores/query"
import { useSystemStore } from "@/stores/system"
import { useSuggestorStore } from "@/stores/suggestor"
import analytics from '@/analytics'
import FacetSidebar from "@/components/facets/FacetSidebar.vue"
import SearchSuggestions from "@/components/SearchSuggestions.vue"

const systemStore = useSystemStore()
const resultStore = useResultStore()
const poolStore = usePoolStore()
const filters = useFilterStore()
const preferences = usePreferencesStore()
const queryStore = useQueryStore()
const user = useUserStore()
const suggestor = useSuggestorStore()

const loadingMore = ref(false)

const hasFacets = computed(()=>{
   return poolStore.facetSupport(resultStore.selectedResults.pool.id)
})
const hasLogo = computed(()=>{
   return poolStore.logo(resultStore.selectedResults.pool.id) != ""
})
const hasURL = computed(()=>{
   return poolStore.externalURL(resultStore.selectedResults.pool.id) != ""
})
const selectedResults = computed(()=>{
   return resultStore.selectedResults
})
const showPrintButton = computed(()=>{
   return resultStore.selectedResults.pool.id=='uva_library' || resultStore.selectedResults.pool.id=='articles'
})
const canUseSuggestor = computed(() => {
   // If there is no suggestor configured, never show it. If configured,
   // suggestor is only available for keyword searches issued 
   // by signed in users that are part of the experimental group
   if ( systemStore.useSuggestor == false ) return false
   if ( user.isSignedIn == false ) return false 
   if ( user.isExperimental == false ) return false 
   return queryStore.isKeywordSearch
})


const poolExclusionString = computed( () => {
   let msg = ""
   // NOTES: if a pool has been set as excluded in preferences and that pool
   // is later diabled at a system level in the sources table (or it fails identify), it will no longer
   // be in the poolStore and the detals lookup will fail. Must handle this case
   preferences.searchExclusions.forEach( (s, idx) => {
      if (idx > 0 ) {
         if ( idx == preferences.searchExclusions.length -1) {
            msg += " and "
         } else {
            msg += ", "
         }
      }
      let detail = poolStore.poolDetails( s )
      if ( detail != null && detail.name  ) {
         msg += detail.name
      }
   })
   return msg
})

const removeSearchExclusions = (() => {
   preferences.removeSearchExclusions()
   analytics.trigger('Preferences', 'REMOVE_POOL_EXCLUSION', "all")   
   queryStore.userSearched = true
   resultStore.searchAllPools()
})

const signInClicked = (() => {
   router.push("/signin")
})

const printResults = (() => {
   systemStore.printing = true
   analytics.trigger('Results', 'PRINT_RESULTS', queryStore.mode)
   const printStyle = `
      <style type="text/css">
      #print-results {
         background: white;
         text-align: left;
         margin-left: 10px;
      }
      .hit-wrapper {
         margin-bottom: 15px;
         padding-bottom: 15px;
         border-bottom: 2px solid black;
      }
      .hit-wrapper.group {
         border-bottom: 0;
         margin: 15px 0 0 0;
         padding: 15px 0 0 0;
         border-top: 2px solid black;
      }
      .hit-title {
         font-weight: bold;
      }
      .number {
         margin-right: 5px;
         font-weight: normal;
      }
      .author {
         margin-left: 10px;
      }
      .fields {
         font-size: 0.85em;
         margin: 5px 0 0 5px;
      }
      .label {
         font-weight: bold;
         margin-right: 5px;
         text-align: right;
         padding-right: 5px;
      }
      </style>`

   nextTick( () => {
      // Setting systemStore.printing = true renders a simplified list in a hidden div. nextTick is
      // needed to allow time for the content to be rendered. After that,
      // get the conntent and set that as the innerHTML for the iframe embeddded on the results page.
      // Print from the iframe and remove content
      let contents = document.getElementById("print-results").innerHTML
      window.frames["printFrame"].document.body.innerHTML = (printStyle+contents)
      window.frames["printFrame"].print()
      window.frames["printFrame"].document.body.innerHTML = ""
      systemStore.printing = false
   })
})

const filtersClicked = (() => {
   filters.closed = !filters.closed 
   if (filters.closed ) {
      analytics.trigger('Filters', 'SIDEBAR_CLOSED', "")
   } else {
      analytics.trigger('Filters', 'SIDEBAR_OPENED', "")   
   }
})

async function retrySearch() {
   resultStore.clearSelectedPoolResults()
   let params = {
      pool: resultStore.selectedResults.pool,
      page: resultStore.selectedResults.page
   }
   await resultStore.searchPool(params)
   filters.getSelectedResultFacets(true)
}
async function loadMoreResults() {
   if ( resultStore.searching) return

   if (resultStore.hasMoreHits) {
      loadingMore.value = true
      resultStore.moreResults().finally( ()=> {
         loadingMore.value = false
         let query = Object.assign({}, route.query)
         query.page = resultStore.selectedResults.page+1 // page is 0 based internally
      })
   }
}
</script>
<style lang="scss" scoped>
.actions-section {
   color: $uva-grey-B;
   background: white;
   border: 1px solid $uva-grey-100;
   border-top: 1px solid $uva-grey-200;
   padding: 10px;
   display: flex;
   gap: 10px;
   justify-content: space-between;
   align-items: center;
   flex-flow: row wrap;
   .left-acts {
      display: flex;
      flex-flow: row wrap;  
      gap: 5px;
   }
   label {
      font-weight: bold;
   }
}

.reminder {
   background: white;
   border: 1px solid $uva-grey-100;
   padding: 15px;
   margin: 20px 0;
}  
.pool-results {
   border: 0;
   position: relative;
   .detail-content {
      display: flex;
      flex-flow: row nowrap;
      gap: 15px;
      border: 1px solid $uva-grey-100;
      border-top: 0;
      padding-right: 15px;
      background: #fafafa;
   }
}
div.pool-header {
   margin: 0 0 0 0;
   text-align: left;
   display: flex;
   flex-direction: column;
   .desc  {
      padding: 15px 10px 10px 10px;
      border-left: 1px solid $uva-brand-blue;
      border-right: 1px solid $uva-brand-blue;
      background: $uva-brand-blue;
      color: white;
      background: $uva-brand-blue;
   }
.desc :deep(a) {
   color: white !important;
   text-decoration: underline !important;
   font-weight: normal !important;
   &:hover {
      font-style: italic !important;
   }
}
   .source-logo {
      background: white;
      padding: 5px;
      text-align: left;
      border: 1px solid $uva-grey-100;
      .logo {
         max-height:90px;
         display: inline-block;
      }
   }
}
.hits {
   flex-grow: 1;
}
.hits-content {
   text-align: left;
   margin: 20px 0;
   display: flex;
   flex-direction: column;
   justify-content: flex-start;
   align-items: stretch;
   gap: 20px;
}
.image.hits-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  grid-gap: 2rem;
  list-style: none;
  margin: 0 0 20px 0;
  padding: 0;
  height: 100%;
  .image.hit-wrapper {
      box-shadow: none;
      margin:0;
      padding:0;
      max-width: 250px;
   }
}
.hit-wrapper.none {
   background: white;
   padding: 25px;
   margin-bottom: 1rem;
   text-align: left;
   border: 1px solid #ccc;
   display: flex;
   flex-direction: column;
   align-items: flex-start;
   gap: 10px;

   span {
      font-size: 1.25em;
      font-weight: 500;
   }

   p.note {
      margin: 5px 0;
      font-weight: normal;
   }
}
.hit-wrapper.none .error {
   padding: 0;
   margin: 5px 0;
   font-size: 0.75em;
   font-weight: normal;
   color: $uva-red;
}
.no-results {
   text-align: left;
}
@media only screen and (max-width: 600px) {
   .hits-content {
      margin: 10px 0 0 0;
      gap: 10px;
   }
   .image.hits-content {
      margin: 0 0 20px 0;
      grid-gap: .5rem;
   }
   .sort-section {
      justify-content: flex-start;
      padding-bottom: 10px;
   }
   div.detail-content {
      border: none !important;
      padding-right: 0 !important;
   }
}
.expand-panel {
   margin: 0px 0 25px 0;
   border: 1px solid $uva-grey-100;
}
</style>
