<template>
   <PrintedSearchResults v-if="systemStore.printing" />
   <div tabindex="-1" id="results-container" class="search-results" aria-describedby="search-summary">
      <SearchSuggestions />
      <div class="results-header" role="heading" aria-level="2">
         <div id="search-summary" class="summary">
            <div class="query">Showing {{utils.formatNum(resultStore.total)}} results for:</div>
            <div class="qs">{{queryString}}</div>
         </div>
         <span class="buttons" role="toolbar">
            <VirgoButton severity="secondary" @click="resetSearch" >Reset Search</VirgoButton>
            <SaveSearch />
            <VirgoButton v-if="showPrintButton" @click="printResults">Print Results</VirgoButton>
         </span>
      </div>

      <div class="results-wrapper" >
         <FacetSidebar />
         <TabView @update:activeIndex="resultsSelected" :scrollable="true" :lazy="true" :activeIndex="resultStore.selectedResultsIdx">
            <TabPanel v-for="tab in sourceTabs" :key="`tab-${tab.poolID}`">
               <template #header>
                  <div class="pool-tab">
                     <div class="pool">{{ tab.name }}</div>
                     <div v-if="tab.failed" class='total error'>Failed</div>
                     <div v-else-if="tab.skipped" class='total error'>Skipped</div>
                     <div v-else :aria-label="`has ${tab.total} results`" class="total">({{utils.formatNum(tab.total) || '0'}})</div>
                  </div>
               </template>
               <PoolResultDetail />
            </TabPanel>
         </TabView>
      </div>
   </div>
</template>

<script setup>
import PoolResultDetail from "@/components/PoolResultDetail.vue"
import PrintedSearchResults from "@/components/PrintedSearchResults.vue"
import FacetSidebar from "@/components/FacetSidebar.vue"
import SaveSearch from "@/components/modals/SaveSearch.vue"
import SearchSuggestions from "@/components/SearchSuggestions.vue"
import * as utils from '../utils'
import analytics from '@/analytics'
import { useRouter, useRoute } from 'vue-router'
import { computed, nextTick } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useSortStore } from "@/stores/sort"
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

const router = useRouter()
const route = useRoute()
const queryStore = useQueryStore()
const resultStore = useResultStore()
const systemStore = useSystemStore()
const sortStore = useSortStore()
const filters = useFilterStore()

const showPrintButton = computed(()=>{
   return resultStore.selectedResults.pool.id=='uva_library' || resultStore.selectedResults.pool.id=='articles'
})
const queryString = computed(()=>{
   return queryStore.string.replace(/\{|\}/g, "")
})

const sourceTabs = computed(()=>{
   let tabs = []
   resultStore.results.forEach( r => {
      let tab = {
         poolID: r.pool.id, name: r.pool.name, total: r.total,
         failed:  poolFailed(r), skipped:  poolSkipped(r)
      }
      tabs.push(tab)
   })
   return tabs
})

const printResults = (() => {
   systemStore.printing = true
   analytics.trigger('Results', 'PRINT_RESULTS', queryStore.mode)

   nextTick( () => {
      let contents = document.getElementById("print-results").innerHTML
      let printFrame = document.createElement('iframe')
      printFrame.name = "printFrame"
      printFrame.style.position = "absolute"
      printFrame.style.right = "1000000px"
      document.body.appendChild(printFrame)
      let frameDoc = printFrame.contentWindow.document
      frameDoc.open()
      frameDoc.write('<html lang="en"><head><title>Search Results</title>')
      frameDoc.write('<link rel="stylesheet" type="text/css" href="/print.css"/>')
      frameDoc.write('</head><body>')
      frameDoc.write(contents)
      frameDoc.write('</body></html>')
      frameDoc.close()
      setTimeout( () => {
         window.frames["printFrame"].focus()
         window.frames["printFrame"].print()
         document.body.removeChild(printFrame)
         systemStore.printing = false
      }, 500)
   })
})

const resetSearch = ( async () => {
   resultStore.resetSearch()
   if ( queryStore.mode == "basic") {
      analytics.trigger('Results', 'RESET_SEARCH', "basic")
      router.push(`/search`)
   } else {
      analytics.trigger('Results', 'RESET_SEARCH', "advanced")
      router.push('/search?mode=advanced')
   }
})

const updateURL = (( poolID) => {
   let query = Object.assign({}, route.query)
   query.pool = poolID
   delete query.filter
   delete query.sort
   delete query.page
   let fqp = filters.asQueryParam( poolID )
   if (fqp.length > 0) {
      query.filter = fqp
   }
   if (sortStore.activeSort.length > 0) {
      query.sort = sortStore.activeSort
   }
   if (resultStore.selectedResults.page > 0) {
      query.page = resultStore.selectedResults.page +1
   }
   if ( route.query != query ) {
      router.push({query})
   }
})

const poolFailed = ((p) => {
   return (p.statusCode != 408 && p.total == 0 && p.statusCode != 200)
})
const poolSkipped = ((p) => {
   return p.statusCode == 408 && p.total == 0
})

const resultsSelected = ((resultIdx) => {
   if ( resultStore.selectedResultsIdx != resultIdx) {
      let r = resultStore.results[resultIdx]
      if ( poolFailed(r)) return
      poolSelected(resultIdx, r.pool.id)
   }
})

const poolSelected = (( resultIdx, poolID ) => {
   analytics.trigger('Results', 'POOL_SELECTED', poolID)
   resultStore.selectPoolResults(resultIdx)
   if ( route.query.pool != poolID ) {
      updateURL(poolID)
   }
})
</script>

<style scoped lang="scss">
:deep(div.p-tabview-panels) {
   padding: 0;
   background: transparent;
}

.search-results  {
   box-sizing: border-box;
   outline: 0;
   background-color: var(--uvalib-grey-lightest);

   .results-header {
      display: flex;
      flex-flow: row wrap;
      align-content: center;
      align-items: center;
      justify-content: space-between;
      padding-top: 15px;
      margin-bottom: 10px;
      .summary {
         margin: 0 0 0.2vw 0;
         font-weight: 500;
         text-align: left;
         .qs {
            margin-left:15px;
            font-style: italic;
            font-weight: 100;
         }
         span {
            font-size: 0.85em;
         }
         .subtotal {
            display: block;
            margin: 2px 0 2px 15px;
         }
         .query {
            text-align: left;
            margin: 0 0 0.2vw 0;
            font-weight: bold;
            font-size: 1.1em;
         }
      }
      .buttons {
         display: flex;
         flex-flow: row nowrap;
      }
   }

   :deep(button.p-tabview-nav-btn.p-link) {
      color: var(--uvalib-brand-orange);
      border: 2px solid var(--uvalib-brand-orange);
      width: 40px;
      border-radius: 20px;
      height: 40px;
      bottom: 0px;
      top: auto;
   }

   :deep(.p-tabview-nav)  {
      border: 0;
      background: transparent;


      .p-tabview-header {
         flex: 1 1 auto;
         border: 1px solid var(--uvalib-grey-light);
         border-radius: 5px 5px 0 0;
         background: white;
         a.p-tabview-nav-link  {
            border: 0;
            padding: 0.4rem 25px 0.6rem 0.6rem;
            height: 100%;
            display: flex;
            flex-direction: row;
            align-items: flex-start;
         }
      }

      .pool-tab {
         display: flex;
         flex-direction: column;
         align-items: flex-start;
         font-size: 0.95em;
         .pool {
            text-align: left;
            color: var(--uvalib-text);
            // min-width: 90px;
         }
         .total {
            font-size: 0.75em;
            margin: 0;
            font-weight: normal;
            color: var(--uvalib-text);
         }
         .total.error {
            font-weight: bold;
            color: var(--uvalib-red-darker);
         }
      }

      .p-highlight {
         border: 1px solid var(--uvalib-brand-blue);
         background: var(--uvalib-brand-blue);
         a {
            background-color: var(--uvalib-brand-blue);
            .pool-tab .pool,  .pool-tab .total {
               color:white;
            }
         }
      }
   }
}

@media only screen and (min-width: $breakpoint-mobile) {
   div.search-results {
      margin: 0;
      padding: 0 3vw 20px 3vw;
   }
   .results-wrapper {
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      gap: 15px;
      .p-tabview {
         flex: 1 1 70%;
      }
   }
}
@media only screen and (max-width: $breakpoint-mobile) {
   div.search-results {
      margin: 0;
      padding: 0 2vw 20px 2vw;
   }
}
</style>
