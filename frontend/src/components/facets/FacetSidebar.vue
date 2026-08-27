<template>
   <section v-if="showSidebar" class="facet-sidebar" :class="{overlay: !startSidebarExpanded}" role="group">
      <AccordionContent id="pool-filter" class="filter" :closeButton="true" @close="sidebarClosed"
         :collapseButton="false"
         :expanded="true"
         :background=colors.grey200 
         :borderColor=colors.grey100 
         :hasSettings="true" :showSettings="filterPrefsOpen" @settingsClicked="filterPrefsOpen = !filterPrefsOpen"
      >
         <template v-slot:title>Refine your results</template>
         <template v-slot:settings>
            <div class="settings">
               <FacetMode/>
               <FacetOrder :facets="facets" @apply="setFacetOrder"/>
               <div class="note">
                  Within a category, filter values can be combined with AND or OR. For example, selecting "English" and "French" under Language:
                  <ul>
                     <li>AND returns materials in both English and French.</li>
                     <li>OR returns materials in either English or French.</li>
                  </ul>
               </div>
            </div>
         </template>
         <div class="body">
            <div class="apply-controls floating" v-if="orFilterMode != 'SINGLE' && orFilters.length > 0">
               <button class="cancel" @click="cancelOrFilter()"><i class="fal fa-xmark"></i>Cancel</button> 
               <button class="apply" @click="applyOrFilter()"><i class="fal fa-check"></i>Apply {{ orFilters.length }} filters</button> 
            </div>
            <AppliedFilters v-if="appliedFiltersCount > 0" />
            <DateFilter v-if="canDateFilter && filtersUnavailable == false && filterStore.updatingFacets == false" />
            <div v-if="filterStore.updatingFacets || (facetsLoaded == false && resultStore.searching)" class="dimmer">
               <div class="working">
                  Loading filters...
                  <div class="spinner-animation">
                     <div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div>
                  </div>
               </div>
            </div>
            <template v-if="filtersUnavailable == false" v-for="(facetInfo,idx) in facets" :key="facetInfo.id" >
               <AccordionContent v-if="facetValuesCount(facetInfo) > 0"
                  :id="facetInfo.id" :background=colors.grey200 :expanded="idx < 4"
                  :closeButton="resultStore.selectedResults.pool.id != 'articles'" @close="excludeFilter(facetInfo)"
               >
                  <template v-slot:title>{{ facetInfo.name }}</template>
                  <div class="facet-container">
                     <template  v-if="facetValuesCount(facetInfo) > 5">
                        <div class="facet-search">
                           <input type="text" :placeholder="`Search for ${facetInfo.name}`" v-model="facetInfo.search"  aria-label="search filter values"/>
                        </div>
                        <div class="facet-sort">
                           <button @click="setFilterSort(facetInfo,'alpha')">Sort by name<i :class="`fal ${filterSort(facetInfo.id,'alpha')}`"></i></button>
                           <button @click="setFilterSort(facetInfo,'count')">Sort by count<i :class="`fal ${filterSort(facetInfo.id,'count')}`"></i></button>
                        </div>
                     </template>
                     <div class="apply-controls" v-if="orFilterMode == 'SINGLE' && orFilters.length > 0  && targetFacetID == facetInfo.id">
                        <button class="cancel" @click="cancelOrFilter()"><i class="fal fa-xmark"></i>Cancel</button> 
                        <button class="apply" @click="applyOrFilter()"><i class="fal fa-check"></i>Apply {{ orFilters.length }} filters</button> 
                     </div>
                     <ul :aria-labelledby="facetInfo.id">
                        <li v-for="(fv,idx) in facetValues(facetInfo)"  :key="valueKey(idx, facetInfo.id)">
                           <template v-if="preferences.facetMode == 'AND'">
                              <button class="filter" @click="filterSelected(facetInfo.id, fv)">{{fv.value}}</button>
                              <span class="cnt" v-if="fv.count">({{$formatNum(fv.count)}})</span>   
                           </template>
                           <template v-else>
                              <label class="filter-check">
                                 <input type="checkbox" @change="orFilterToggled(facetInfo.id, fv)" 
                                    :checked="orFilters.includes(fv)" :disabled="isFacetDisabled(facetInfo.id)"
                                 />
                                 <span :class="{dim: isFacetDisabled(facetInfo.id)}">{{ fv.value }}</span>
                              </label>
                              <span :class="{dim: isFacetDisabled(facetInfo.id)}" class="cnt" v-if="fv.count">({{$formatNum(fv.count)}})</span>     
                           </template>
                        </li>
                     </ul>
                  </div>
               </AccordionContent>
            </template>
               <AccordionContent v-if="hasFilterExclusions" id="filter-exclusions" :background=colors.grey200 :expanded="false" >
                  <template v-slot:title>Excluded Filters</template>
                  <div class="excluded-list">
                     <template  v-for="filter in excludedFilters" :key="`${filter}-exclusion`">
                        <button class="remove" :aria-label="`Restore ${filter.value} filter`" @click="removeExclusion(filter)" :title="`Restore ${filter.name} filter`">
                           <i class="fas fa-times-circle"></i>
                           <span>{{ filter.name }}</span>
                        </button>
                     </template>
                     <VirgoButton label="Restore All" severity="secondary" size="small" @click="removeAllExclusions()"/>
                  </div>
               </AccordionContent>
         </div>
      </AccordionContent>
   </section>
   <div v-else class="padding"></div>
</template>

<script setup>
import AccordionContent from "@/components/AccordionContent.vue"
import { computed, ref } from 'vue'
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { usePoolStore } from "@/stores/pool"
import { useQueryStore } from "@/stores/query"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"
import { useRouter, useRoute } from 'vue-router'
import colors from '@/assets/theme/colors.module.scss'
import analytics from '@/analytics'
import { useWindowSize } from '@vueuse/core'
import { useRouteUtils } from '@/composables/routeutils'
import { scrollToItem } from '@/utils'
import AppliedFilters from "@/components/facets/AppliedFilters.vue"
import DateFilter from "@/components/facets/DateFilter.vue"
import { useConfirm } from "primevue/useconfirm"
import FacetOrder from "@/components/facets/FacetOrder.vue"
import FacetMode from "@/components/facets/FacetMode.vue"

const { width } = useWindowSize()
const route = useRoute()
const router = useRouter()
const routeUtils = useRouteUtils(router, route)
const resultStore = useResultStore()
const filterStore = useFilterStore()
const poolStore = usePoolStore()
const queryStore = useQueryStore()
const user = useUserStore()
const preferences = usePreferencesStore()
const confirm = useConfirm()

const filterPrefsOpen = ref(false)
const targetFacetID = ref("")
const orFilters = ref([])

// NOTES: All logic is in place to support adding filter values across all filter categories
// Switch the comment below to change how it works.
//const orFilterMode = "ALL"
const orFilterMode = "SINGLE"

const showSidebar = computed(() => {
   // main reasons not to show: if no facet support, user closed the sidebar or an error
   if ( resultStore.selectedResults.statusCode != 200  || filterStore.closed == true || hasFacets.value == false ) return false
   
   // if the above are ok, show the sidebar if there are results
   if (resultStore.selectedResults.total > 0) return true
   
   // there are no results, but there may be applied filters that caused this. Need to show so user can cancel
   return ( appliedFiltersCount.value > 0)
})
const facets = computed(()=>{
   return filterStore.poolFacets(resultStore.selectedResults.pool.id).filter( f=> f.hidden !== true)
})
const filtersUnavailable = computed(() => {
   return (facets.value.length == 0 || resultStore.selectedResults.total==0) && filterStore.updatingFacets == false && resultStore.searching == false
})
const hasFacets = computed(()=>{
   return poolStore.facetSupport(resultStore.selectedResults.pool.id)
})
const facetsLoaded = computed(()=>{
   return filterStore.poolFacets(resultStore.selectedResults.pool.id).length > 0
})
const appliedFiltersCount = computed(()=>{
   let cnt = filterStore.poolFilter(resultStore.selectedResults.pool.id).length
   if (queryStore.dateFilter) {
      cnt++
   }
   return cnt
})
const excludedFilters = computed(() =>{
   return preferences.filterExclusions(resultStore.selectedResults.pool.id)  
})
const hasFilterExclusions = computed(()=>{
   return preferences.filterExclusions(resultStore.selectedResults.pool.id).length > 0
})
const canDateFilter = computed(() => {
   if (resultStore.selectedResults.pool.mode == 'image') return false
   if ( hasFacets.value == false ) return false
   return true
})

const startSidebarExpanded = computed(()=>{
   filterStore.closed = width.value < 810
   return width.value > 810
})

const sidebarClosed = (() => {
   filterStore.closed = true
   analytics.trigger('Filters', 'SIDEBAR_CLOSED', "")
})

const facetValuesCount = ((facet) => {
   if (!facet.buckets) return 0
   return facet.buckets.filter(b=>b.value && b.selected == false).length
})

const facetValues = ((facet) => {
   if (!facet.buckets) return []

   if (facet.search.length > 0) {
      return facet.buckets.filter(b=> b.value && b.selected == false && b.value.toLowerCase().indexOf(facet.search.toLowerCase()) == 0 )
   }
   return facet.buckets.filter(b=> b.value && b.selected == false)
})

const valueKey = ((idx, facetID) => {
   return facetID+"_val_"+idx
})

const isFacetDisabled = ( (facetID)  => {
   if ( orFilterMode != 'SINGLE' ) return false
   if (targetFacetID.value == "") return false 
   return ( targetFacetID.value != facetID)
})
const cancelOrFilter = (() => {
   targetFacetID.value = ""    
   orFilters.value = []
})

const applyOrFilter = ( () => {
   orFilters.value.forEach( f => {
      f.selected = true    
      analytics.trigger('Filters', 'SEARCH_FILTER_SET', f.value)
   })
   routeUtils.filterChanged()
   scrollToItem("results-container", true)
   cancelOrFilter()
   autoCloseSidebar()
})

const autoCloseSidebar = (() => {
   if (width.value < 810) {
      // sidebar covers results, so close the panel after applying the filter
      filterStore.closed = true
   }
})

const orFilterToggled = ( (facetID, filter) => {
   const idx = orFilters.value.findIndex( f => f.value == filter.value)
   if ( idx == -1 ) {
      orFilters.value.push( filter )   
   } else {
      orFilters.value.splice(idx,1)
   }
   if (orFilters.value.length > 0 && orFilterMode == 'SINGLE' ) {
      targetFacetID.value = facetID
   }
})

const removeExclusion = ((facetInfo) => {
   const poolID = resultStore.selectedResults.pool.id
   preferences.toggleFilterExclusion(poolID, facetInfo)
   filterStore.getSelectedResultFacets(true)
   analytics.trigger('Filters', 'EXCLUSION_REMOVED', facetInfo.id)
})

const removeAllExclusions = (() => {
   preferences.resetFilterExclusions( resultStore.selectedResults.pool.id )
   filterStore.getSelectedResultFacets(true)  
   analytics.trigger('Filters', 'EXCLUSIONS_RESET', "")
   scrollToItem("results-container", true)
})

const excludeFilter = ( (facetInfo) => {
   confirm.require({
      message: `Exclude <b>${facetInfo.name}</b> from this and future searches?</br>You can restore it at any time.`,
      header: 'Confirm Exclude',
      icon: 'fal fa-exclamation-triangle',
      rejectProps: {
         label: 'Cancel',
         severity: 'secondary'
      },
      acceptProps: {
         label: 'Exclude'
      },
      accept: () => {
         let cleared = false 
         facetInfo.buckets.forEach( b => {
            if (b.selected) {
               b.selected = false 
               cleared = true
            }
         })
         
         const poolID = resultStore.selectedResults.pool.id
         preferences.toggleFilterExclusion(poolID, facetInfo)
         filterStore.excludePoolFacet(poolID, facetInfo.id)
         analytics.trigger('Filters', 'FILTER_EXCLUDED', facetInfo.id)
         if ( cleared ) {
            routeUtils.filterChanged()
         }
      }
   })
})

const setFacetOrder = ( async (sequenced ) => {
   await preferences.setFilterSequence(resultStore.selectedResults.pool.id, sequenced)
   filterStore.setPoolFilterSequence(resultStore.selectedResults.pool.id, sequenced )
   analytics.trigger('Filters', 'SEQUENCE_CHANGED', "")
   
})

const setFilterSort = ((filter, sortType) => {
   const poolID = resultStore.selectedResults.pool.id
   
   // see if preferences have been saved; this returns an object with fields sort and order
   let tgtInfo = preferences.filterSort(poolID, filter.id)
   if (!tgtInfo) {
      // no preferences set, find the target facet in the pool facet store
      // this facet also includes fields sort and order so it can be used the same as the 
      // preferences response
      tgtInfo = filterStore.poolFacets(poolID).find(f => f.id == filter.id)
   }

   let order = "desc"
   if (tgtInfo.sort == sortType) {
      if (tgtInfo.order == "desc") {
         order = "asc"
      }
   } else {
      if (sortType == "alpha") {
         order = "asc"
      }
   }
   if ( user.isSignedIn) {
      preferences.setFilterSort(poolID, filter, sortType, order)
   }
   filterStore.setSortOrder(resultStore.selectedResults.pool.id, filter.id, sortType, order)
   analytics.trigger('Filters', 'FILTER_SORT_CHANGED', `${filter.id}:${sortType}_${order}`)
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

const filterSelected = ((facetID, facetValue) => {
   facetValue.selected = true
   analytics.trigger('Filters', 'SEARCH_FILTER_SET', `${facetID}:${facetValue.value}`)
   routeUtils.filterChanged()
   scrollToItem("results-container", true)
   autoCloseSidebar()
})
</script>
<style lang="scss" scoped>
@media only screen and (min-width: 768px) {
   .padding {
      width: 5px;
   }
   .apply-controls.floating {
      width: 30%;
    }
}
@media only screen and (max-width: 768px) {
   .padding {
      display: none;
   }
    .apply-controls.floating {
      width: 95%;
    }
}
.facet-sidebar {
   margin: 0px 0px 15px 0px;
   flex: 1 1 25%;
   min-width: 370px;
   max-width: 400px;
   
   position: relative;
   top: -1px;
   left: -1px;
   :deep(.accordion) {
      h3 {
         padding: 5px 0 5px 5px;
      }
   }

   .filter-count {
      display: inline-block;
      margin-left: 5px;
   }
   .settings {
      text-align: left;
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
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

      .dim {
         opacity: 0.5;
      }

      .apply-controls.floating {
         position: fixed;
         bottom: 15px;
         left: 15px;
         display: flex;
         z-index: 100;
         flex-flow: row nowrap;
         justify-content: space-between;
         padding: 10px;
         border: 2px solid $uva-teal-B;
         background: $uva-teal-200;
         box-shadow: 2px 2px 10px 0px $uva-grey-A;
         border-radius: 0.5rem;
         button {
            text-align: center;
            padding: 4px 8px 4px 4px;
            border-radius: 0.3rem;
            font-size: 1em;
         }
         button.apply {
            background-color: $uva-brand-blue-100;
            color: white;
            border: 1px solid $uva-brand-blue;
         }
         button.cancel {
            background-color: $uva-grey-200;
            border: 1px solid $uva-grey;
         }
      }

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
      div.facet-container {
         div.facet-search, div.facet-sort, div.apply-controls {
            border-left: 1px solid $uva-grey-100;
            border-right: 1px solid $uva-grey-100;
            border-bottom: 1px solid $uva-grey-100;
            padding: 5px;
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
            font-size: 0.8em;
            gap: 5px;
            input[type=text] {
               flex-grow: 1;
               border-radius: 0;
            }
            button.apply {
               background-color: $uva-brand-blue-100;
               color: white;
               border: 1px solid $uva-brand-blue;
               text-align: center;
               padding: 4px 8px 4px 0px;
            }
            button.cancel {
               background-color: $uva-grey-200;
               border: 1px solid $uva-grey-100;
               text-align: center;
               padding: 4px 8px 4px 0px;
            }
            button {
               background-color: transparent;
               border:none;
               cursor: pointer;
               i {
                  display: inline-block;
                  margin-right: 5px;
               }
               &:focus {
                  outline: 1px dashed $uva-brand-blue-100;
                  outline-offset: 2px;
               }
               &:hover {
                  text-decoration: underline;
               }
            }
            i {
               display: inline-block;
               margin-left: 5px;
            }
         }
         div.apply-controls {
            border: 2px solid $uva-brand-blue-100;
         }
         div.facet-search {
            padding: 10px;
         }
         ul  {
            margin: 0;
            padding: 10px;
            border: 1px solid $uva-grey-100;
            border-top: 0;
            max-height: 275px;
            overflow-y: scroll;
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
            label.filter-check {
               display: flex;
               flex-flow: row nowrap;
               gap: 5px;
               align-items: center;
               input[type=checkbox] {
                  width: 20px;
                  height: 20px;
               }
            }
         }
      }

      .excluded-list {
         padding: 15px;
         display: flex;
         flex-direction: column;
         gap: 10px;
         border: 1px solid $uva-grey-100;
         border-top: 0;
         button.remove {
            border: 1px solid $uva-grey-100;
            padding: 6px 8px;
            border-radius: 0.3rem;
            margin: 0px;
            background: white;
            color: $uva-text-color-dark;
            cursor: pointer;
            text-align: left;
            font-size: 0.9rem;
            display: flex;
            i {
               margin: 1px 5px 0 0;
               color: $uva-red;
               font-size: 1rem;
            }
            &:hover {
               background: $uva-grey-200;
            }
         }
      }
   }
}
.note {
   border-top: 1px solid $uva-grey-100;
   font-size: 0.9em;
   padding: 10px 5px 0px 5px;
   margin: 10px 0 0 0;
   ul {
      margin: 5px 0 0 0;
      padding-left: 35px;
   }
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
   top: 0px;
   bottom: 0px;
   padding: 0px;
   margin: 0;
   z-index: 5000;
   background-color: white;
   .body {
      max-height: calc(100vh - 40px); // max height is height of screen
      overflow: scroll;
      padding-left: 20px;
      padding-right: 20px;
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
