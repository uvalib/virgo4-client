<template>
   <PrintedSearchResults  v-if="systemStore.printing"/>
   <div tabindex="-1" id="results-container" class="search-results" aria-describedby="search-summary">
      
      <div class="results-header" role="heading" aria-level="2">
         <div id="search-summary" class="summary">
            <div class="query">Showing {{$formatNum(resultStore.total)}} results for:</div>
            <div class="qs">{{queryString}}</div>
         </div>
      </div>

      <div class="results-wrapper" >
         <div class="results-main">
            <div class="pool-tabs">
               <div class="tab" v-for="(r,idx) in sourceTabs" :key="idx" :class="{showing: idx == resultStore.selectedResultsIdx}">
                  <button v-if="canExclude(r.pool.id)" :aria-label="`exclude ${r.pool.name}`" :title="`exclude ${r.pool.name}`" 
                     class="exclude" @click="excludePoolClicked(r.pool)">
                     <i  class="fal fa-xmark"></i>
                  </button>
                  <button class="pool" @click="poolSelected(r.pool.id)" :class="{padded: canExclude(r.pool.id)==false}">
                     <span>
                        <div class="name">{{r.pool.name}}</div>
                        <div :aria-label="`has ${r.total} results`" class="total">({{$formatNum(r.total) || '0'}})</div>
                     </span>
                  </button>
               </div>
               <OtherPoolsPicker v-if="showMore" @selected="poolSelected" />
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
import analytics from '@/analytics'
import { useRouter, useRoute } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"
import { scrollToItem } from '@/utils'
import { useRouteUtils } from '@/composables/routeutils'
import { useConfirm } from "primevue/useconfirm"

const router = useRouter()
const route = useRoute()
const confirm = useConfirm()
const routeUtils = useRouteUtils(router, route)
const queryStore = useQueryStore()
const resultStore = useResultStore()
const systemStore = useSystemStore()
const user = useUserStore()
const preferences = usePreferencesStore()

const showMore = ref(resultStore.results.length > systemStore.maxPoolTabs)

const canExclude = ((poolID) => {
   if ( !resultStore.selectedResults ) return false
   if ( user.isSignedIn == false ) return false
   return ( poolID != 'uva_library')
})



const queryString = computed(()=>{
   return queryStore.string.replace(/\{|\}/g, "")
})

const sourceTabs = computed(()=>{
   let tabs = [] 
   let other = []
   // get all non-excluded primary (catalog, images, articles) and other pools
   resultStore.results.forEach( r => {
      if (r.pool.primary ) {
         tabs.push(r)
      } else {
         other.push(r)
      }
   })


   if ( resultStore.results.length == 1) {
      showMore.value = false   
   } else {
      // if there is only 1 in the other list, promote it to a top-level tab and set a flag to remove More
      if (other.length == 1) {
         tabs.push( other[0])
         showMore.value = false
      }
   }
   return tabs
})

onMounted( () => {
   if ( !resultStore.selectedHit ) {
      scrollToItem("results-container", true)
   } else {
      // return search results to currently selected item
      scrollToItem(resultStore.selectedHit.identifier, false, true)
   }
})

const excludePoolClicked = ( (pool) => {
   confirm.require({
      message: `Exclude <b>${pool.name}</b> from this and future searches?</br>You can restore it at any time using your account preferences.`,
      header: 'Confirm Exclude',
      icon: 'fal fa-exclamation-triangle',
      rejectProps: {
         label: 'Cancel',
         severity: 'secondary'
      },
      acceptProps: {
         label: 'Exclude'
      },
      accept: ( ) => {
         preferences.toggleSearchExclusion(pool.id)
         queryStore.userSearched = true
         resultStore.selectPoolResults(0) // catalog is always 0
         queryStore.targetPool = resultStore.results[0].pool.id
         routeUtils.poolChanged()
      }
   })
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
   background-color:white;
}

.results-header {
   display: flex;
   flex-flow: row wrap;
   align-content: center;
   align-items: center;
   justify-content: space-between;
   margin-bottom: 10px;
   .summary {
      margin: 0 0 0.2vw 0;
      font-weight: 500;
      text-align: left;
      display: flex;
      flex-flow: row wrap;
      gap: 10px; 
      justify-content: flex-start;
      align-items: center;

      .subtotal {
         display: block;
         margin: 2px 0 2px 15px;
      }
      .query {
         text-align: left;
         margin: 0 0 0.2vw 0;
         font-weight: bold;
      }
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

         .tab {
            border-radius: 0.5rem 0.5rem 0 0;
            border: 1px solid $uva-grey-100;
            text-align: left;
            flex: 1 1 auto;
            background: #FFF;
            display: flex;
            flex-flow: row nowrap;
            justify-content: flex-start;
            .exclude {
               font-size: 1.2rem;
               cursor: pointer;
               padding: 0;
               border-radius: 25px;
               background: none;
               border: none;
               height: 40px;
               width: 40px;
               &:focus, &:hover {
                  outline: 2px dotted $uva-brand-blue-100;
               }
            }
            .pool {
               padding: 8px 8px 10px 0;
               background: transparent;
               border: none;
               flex-grow: 1;
               text-align: left;
               .total {
                  font-size: 0.9em;
                  margin: 0;
                  font-weight: normal;
               }
            }
            .pool.padded {
               padding-left: 12px;
            }
         }
         .tab.showing {
            background-color: $uva-brand-blue;
            color: #fff;
            border: 1px solid $uva-brand-blue;
            cursor: default;
            .pool,.exclude {
               color:white;
            }
         }
      }
   }
}

@media only screen and (min-width: 768px) {
   div.search-results {
      margin: 0;
      padding: 0 4vw 20px 4vw;
      .buttons {
         display: flex;
         flex-flow: row nowrap;
         gap: 5px;
      }
   }
}
@media only screen and (max-width: 768px) {
   div.search-results {
      margin: 0;
      padding: 0 2vw 20px 2vw;
      .buttons {
         margin-top: 10px;
         display: flex;
         flex-flow: row wrap;
         gap: 10px;
         .p-button {
            flex-grow: 1;
         }
      }
   }
}
</style>
