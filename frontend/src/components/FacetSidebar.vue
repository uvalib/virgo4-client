<template>
   <section class="facet-sidebar" :class="{overlay: !startExpanded}" role="group">
      <AccordionContent id="pool-filter" class="filter"
         :background=colors.brandBlue
         color="white" :expanded="startExpanded"
         :borderColor=colors.brandBlue
         :invert="!startExpanded">
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
            <dl v-else="filterStore.updatingFacets == false">
               <template v-for="facetInfo in facets" :key="facetInfo.id">
                  <dt :id="facetInfo.id">{{facetInfo.name}}</dt>
                  <div role="group" :aria-labelledby="facetInfo.id">
                     <dd v-for="(fv,idx) in facetValues(facetInfo,0,5)"  :key="valueKey(idx, facetInfo.id)">
                        <Checkbox  v-model="fv.selected" :inputId="`${facetInfo.id}-${fv.value}`" :binary="true" @update:modelValue="filterChanged(facetInfo.id, fv)"/>
                        <label :for="`${facetInfo.id}-${fv.value}`" class="cb-label">{{fv.value}}</label>
                        <span class="cnt" v-if="$formatNum(fv.count)">({{$formatNum(fv.count)}})</span>
                     </dd>
                     <dd v-if="facetValuesCount(facetInfo) > 5" :key="`more${facetInfo.id}`">
                        <AccordionContent class="more" :id="`${facetInfo.id}-more`" borderWidth="0">
                           <template v-slot:title>
                              <span :aria-label="`see more ${facetInfo.name} filters`">See More</span>
                           </template>
                           <div class="expanded-item" v-for="(fv,idx) in facetValues(facetInfo,5)" :key="valueKey(idx, facetInfo.id)">
                              <Checkbox  v-model="fv.selected" :inputId="`${facetInfo.id}-${fv.value}`" :binary="true" @update:modelValue="filterChanged(facetInfo.id, fv)"/>
                              <label :for="`${facetInfo.id}-${fv.value}`" class="cb-label">{{fv.value}}</label>
                              <span class="cnt">({{$formatNum(fv.count)}})</span>
                           </div>
                           <template v-slot:footer>
                              <span :aria-label="`see less ${facetInfo.name} filters`"><b>See Less</b></span>
                           </template>
                        </AccordionContent>
                     </dd>
                  </div>
               </template>
            </dl>
         </div>
      </AccordionContent>
   </section>
</template>

<script setup>
import AccordionContent from "@/components/AccordionContent.vue"
import Checkbox from 'primevue/checkbox'
import { computed } from 'vue'
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

const hasFacets = computed(()=>{
   return poolStore.facetSupport(resultStore.selectedResults.pool.id)
})

const startExpanded = computed(()=>{
   return width.value > 810
})
const poolFilterTitle = computed(()=>{
   if ( !startExpanded.value ) {
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
      padding: 0;
      margin: 0;
      background: white;
      position: relative;
      min-height: 150px;
      padding: 5px 15px 15px 15px;
      span.cnt {
         margin-left: 5px;
         margin-left: auto;
         font-size: 0.8em;
      }
   }
}
div.no-facets {
   text-align: center;
   margin:25px 5px;
   font-size: 1.25em;
}
dl  {
   margin: 0;
}
dt {
   font-weight: bold;
   margin: 10px 0 5px 0;
}
.group {
   margin-bottom: 20px;
}
dd {
   cursor: pointer;
   font-size: 1em;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   padding: 3px 2px;
   margin-left: 15px;
   font-weight: normal;
   gap: 15px;
}
.working {
   text-align: center;
}
.expanded-item {
   padding: 3px 0;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   font-weight: normal;
   gap: 15px;
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
:deep(.accordion.more) {
   width: 100%;
   .title, .footer {
      padding: 5px 0;
      font-weight: bold;
   }
}
</style>
