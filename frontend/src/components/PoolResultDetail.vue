<template>
   <div class="pool-results">
      <div class="pool-header">
         <div class="desc" v-html="selectedResults.pool.description">
         </div>
         <div v-if="hasLogo" class="source-logo">
            <a v-if="hasURL" :href="poolStore.externalURL(selectedResults.pool.id)" target="_blank">
               <img class ="logo" :src="poolStore.logo(selectedResults.pool.id)">
            </a>
             <img v-else class ="logo" :src="poolStore.log(selectedResults.pool.id)">
         </div>
         <SearchFilters v-if="hasFacets" />
         <CollectionContext />
         <div class="sort-section">
            <V4Sort :pool="selectedResults.pool" />
         </div>
      </div>
      <template v-if="!resultStore.searching">
         <div  v-if="selectedResults.hits.length == 0" class="hit-wrapper none">
            <div class="timeout" v-if="selectedResults.statusCode == 408">
               <span>Search timed out</span>
               <p class="note">
                  Sorry, the source providing this data took too long to respond.  You may wish to try your search again, or try a different search.
                  If the problem persists, <a href='https://www.library.virginia.edu/askalibrarian' target='_blank'>Ask a Librarian</a> may be able to help.
               </p>
               <VirgoButton @click="retrySearch">Retry Search</VirgoButton>
            </div>
            <template v-else>
               <span>No results found</span>
               <p class="error" v-if="selectedResults.statusCode != 200 && selectedResults.statusMessage">
                  {{selectedResults.statusMessage}}
               </p>
               <ExpandSearch />
            </template>
         </div>
         <div v-else class="hits" role="region" aria-label="search results">
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
         <span role="toolbar"  v-if="selectedResults.hits.length > 0">
            <ExpandSearch class="expand-panel" />

            <VirgoButton v-if="resultStore.hasMoreHits" @click="loadMoreResults">
               <V4Spinner v-if="loadingMore" color="white"/>
               <span v-else>Load More Results</span>
            </VirgoButton>
         </span>
      </template>
   </div>
</template>

<script setup>
import SearchHit from "@/components/SearchHit.vue"
import ImageSearchHit from "@/components/ImageSearchHit.vue"
import SearchFilters from "@/components/SearchFilters.vue"
import V4Sort from "@/components/V4Sort.vue"
import ExpandSearch from "@/components/ExpandSearch.vue"
import CollectionContext from "@/components/CollectionContext.vue"
import {ref,computed} from 'vue'
import {useRoute} from 'vue-router'
import { useResultStore } from "@/stores/result"
import { usePoolStore } from "@/stores/pool"
import { useFilterStore } from "@/stores/filter"

const route = useRoute()
const resultStore = useResultStore()
const poolStore = usePoolStore()
const filters = useFilterStore()

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

async function retrySearch() {
   resultStore.clearSelectedPoolResults()
   let params = {
      pool: resultStore.selectedResults.pool,
      page: resultStore.selectedResults.page
   }
   await resultStore.searchPool(params)
   filters.getSelectedResultFacets(false)
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
.sort-section {
   background: white;
   border-left: 1px solid $uva-grey-200;
   border-right: 1px solid $uva-grey-200;
}
.desc  {
   padding: 15px 10px 10px 10px;
   border-left: 1px solid var(--uvalib-brand-blue);
   border-right: 1px solid var(--uvalib-brand-blue);
   font-size: 0.9em;
}
.desc :deep(a) {
   color: white !important;
   text-decoration: underline !important;
   font-weight: normal !important;
   &:hover {
      font-style: italic !important;
   }
}
.pool-results {
   border: 0;
   position: relative;
}
div.pool-header {
   font-size: 1em;
   color: white;
   background: var(--uvalib-brand-blue);
   margin: 0 0 1rem 0;
   text-align: left;
   box-shadow: var(--uvalib-box-shadow);
}
.pool-name {
   font-weight: bold;
}
.hits-content {
   text-align: left;
   margin: 20px 0;
   display: flex;
   flex-direction: column;
   justify-content: flex-start;
   align-items: stretch;
   gap: 20px;
   .hit-wrapper {
      margin: 0;
   }
}
.image.hits-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  grid-gap: 1.25rem;
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
   padding:35px;
   margin-bottom: 1rem;

   span {
      font-size: 1.5em;
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
   color: var(--uvalib-red);
}
@media only screen and (max-width: 600px) {
   .hit-wrapper {
     max-width: 94vw;
     margin: 0 0px 20px 0px;
   }
   .image.hits-content {
      margin: 0 0 20px 0;
      grid-gap: .5rem;
   }
   div.pool-header {
      margin: 0 0 1rem 0;
   }
}
.no-more {
   cursor: default;
}
.source-logo {
   background: white;
   padding: 5px;
   text-align: left;
}
.source-logo .logo {
   max-height:90px;
   display: inline-block;
}
.expand-panel {
   margin: 0px 0 25px 0;
   box-shadow: var(--uvalib-box-shadow);
   border: 1px solid var(--uvalib-grey-light);
}
</style>
