<template>
   <PrintedSearchResults  v-if="systemStore.printing"/>
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
   <iframe name="printFrame" style="display:none"></iframe>
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
import { scrollToItem } from '@/utils'
import { useRouteUtils } from '@/composables/routeutils'

const router = useRouter()
const route = useRoute()
const routeUtils = useRouteUtils(router, route)
const queryStore = useQueryStore()
const resultStore = useResultStore()
const systemStore = useSystemStore()

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

const poolSelected = (( poolID ) => {
   analytics.trigger('Results', 'POOL_SELECTED', poolID)

   let tgtIdx = resultStore.results.findIndex( r => r.pool.id == poolID )
   resultStore.selectPoolResults(tgtIdx)
   let newPoolID = resultStore.results[tgtIdx].pool.id
   if ( route.query.pool != newPoolID ) {
      queryStore.targetPool = newPoolID
      routeUtils.poolChanged()
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
