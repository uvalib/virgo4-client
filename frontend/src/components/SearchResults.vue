<template>
   <PrintedSearchResults v-if="systemStore.printing" />
   <div tabindex="-1" id="results-container" class="search-results" aria-describedby="search-summary">
      <SearchSuggestions />
      <div class="results-header" role="heading" aria-level="2">
         <div id="search-summary" class="summary">
            <div class="query">Showing {{$formatNum(resultStore.total)}} results for:</div>
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
         <div class="results-main">
            <div class="pool-tabs">
               <button v-for="(r,idx) in sourceTabs" :key="idx" class="pool" :class="{showing: idx == resultStore.selectedResultsIdx}"
                  @click="poolSelected(r.pool.id)"
               >
                  <span>
                     <div class="pool">{{r.pool.name}}</div>
                     <div :aria-label="`has ${r.total} results`" class="total">({{$formatNum(r.total) || '0'}})</div>
                  </span>
               </button>
               <OtherPoolsPicker  v-if="resultStore.results.length > systemStore.maxPoolTabs" @selected="poolSelected" />
            </div>
            <PoolResultDetail />
         </div>
      </div>
   </div>
</template>

<script setup>
import OtherPoolsPicker from "@/components/OtherPoolsPicker.vue"
import PoolResultDetail from "@/components/PoolResultDetail.vue"
import PrintedSearchResults from "@/components/PrintedSearchResults.vue"
import FacetSidebar from "@/components/FacetSidebar.vue"
import SaveSearch from "@/components/modals/SaveSearch.vue"
import SearchSuggestions from "@/components/SearchSuggestions.vue"
import analytics from '@/analytics'
import { useRouter, useRoute } from 'vue-router'
import { computed, nextTick, onMounted } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useSortStore } from "@/stores/sort"
import { scrollToItem } from '@/utils'

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
   if (resultStore.results.length <= systemStore.maxPoolTabs) {
      return resultStore.results
   }
   return resultStore.results.slice(0, systemStore.maxPoolTabs )
})

onMounted( () => {
   if ( !resultStore.selectedHit ) {
      scrollToItem("results-container", true)
   }
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
   queryStore.searchSources = "all"
   if ( queryStore.mode == "basic") {
      analytics.trigger('Results', 'RESET_SEARCH', "basic")
      router.push("/")
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
.search-results  {
   box-sizing: border-box;
   outline: 0;
   background-color: #fafafa;
}

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
      gap: 5px 10px;
   }
}

.results-wrapper {
   display: flex;
   flex-flow: row wrap;
   justify-content: space-between;
   gap: 15px;

   .results-main {
      display: inline-block;
      flex: 1 1 70%;

      div.pool-tabs {
         font-weight: bold;
         margin: 0;
         text-align: left;
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-start;

         button.pool {
            padding: 8px 8px 10px 8px;
            border-radius: 0.3rem 0.3rem 0 0;
            border: 1px solid $uva-grey-100;
            text-align: left;
            flex: 1 1 auto;
            background: #FFF;
            .total {
               font-size: 0.75em;
               margin: 0;
               font-weight: normal;
            }

            &:focus {
               z-index: 1;
            }
            &:hover {
               background: #f6f6f6;
            }
         }

         button.pool.showing {
            background-color: $uva-brand-blue;
            color: #fff;
            border: 1px solid $uva-brand-blue;
            cursor: default;
         }
      }
   }
}

@media only screen and (min-width: 768px) {
   div.search-results {
      margin: 0;
      padding: 0 5vw 20px 5vw;
   }
}
@media only screen and (max-width: 768px) {
   div.search-results {
      margin: 0;
      padding: 0 2vw 20px 2vw;
   }
}
</style>
