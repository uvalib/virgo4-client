<template>
   <section class="facet-sidebar" :class="{overlay: !startSidebarExpanded}" role="group">
      <AccordionContent id="pool-filter" class="filter"
         :background=colors.brandBlue
         color="white" :expanded="startSidebarExpanded"
         :borderColor=colors.brandBlue
         :invert="!startSidebarExpanded">
         <template v-slot:title>{{poolFilterTitle}}</template>

         <div v-if="!hasFacets" class="body">
            <div class="no-facets">{{resultStore.selectedResults.pool.name}} does not support filtering</div>
         </div>
         <div v-else class="body">
            <div v-if="filterStore.updatingFacets" class="working">
               <V4Spinner message="Loading filters..."/>
            </div>
            <div v-else-if="facets.length == 0" class="no-facets">
               Filters are not available for this search
            </div>
            <template v-else="filterStore.updatingFacets == false" v-for="(facetInfo,idx) in facets" :key="facetInfo.id" >
               <div v-if="facetInfo.id=='PeerReviewedOnly'" class="seer-review">
                  <label class="cb-label">
                     <Checkbox  v-model="facetInfo.buckets[0].selected" :binary="true" 
                        @update:modelValue="filterChanged(facetInfo.id, facetInfo.buckets[0])"
                     />
                     {{ facetInfo.buckets[0].value}}
                  </label>
               </div>
               <AccordionContent v-else
                  :id="facetInfo.id" :background=colors.grey200 
                  @accordion-collapsed="filterCollapsed(facetInfo.id)" :expanded="idx < 4"
               >
                  <template v-slot:title>{{ facetInfo.name }}</template>
                  <ul :aria-labelledby="facetInfo.id">
                     <li class="control" v-if="facetValuesCount(facetInfo) > 5" >
                        <button @click="setFilterSort(facetInfo.id,'alpha')">Sort by name<i :class="`fal ${filterSort(facetInfo.id,'alpha')}`"></i></button>
                        <button @click="setFilterSort(facetInfo.id,'count')">Sort by count<i :class="`fal ${filterSort(facetInfo.id,'count')}`"></i></button>
                     </li>
                     <li v-for="(fv,idx) in facetValues(facetInfo,0,5)"  :key="valueKey(idx, facetInfo.id)">
                        <span class="filter-check">
                           <Checkbox  v-model="fv.selected" :inputId="`${facetInfo.id}-${fv.value}`" :binary="true" @update:modelValue="filterChanged(facetInfo.id, fv)"/>
                           <label :for="`${facetInfo.id}-${fv.value}`" class="cb-label">{{fv.value}}</label>
                        </span>
                        <span class="cnt">({{$formatNum(fv.count)}})</span>   
                     </li>
                     <template v-if="facetValuesCount(facetInfo) > 5" >
                        <li v-if="isFilterExpanded(facetInfo.id) == false" class="more">
                           <VirgoButton severity="secondary" size="small" 
                              :label="`Show all ${facetValuesCount(facetInfo)} filters`" icon="fal fa-plus" @click="toggleFilterExpand(facetInfo.id)"
                           />
                        </li>
                        <li v-else v-for="(fv,idx) in facetValues(facetInfo,5)" :key="valueKey(idx, facetInfo.id)">
                           <span class="filter-check">
                              <Checkbox  v-model="fv.selected" :inputId="`${facetInfo.id}-${fv.value}`" :binary="true" @update:modelValue="filterChanged(facetInfo.id, fv)"/>
                              <label :for="`${facetInfo.id}-${fv.value}`" class="cb-label">{{fv.value}}</label>
                           </span>
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
import Checkbox from 'primevue/checkbox'
import { computed, ref } from 'vue'
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { usePoolStore } from "@/stores/pool"
import { useRouter, useRoute } from 'vue-router'
import colors from '@/assets/theme/colors.module.scss'
import analytics from '@/analytics'
import { useWindowSize } from '@vueuse/core'
import { useRouteUtils } from '@/composables/routeutils'

const { width } = useWindowSize()
const route = useRoute()
const router = useRouter()
const routeUtils = useRouteUtils(router, route)
const resultStore = useResultStore()
const filterStore = useFilterStore()
const poolStore = usePoolStore()

const expandedFilters = ref([])

const hasFacets = computed(()=>{
   return poolStore.facetSupport(resultStore.selectedResults.pool.id)
})

const startSidebarExpanded = computed(()=>{
   return width.value > 810
})
const poolFilterTitle = computed(()=>{
   if ( !startSidebarExpanded.value ) {
      return `Filter ${resultStore.selectedResults.pool.name}`
   }
   return `Filter ${resultStore.selectedResults.pool.name} By`
})
const facets = computed(()=>{
   return filterStore.poolFacets(resultStore.selectedResults.pool.id).filter( f=> f.hidden !== true && f.na !== true)
})

function facetValuesCount(facet) {
   if (!facet.buckets) return 0
   return facet.buckets.filter(b=>b.value && b.na != true).length
}
function facetValues(facet, start, end) {
   if (!facet.buckets) return []
   let out = facet.buckets.filter(b=> b.value && b.na != true).slice(start,end)
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
      console.log(`FILTER sort ${filter.sort} order ${filter.order}` )
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

async function filterChanged(facetID, facetValue) {
   if (facetValue.selected) {
      analytics.trigger('Filters', 'SEARCH_FILTER_SET', `${facetID}:${facetValue.value}`)
   } else {
      analytics.trigger('Filters', 'SEARCH_FILTER_REMOVED', `${facetID}:${facetValue.value}`)
   }
   resultStore.clearSelectedPoolResults()
   routeUtils.filterChanged()
}
</script>
<style lang="scss" scoped>
.facet-sidebar {
   margin: 0px 0px 15px 0px;
   flex: 1 1 25%;
   min-width: 200px;
   display: inline-block;
   height: fit-content;

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
      min-height: 150px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 15px;
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
            .filter-check {
               display: flex;
               flex-flow: row nowrap;  
               justify-content: flex-start;
               align-items: flex-start;
               gap: 10px;
            }
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
.working {
   text-align: center;
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
</style>
