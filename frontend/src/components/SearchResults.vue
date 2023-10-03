<template>
   <PrintedSearchResults v-if="systemStore.printing" />
   <div tabindex="-1" id="results-container"
      class="search-results" aria-describedby="search-summary"
   >
      <SearchSuggestions />
      <div class="results-header" role="heading" aria-level="2">
         <div id="search-summary" class="summary">
            <div class="query">Showing {{utils.formatNum(resultStore.total)}} results for:</div>
            <div class="qs">{{queryString}}</div>
         </div>
         <span class="buttons" role="toolbar">
            <V4Button mode="tertiary" @click="resetSearch" >Reset Search</V4Button>
            <SaveSearch />
            <V4Button v-if="showPrintButton" mode="primary" @click="printResults">Print Results</V4Button>
         </span>
      </div>

      <div class="results-wrapper" >
         <FacetSidebar />
         <div class="results-main">
            <div class="pool-tabs">
               <V4Button v-for="(r,idx) in sourceTabs" :key="idx"
                  class="pool" v-bind:class="{showing: idx == resultStore.selectedResultsIdx}"
                  mode="text" @click="resultsButtonClicked(idx)"
               >
                  <span>
                     <span class="pool">{{r.pool.name}}</span>
                     <span :aria-label="`has ${r.total} results`" class="total">({{utils.formatNum(r.total) || '0'}})</span>
                  </span>
               </V4Button>
               <Dropdown v-if="resultStore.results.length > preferences.maxTabs" v-model="otherSrcSelection" :class="{active: otherSrcSelection}"
                  :options="otherSources" optionLabel="name" optionValue="id" @change="otherSrcSelected">
                  <template #value>
                     <div v-if="otherSrcInfo" class="more-selection">
                        <div>{{ otherSrcInfo.name }}</div>
                        <div class="total">({{  otherSrcInfo.total }})</div>
                     </div>
                     <div v-else class="more">More</div>
                  </template>
                  <template #option="slotProps">
                     <div class="more-opt">
                        <span class="other-src">{{ slotProps.option.name }}</span>
                        <span v-if="slotProps.option.falied" class='total error'>Failed</span>
                        <span v-else-if="slotProps.option.skipped" class='total error'>Skipped</span>
                        <span v-else class="total">({{slotProps.option.total}})</span>
                     </div>
                  </template>
               </Dropdown>
            </div>
            <PoolResultDetail v-if="resultStore.selectedResultsIdx > -1" />
            <div  v-if="resultStore.total == 0 && resultStore.selectedResultsIdx == -1" class="none">
               No results found
            </div>
         </div>
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
import { computed, nextTick, ref, onMounted } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useSortStore } from "@/stores/sort"
import { usePreferencesStore } from "@/stores/preferences"
import Dropdown from 'primevue/dropdown'

const router = useRouter()
const route = useRoute()
const queryStore = useQueryStore()
const resultStore = useResultStore()
const systemStore = useSystemStore()
const preferences = usePreferencesStore()
const sortStore = useSortStore()
const filters = useFilterStore()

const otherSrcSelection = ref("")

onMounted(() => {
   if (route.query.pool) {
      let poolIdx = resultStore.results.findIndex( r => r.pool.id == route.query.pool)
      if (poolIdx >= preferences.maxTabs-1) {
         otherSrcSelection.value = route.query.pool
      }
   }
})

const showPrintButton = computed(()=>{
   return resultStore.selectedResults.pool.id=='uva_library' || resultStore.selectedResults.pool.id=='articles'
})
const queryString = computed(()=>{
   return queryStore.string.replace(/\{|\}/g, "")
})

const sourceTabs = computed(()=>{
   if (resultStore.results.length <= preferences.maxTabs) {
      return resultStore.results
   }
   return resultStore.results.slice(0, preferences.maxTabs-1 )
})

const otherSrcInfo = computed (() => {
   let r = resultStore.results.find( r => r.pool.id == otherSrcSelection.value)
   if (r) {
      return { name: r.pool.name, total: utils.formatNum(r.total)}
   }
   return null
})

const otherSources = computed(()=>{
   let opts = []
   let others = resultStore.results.slice(preferences.maxTabs-1).sort( (a,b) => {
      if (a.pool.name < b.pool.name) return -1
      if (a.pool.name > b.pool.name) return 1
      return 0
   })

   others.forEach( r=>{
      let opt = {id: r.pool.id, name: r.pool.name, falied: false, skipped: false, total: 0}
      if (poolFailed(r)) {
         opt.falied = true
      } else if (wasPoolSkipped(r)) {
         opt.skipped = true
      } else {
         opt.total = utils.formatNum(r.total)
      }
      if (r.pool.id == "jmrl" ) opt.falied = true
      opts.push(opt)
   })
   return opts
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
   return p.statusCode != 408 && p.total == 0 & p.statusCode != 200
})

const wasPoolSkipped = ((p) => {
   return p.statusCode == 408 && p.total == 0
})

const resultsButtonClicked = ((resultIdx) => {
   if ( resultStore.selectedResultsIdx != resultIdx) {
      let r = resultStore.results[resultIdx]
      if ( poolFailed(r)) return
      poolSelected(r.pool.id)
      otherSrcSelection.value = ""
   }
})

const otherSrcSelected = ((sel) => {
   poolSelected(sel.value)
})

const poolSelected = (( poolID ) => {
   analytics.trigger('Results', 'POOL_SELECTED', poolID)

   let tgtIdx = resultStore.results.findIndex( r => r.pool.id == poolID )
   if (tgtIdx > -1 ) {
      resultStore.selectPoolResults(tgtIdx)
      let newPoolID = resultStore.results[tgtIdx].pool.id
      if ( route.query.pool != newPoolID ) {
         updateURL(newPoolID)
      }
   }
})
</script>

<style scoped lang="scss">
div.p-dropdown.active {
   background-color: var(--uvalib-brand-blue);
   color: white;
   border: 1px solid var(--uvalib-brand-blue);
   :deep(.p-dropdown-trigger) {
      color: white;
   }
}
.more-opt {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   padding:0;
   margin:0;
   font-size: 0.9em;

   .other-src {
      margin-right: 20px;
   }
   .total.error {
      color: var( --uvalib-text-dark );
      font-weight: bold;
      display: inline-block;
      margin-left: auto;
   }
   .total {
      margin-left: auto;
   }
}

.results-main {
   display: inline-block;
   flex: 1 1 70%;
}

.search-results  {
   box-sizing: border-box;
   outline: 0;
   background-color: var(--uvalib-grey-lightest);
}

.results-header {
   display: flex;
   flex-flow: row wrap;
   align-content: center;
   align-items: center;
   justify-content: space-between;
   padding-top: 10px;
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


div.pool-tabs {
   font-weight: bold;
   margin: 0;
   text-align: left;
   display: flex;
   flex-flow: row wrap;
   justify-content: flex-start;
   span.total {
      display: block;
      font-size: 0.75em;
      margin: 0;
      font-weight: normal;
   }
}

.pool-tabs .pool.v4-button {
   margin: 0;
   padding: 8px 8px 10px 8px;
   border-radius: 5px 5px 0 0;
   color: var(--uvalib-text-dark);
   border: 1px solid var(--uvalib-grey-light);
   text-align: left;
   flex: 1 1 auto;
   background: #FFF;
   outline: none;
   &:focus {
      z-index: 1;
      @include be-accessible();
   }
}
.pool.v4-button:first-child {
  margin-left: 4px;
}
.pool.v4-button.showing {
   background-color: var(--uvalib-brand-blue);
   color: #fff;
   border-bottom: 1px solid var(--uvalib-brand-blue);
}
.pool.v4-button.disabled.failed {
   background: var(--uvalib-red-emergency);
   color: white;
   opacity: 0.5;
}
.pool-tabs .pool.v4-button:last-child {
   margin-right: -1px;
}


@media only screen and (min-width: $breakpoint-mobile) {
   div.search-results {
      margin: 0;
      padding: 0 5vw 20px 5vw;
   }
}
@media only screen and (max-width: $breakpoint-mobile) {
   div.search-results {
      margin: 0;
      padding: 0 2vw 20px 2vw;
   }
   .pool.v4-button:first-child {
      margin-left: -1px;
   }
}
.results-wrapper {
   display: flex;
   flex-flow: row wrap;
   justify-content: space-between;
}
.none {
   flex: 1 1 auto;
   font-size: 1.5em;
   font-weight: 500;
   padding-bottom: 150px;
   color: var(--uvalib-text);
}
</style>
