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
         <div class="date-wrapper">
            <div class="date-section">
               <label>Published</label>
               <div class="date-entry">
                  <select v-model="dateType" name="date-type" @change="dateTypeChanged">
                     <option value="AFTER">AFTER</option>
                     <option value="BEFORE">BEFORE</option>
                     <option value="BETWEEN">BETWEEN</option>
                  </select>
                  <input v-model="startDate" placeholder="YYYY"/>
                  <template v-if="dateType == 'BETWEEN'">
                     <span>and</span>
                     <input v-model="endDate" placeholder="YYYY"/>
                  </template>
               </div>
               <div class="date-acts">
                  <VirgoButton label="Apply Date Filter" size="small" @click="applyDateFilterClicked"/>
                  <VirgoButton label="Clear Date Filter" severity="secondary" size="small" @click="clearDateFilterClicked"/>
               </div>
            </div>
            <div class="error" v-if="dateErr">{{ dateErr }}</div>
         </div>
         <SearchFilters v-if="hasFacets" />
         <CollectionContext />
         <div class="sort-section">
            <V4Sort :pool="selectedResults.pool" />
            <ExcludePool v-if="canExclude"/>
         </div>
      </div>
      <template v-if="!resultStore.searching">
         <div  v-if="selectedResults.hits.length == 0" class="hit-wrapper none">
            <div class="timeout" v-if="selectedResults.statusCode == 408">
               <span>Search timed out</span>
               <p class="note">
                  Sorry, the source providing this data took too long to respond.  You may wish to try your search again, or try a different search.
                  If the problem persists, <a href='https://www.library.virginia.edu/askalibrarian' target='_blank' aria-describedby="new-window">Ask a Librarian</a> may be able to help.
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
               <div v-if="signInRequired" class="reminder">
                  <div>Results from {{ poolExclusionString }} are turned off for guest users.</div>
                  <div><VirgoButton link @click="signInClicked" label="Sign in to see all results"/></div>
               </div>
               <div v-else-if="user.isSignedIn && queryStore.searchSources == 'all' && preferences.searchExclusions.length > 0" class="reminder">
                  <div>Results from {{ poolExclusionString }} are turned off. You may see more results by turning them on.</div>
                  <div><VirgoButton text @click="removeSearchExclusions">Click to here turn on all results.</VirgoButton></div>
               </div>
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
import { ref,computed, onMounted } from 'vue'
import { useUserStore } from "@/stores/user"
import { useResultStore } from "@/stores/result"
import { usePoolStore } from "@/stores/pool"
import { useFilterStore } from "@/stores/filter"
import { usePreferencesStore } from "@/stores/preferences"
import { useQueryStore } from "@/stores/query"
import { useRestoreStore } from '@/stores/restore'
import ExcludePool from "./modals/ExcludePool.vue"
import { useRouteUtils } from '@/composables/routeutils'
import { useRouter, useRoute } from 'vue-router'
import analytics from '@/analytics'

const route = useRoute()
const router = useRouter()
const routeUtils = useRouteUtils(router, route)

const resultStore = useResultStore()
const poolStore = usePoolStore()
const filters = useFilterStore()
const preferences = usePreferencesStore()
const queryStore = useQueryStore()
const user = useUserStore()
const restore = useRestoreStore()

const loadingMore = ref(false)
const dateType = ref("BETWEEN")
const startDate = ref("")
const endDate = ref("")
const dateErr = ref("")

onMounted( () => {
   // find the advanced term with field = 'date_filter' and use it 
   // to set the variables that control the date filer UI
   if ( queryStore.dateFilter ) {
      dateType.value = queryStore.dateFilter.comparison
      startDate.value = queryStore.dateFilter.startDate
      endDate.value = queryStore.dateFilter.endDate
   }
})

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
const signInRequired = computed(()=>{
   return (user.isSignedIn == false && queryStore.searchSources == "all" )
})

const canExclude = computed(() => {
   if ( !resultStore.selectedResults ) return false
   if ( user.isSignedIn == false ) return false
   return ( resultStore.selectedResults.pool.id != 'uva_library' &&  resultStore.selectedResults.pool.id != 'images')
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

const dateTypeChanged = (() => {
   dateErr.value = ""
   if ( dateType.value != "BETWEEN" ) {
      endDate.value = ""
   }   
})

const clearDateFilterClicked = (() => {
   dateType.value = "BETWEEN"
   startDate.value = ""
   endDate.value = ""
   dateErr.value = ""
   queryStore.removeDateFilter()
   queryStore.userSearched = true
   routeUtils.searchChanged()
})

const applyDateFilterClicked = (() => {
   dateErr.value = ""
   var year1 = parseInt(startDate.value, 10)
   if ( (""+year1) !=  startDate.value || startDate.value.length != 4) {
      dateErr.value = "Please enter all dates as a four digit year"
      return
   }
   if ( dateType.value == "BETWEEN") {
      var year2 = parseInt(endDate.value, 10)
      if ( (""+year2) !=  endDate.value || endDate.value.length != 4) {
         dateErr.value = "Please enter all dates as a four digit year"
         return
      } 
      if (year2 <= year1) {
         dateErr.value = "End date must be greater than the start date"
         return   
      }  
   }
   queryStore.setDateFilter(dateType.value, startDate.value, endDate.value)
   queryStore.userSearched = true
   routeUtils.searchChanged()
})

const removeSearchExclusions = (() => {
   preferences.removeSearchExclusions()
   analytics.trigger('Preferences', 'REMOVE_POOL_EXCLUSION', "all")   
   queryStore.userSearched = true
   queryStore.searchSources = "all"
   resultStore.searchAllPools()
})

const signInClicked = (() => {
   // restore.setRestoreSaveSearch()
   router.push("/signin")
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
.sort-section, .date-wrapper {
   color: $uva-grey-B;
   background: white;
   border: 1px solid $uva-grey-100;
   border-top: 1px solid $uva-grey-200;
   padding: 10px;
   display: flex;
   gap: 10px;
   label {
      font-weight: bold;
   }
}
 .date-wrapper  {
   flex-direction: column;
   .error {
      color: $uva-red-A;
      font-style: italic;
   }
 }
.sort-section {
   justify-content: space-between;
   align-items: center;
   flex-flow: row wrap;
}
.date-section {
   display: flex;
   flex-flow: row wrap;
   gap: 10px;
   justify-content: flex-start;
   align-items: center;
   .date-entry {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: 10px;
      input {
         width: 75px;
      }
   }
   .date-acts {
      display: flex;
      flex-flow: row nowrap;
      gap: 10px;
      margin-left: auto;
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
}
div.pool-header {
   margin: 0 0 1rem 0;
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
   color: $uva-red;
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
   .sort-section {
      justify-content: flex-start;
      padding-bottom: 10px;
   }
}
.expand-panel {
   margin: 0px 0 25px 0;
   border: 1px solid $uva-grey-100;
}
</style>
