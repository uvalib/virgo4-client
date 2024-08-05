<template>
   <section class="facet-sidebar" :class="{overlay: !startExpanded}" role="group">
      <AccordionContent id="pool-filter" class="filter"
         :background="filterColor"
         color="white" :expanded="startExpanded"
         borderColor="var(--uvalib-brand-blue)"
         :invert="!startExpanded">
         <template v-slot:title>{{poolFilterTitle}}</template>

         <div v-if="!hasFacets" class="no-facets">
            {{resultStore.selectedResults.pool.name}} does not support filtering
         </div>
         <div v-else class="body">
            <div v-if="filterStore.updatingFacets" class="working">
               <V4Spinner message="Loading filters..."/>
            </div>
            <div v-if="facets.length == 0" class="no-facets">
               Filters are not available for this search
            </div>
            <dl v-else-if="filterStore.updatingFacets == false">
               <template v-for="facetInfo in facets" :key="facetInfo.id">
                  <dt :id="facetInfo.id">{{facetInfo.name}}</dt>
                  <div role="group" :aria-labelledby="facetInfo.id">
                     <dd v-for="(fv,idx) in facetValues(facetInfo,0,5)"  :key="valueKey(idx, facetInfo.id)">
                        <Checkbox  v-model="fv.selected" :inputId="`${facetInfo.id}-${fv.value}`" :binary="true" @change="filterChanged"/>
                        <label :for="`${facetInfo.id}-${fv.value}`" class="cb-label">{{fv.value}}</label>
                        <span class="cnt" v-if="$formatNum(fv.count)">({{$formatNum(fv.count)}})</span>
                     </dd>
                     <dd v-if="facetValuesCount(facetInfo) > 5" :key="`more${facetInfo.id}`">
                        <AccordionContent class="more" :id="`${facetInfo.id}-more`" borderWidth="0">
                           <template v-slot:title>
                              <span :aria-label="`see more ${facetInfo.name} filters`">See More</span>
                           </template>
                           <div class="expanded-item" v-for="(fv,idx) in facetValues(facetInfo,5)" :key="valueKey(idx, facetInfo.id)">
                              <Checkbox  v-model="fv.selected" :inputId="`${facetInfo.id}-${fv.value}`" :binary="true" @change="filterChanged"/>
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
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useSystemStore } from "@/stores/system"
import { usePoolStore } from "@/stores/pool"
import { useRouter, useRoute } from 'vue-router'

const route = useRoute()
const router = useRouter()
const queryStore = useQueryStore()
const resultStore = useResultStore()
const filterStore = useFilterStore()
const system = useSystemStore()
const poolStore = usePoolStore()

const hasFacets = computed(()=>{
   return poolStore.facetSupport(resultStore.selectedResults.pool.id)
})
const filterColor = computed(()=>{
   if ( !startExpanded.value ) {
      return "var(--uvalib-brand-blue)"
   }
   return "var(--uvalib-brand-blue)"
})
const startExpanded = computed(()=>{
   return system.displayWidth > 810
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
function addFilterToURL() {
   // changing the filter resetes paging
   let query = Object.assign({}, route.query)
   delete query.page
   let fqp = filterStore.asQueryParam( resultStore.selectedResults.pool.id )
   if (fqp.length == 0) {
      delete query.filter
   } else if ( route.query.filter != fqp ) {
      query.filter = fqp
   }
   router.push({ query })
}
async function filterChanged() {
   resultStore.clearSelectedPoolResults()
   queryStore.userSearched = true
   addFilterToURL()
}
</script>
<style lang="scss" scoped>
.facet-sidebar {
   margin: 0px 0px 15px 0px;
   border-radius: 5px 5px 0 0;
   flex: 1 1 25%;
   min-width: 200px;
   display: inline-block;
   box-shadow: var(--uvalib-box-shadow);
   height: fit-content;

   .pool-filter-header, .filter {
      width: 100%;
   }
   .body {
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
   color: var(--uvalib-text);
}
dl  {
   margin: 0;
   color: var(--uvalib-text-dark);
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
i.check {
   color: var(--uvalib-text);
   font-size: 1.2em;
}
.working {
   color: var(--uvalib-text);
   text-align: center;
   background: white;
   position: absolute;
   left: 0;
   right: 0;
   padding: 25px 15px;
   bottom: 0;
   top: 0;
   font-size: 1.25em;
   font-weight: bold;
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
