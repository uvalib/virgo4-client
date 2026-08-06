<template>
   <section class="facet-sidebar" :class="{overlay: !startSidebarExpanded}" role="group">
      <AccordionContent id="pool-filter" class="filter"
         :background=colors.brandBlue
         color="white" :expanded="startSidebarExpanded"
         :borderColor=colors.brandBlue
         :invert="!startSidebarExpanded"
         :hasSettings="true" :showSettings="showSettings" @settingsClicked="showSettings = !showSettings"
      >
         <template v-slot:title>Refine your results</template>
         <template v-slot:settings>
            <div class="keep-section">
               <label title="Preserve filter and sort seeings for this session">
                  <input type="checkbox" v-model="queryStore.keepSettings" />Keep refine settings
               </label>
            </div>
         </template>
         <div v-if="!hasFacets" class="body">
            <div class="no-facets">{{resultStore.selectedResults.pool.name}} does not support filtering</div>
         </div>
         <div v-else class="body">
            <AppliedFilters v-if="hasAppliedFilter" />
            <DateFilter v-if="canDateFilter" />

            <div v-if="filterStore.updatingFacets || (facetsLoaded == false && resultStore.searching)" class="dimmer">
               <div class="working">
                  Loading filters...
                  <div class="spinner-animation">
                     <div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div>
                  </div>
               </div>
            </div>
            <div v-if="(facets.length == 0 || resultStore.selectedResults.total==0) && filterStore.updatingFacets == false && resultStore.searching == false" class="no-facets">
               Filters are not available for this search
            </div>
            <template v-else="filterStore.updatingFacets == false" v-for="(facetInfo,idx) in facets" :key="facetInfo.id" >
               <AccordionContent v-if="facetValuesCount(facetInfo) > 0"
                  :id="facetInfo.id" :background=colors.grey200 
                  @accordion-collapsed="filterCollapsed(facetInfo.id)" :expanded="idx < 4"
               >
                  <template v-slot:title>{{ facetInfo.name }}</template>
                  <ul :aria-labelledby="facetInfo.id">
                     <li class="control" v-if="facetValuesCount(facetInfo) > 1">
                        <button @click="setFilterSort(facetInfo.id,'alpha')">Sort by name<i :class="`fal ${filterSort(facetInfo.id,'alpha')}`"></i></button>
                        <button @click="setFilterSort(facetInfo.id,'count')">Sort by count<i :class="`fal ${filterSort(facetInfo.id,'count')}`"></i></button>
                     </li>
                     <li v-for="(fv,idx) in facetValues(facetInfo,0,5)"  :key="valueKey(idx, facetInfo.id)">
                        <button class="filter" @click="filterSelected(facetInfo.id, fv)">{{fv.value}}</button>
                        <span class="cnt" v-if="fv.count">({{$formatNum(fv.count)}})</span>   
                     </li>
                     <template v-if="facetValuesCount(facetInfo) > 5" >
                        <li v-if="isFilterExpanded(facetInfo.id) == false" class="more">
                           <VirgoButton severity="secondary" size="small" 
                              :label="`Show all ${facetValuesCount(facetInfo)} filters`" icon="fal fa-plus" @click="toggleFilterExpand(facetInfo.id)"
                           />
                        </li>
                        <li v-else v-for="(fv,idx) in facetValues(facetInfo,5)" :key="valueKey(idx, facetInfo.id)">
                           <button class="filter" @click="filterSelected(facetInfo.id, fv)">{{fv.value}}</button>
                           <span class="cnt">({{$formatNum(fv.count)}})</span>   
                        </li>
                     </template>
                  </ul>
               </AccordionContent>
            </template>
         </div>
      </AccordionContent>
   </section>
</template>

<script setup>
import AccordionContent from "@/components/AccordionContent.vue"
import { computed, ref } from 'vue'
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { usePoolStore } from "@/stores/pool"
import { useQueryStore } from "@/stores/query"
import { useRouter, useRoute } from 'vue-router'
import colors from '@/assets/theme/colors.module.scss'
import analytics from '@/analytics'
import { useWindowSize } from '@vueuse/core'
import { useRouteUtils } from '@/composables/routeutils'
import { scrollToItem } from '@/utils'
import AppliedFilters from "@/components/AppliedFilters.vue"
import DateFilter from "@/components/DateFilter.vue"

const { width } = useWindowSize()
const route = useRoute()
const router = useRouter()
const routeUtils = useRouteUtils(router, route)
const resultStore = useResultStore()
const filterStore = useFilterStore()
const poolStore = usePoolStore()
const queryStore = useQueryStore()

const expandedFilters = ref([])
const showSettings = ref(false)

const hasFacets = computed(()=>{
   return poolStore.facetSupport(resultStore.selectedResults.pool.id)
})
const facetsLoaded = computed(()=>{
   return filterStore.poolFacets(resultStore.selectedResults.pool.id).length > 0
})
const hasAppliedFilter = computed(()=>{
   return filterStore.poolFilter(resultStore.selectedResults.pool.id).length > 0
})
const canDateFilter = computed(() => {
   if (resultStore.selectedResults.pool.mode == 'image') return false
   if ( hasFacets.value == false ) return false
   return true
})

const startSidebarExpanded = computed(()=>{
   return width.value > 810
})

const facets = computed(()=>{
   return filterStore.poolFacets(resultStore.selectedResults.pool.id).filter( f=> f.hidden !== true && f.na !== true)
})

function facetValuesCount(facet) {
   if (!facet.buckets) return 0
   return facet.buckets.filter(b=>b.value && b.selected == false).length
}
function facetValues(facet, start, end) {
   if (!facet.buckets) return []
   let out = facet.buckets.filter(b=> b.value && b.selected == false).slice(start,end)
   return out
}
function valueKey(idx, facetID) {
   return facetID+"_val_"+idx
}

const setFilterSort = ((filterID, type) => {
   let order = "desc"
   let filter = filterStore.poolFacets(resultStore.selectedResults.pool.id).find(f => f.id == filterID)
   if (filter ) {
       if (filter.sort == type ) {
         if ( filter.order == "desc") {
            order = "asc"
         }
       } else {
         if ( type == "alpha") {
            order = "asc"   
         }
      }
      filterStore.setSortOrder(resultStore.selectedResults.pool.id, filterID, type, order)
   }
})
const filterSort = ((filterID, type) => {
   let out = "fa-arrow-down-short-wide" // ASCENDING
   let filter = filterStore.poolFacets(resultStore.selectedResults.pool.id).find(f => f.id == filterID)
   if (filter ) {
      if (filter.sort != type ) {
         out = "fa-arrow-down-arrow-up"  
      } else if (filter.order == "desc") {
         out = "fa-arrow-down-wide-short"   
      }
   }
   return out
})

const filterCollapsed = ((filterID) => {
   expandedFilters.value = expandedFilters.value.filter(fID => fID != filterID)
})
const isFilterExpanded = ((filterID) => {
   return expandedFilters.value.includes(filterID)
})
const toggleFilterExpand = ((filterID) => {
   if ( isFilterExpanded(filterID) ) {
         
   }  else {
      expandedFilters.value.push(filterID)
   }
})

const filterSelected = ((facetID, facetValue) => {
   facetValue.selected = true
   analytics.trigger('Filters', 'SEARCH_FILTER_SET', `${facetID}:${facetValue.value}`)
   routeUtils.filterChanged()
    scrollToItem("results-container", true)
})
</script>
<style lang="scss" scoped>
.facet-sidebar {
   margin: 0px 0px 15px 0px;
   flex: 1 1 25%;
   min-width: 200px;
   display: inline-block;
   height: fit-content;

   :deep(i.settings-icon) {
      color: white !important;
   }

   .keep-section {
      padding: 15px 0 0 0;;
      text-align: left;
      input[type="checkbox"] {
         margin-right: 10px;
         width: 20px;
         height: 20px;
      }
   }

   .pool-filter-header, .filter {
      width: 100%;
   }
   .body {
      border: 1px solid $uva-grey-100;
      border-top: 0;
      text-align: left;
      margin: 0;
      background: white;
      position: relative;
      min-height: 120px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      position: relative;

      button.filter {
         flex-grow: 1;
         background-color: transparent;
         border:none;
         text-align: left;
         font-size: 1em;
         border-radius: 0.3rem;
         color: $uva-blue-alt-A;
         cursor: pointer;
         &:focus {
            outline: 1px dashed $uva-brand-blue-100;
            outline-offset: 2px;
         }
         &:hover {
            text-decoration: underline;
            font-weight: 500;
         }
      }
      ul  {
         margin: 0;
         padding: 10px;
         border: 1px solid $uva-grey-100;
         border-top: 0;
         li {
            cursor: pointer;
            font-size: 1em;
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
            padding: 3px 2px;
            font-weight: normal;
            gap: 15px;
            .cnt {
               font-size: .8em;
            }
         }
         li.control {
            border-bottom: 1px solid $uva-grey-100;
            margin-bottom: 5px;
            padding-bottom: 5px;
            font-size: 0.8em;
            button {
               background-color: transparent;
               border:none;
               &:focus {
                  outline: 1px dashed $uva-brand-blue-100;
                  outline-offset: 2px;
               }
            }
            i {
               display: inline-block;
               margin-left: 5px;
            }
         }
         li.more {
            margin-top: 5px;
            button {
               flex-grow: 1;
            }
         }
      }
   }
}
div.no-facets {
   text-align: center;
   margin:25px 5px;
   font-size: 1.25em;
}
.dimmer {
   position: absolute;
   left: 1px;
   right: 1px;
   top: 1px;
   bottom: 1px;
   z-index: 1;
   backdrop-filter: blur(2px);
   .working {
      text-align: center;
      background: white;
      margin: 10px;
      border: 1px solid $uva-grey-100;
      padding: 25px;

   }
}
.facet-sidebar.overlay {
   position: fixed;
   left: 0px;
   right: 0px;
   z-index: 5000;
   bottom: 0px;
   padding: 0;
   margin: 0;
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-end;
   justify-content: space-between;
   margin: 0;
   flex: 1 1 auto;

   .body {
      max-height: 450px;
      overflow: scroll;
   }
}
.spinner-animation {
   margin: 10px auto 0 auto;
   width: 80px;
   text-align: center;
}
.spinner-animation > div {
   width: 12px;
   height: 12px;
   border-radius: 100%;
   display: inline-block;
   -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
   animation: sk-bouncedelay 1.4s infinite ease-in-out both;
   margin: 0 2px;
   background-color: $uva-grey-100;
}
.spinner-animation .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.spinner-animation .bounce2 {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
@-webkit-keyframes sk-bouncedelay {
  0%, 80%, 100% { -webkit-transform: scale(0) }
  40% { -webkit-transform: scale(1.0) }
}
@keyframes sk-bouncedelay {
   0%, 80%, 100% {
      -webkit-transform: scale(0);
      transform: scale(0);
   } 40% {
      -webkit-transform: scale(1.0);
      transform: scale(1.0);
   }
}
</style>
