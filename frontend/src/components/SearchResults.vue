<template>
   <PrintedSearchResults v-if="systemStore.printing" />
   <div tabindex="-1" id="results-container"
      class="search-results" aria-describedby="search-summary"
   >
      <SearchSuggestions />
      <div class="results-header" role="heading" aria-level="2">
         <template v-if="props.showSummary">
            <div id="search-summary" class="summary">
               <div class="query">Showing {{utils.formatNum(resultStore.total)}} results for:</div>
               <div class="qs">{{queryString}}</div>
            </div>
            <span class="buttons" role="toolbar">
               <V4Button mode="text" @click="resetSearch" >Reset Search</V4Button>
               <SaveSearch v-if="userStore.isSignedIn"/>
               <SignInRequired v-else id="save-signin-modal" act="save-search"/>
               <V4Button v-if="showPrintButton" mode="primary" @click="printResults">Print Results</V4Button>
            </span>
         </template>
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
               <V4Select v-if="resultStore.results.length > preferences.maxTabs" :selections="otherSources"
                  :background="otherSrcBkg" :color="otherSrcColor"
                  placeholder="More"
                  @changed="poolSelected"
                  v-model="resultStore.otherSrcSelection"/>
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
import SignInRequired from "@/components/modals/SignInRequired.vue"
import * as utils from '../utils'
import analytics from '@/analytics'
import { useRouter, useRoute } from 'vue-router'
import { computed, nextTick } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useUserStore } from "@/stores/user"
import { useSortStore } from "@/stores/sort"
import { usePreferencesStore } from "@/stores/preferences"

const router = useRouter()
const route = useRoute()
const queryStore = useQueryStore()
const resultStore = useResultStore()
const systemStore = useSystemStore()
const userStore = useUserStore()
const preferences = usePreferencesStore()
const sortStore = useSortStore()
const filters = useFilterStore()

const props = defineProps({
   showSummary: { type: Boolean, default: true},
})

const showPrintButton = computed(()=>{
   return resultStore.selectedResults.pool.id=='uva_library' || resultStore.selectedResults.pool.id=='articles'
})
const queryString = computed(()=>{
   return queryStore.string.replace(/\{|\}/g, "")
})
const otherSrcBkg = computed(()=>{
   if (resultStore.otherSrcSelection.id == "") return "#FFF"
   return "var(--uvalib-brand-blue)"
})
const otherSrcColor = computed(()=>{
   if (resultStore.otherSrcSelection.id == "") return "#666"
   return "white"
})
const sourceTabs = computed(()=>{
   if (resultStore.results.length <= preferences.maxTabs) {
      return resultStore.results
   }
   return resultStore.results.slice(0, preferences.maxTabs-1 )
})
const otherSources = computed(()=>{
   let opts = []
   let others = resultStore.results.slice(preferences.maxTabs-1).sort( (a,b) => {
      if (a.pool.name < b.pool.name) return -1
      if (a.pool.name > b.pool.name) return 1
      return 0
   })

   others.forEach( r=>{
      let name = `<span class='other-src'><span class='pool'>${r.pool.name}</span>`
      if (poolFailed(r)) {
         name += "<span class='total error'>Failed</span>"
      } else if (wasPoolSkipped(r)) {
         name += "<span class='total'>Skipped</span>"
      } else {
         let t = utils.formatNum(r.total)
         name += `<span class='total'>(${t || '0'})</span>`
      }
      name += "</span>"
      opts.push({id: r.pool.id, name: name})
   })
   return opts
})

function printResults() {
   systemStore.printing = true
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
}
async function resetSearch(){
   resultStore.resetSearch()
   if ( queryStore.mode == "basic") {
      router.push(`/search`)
   } else {
      router.push('/search?mode=advanced')
   }
}
function updateURL( poolID) {
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
}
function poolFailed(p) {
   return p.statusCode != 408 && p.total == 0 & p.statusCode != 200
}
function wasPoolSkipped(p) {
   return p.statusCode == 408 && p.total == 0
}

function resultsButtonClicked(resultIdx) {
   if ( resultStore.selectedResultsIdx != resultIdx) {
      let r = resultStore.results[resultIdx]
      if ( poolFailed(r)) return
      resultStore.otherSrcSelection = {id:"", name:""}
      poolSelected(r.pool.id)
   }
}

function poolSelected( id ) {
   analytics.trigger('Results', 'POOL_SELECTED', id)

   let tgtIdx = resultStore.results.findIndex( r => r.pool.id ==id )
   if (tgtIdx > -1 ) {
      resultStore.selectPoolResults(tgtIdx)
      let newPoolID = resultStore.results[tgtIdx].pool.id
      if ( route.query.pool != newPoolID ) {
         updateURL(newPoolID)
      }
   }
}
</script>


<style scoped lang="scss">
:deep(.other-src) {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   padding:0;
   margin:0;
   .total {
      margin-left: auto;
   }
   .total.error {
      color: var( --uvalib-text-dark );
      font-weight: bold;
   }
   .pool {
      margin-right: 5px;
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
   .v4-select {
      margin: 0 -1px 2px 0;
      border-radius: 5px 5px 0 0;
      flex: 1 1 auto;
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
      &:focus {
         @include be-accessible();
      }
   }
}
.pool.v4-button:first-child {
  margin-left: 4px;
}
.pool.v4-button.showing {
   background-color: var(--uvalib-brand-blue);
   color: #fff;
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
