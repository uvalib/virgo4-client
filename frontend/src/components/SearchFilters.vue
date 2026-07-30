<template>
   <div class="filters" aria-live="polite">
      <div class="working" v-if="filters.updatingFacets" aria-hidden="true">
         Loading filters...
      </div>
      <template v-else>
         <div class="filters-section">
            <div class="filters-head">
               <span class="title">Applied Filters</span>
               <VirgoButton v-if="hasFilter" @click="clearClicked" label="Clear Applied Filters" severity="secondary" size="small"/>
            </div>
            <div class="filter-display" v-if="hasFilter">
               <template  v-for="(values, filter) in appliedFilters" :key="`${filter}-values`">
                     <template v-for="fv in values" :key="`${filter}-${fv.value}`">
                        <button class="remove" @click="removeFilter(fv)" :aria-label="`remove filter ${fv.value}`">
                           <i class="fas fa-times-circle"></i>
                           <span aria-hidden="true">{{filter}}: {{fv.value}}</span>
                        </button>
                     </template>
               </template>
            </div>
            <div v-else class="no-filter">
               <span>None</span>
            </div>
         </div>
         <!-- <div v-if="hasNaFilter" class="filters-section">
            <div class="filters-head">
               <span class="title">Not Applicable Filters</span>
            </div>
            <div class="unsupported filter-display" >
               <span v-for="naF in naFilters" class="selected" :key="`na-${naF.value}`">
                  <VirgoButton class="remove" @click="removeFilter(naF)" :aria-label="`remove filter ${naF.value}`">
                     <i class="fas fa-times-circle"></i>
                     <span aria-hidden="true">{{naF.value}}</span>
                  </VirgoButton>
               </span>
            </div>
         </div> -->
      </template>
   </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useQueryStore } from "@/stores/query"
import analytics from '@/analytics'
import { useRouteUtils } from '@/composables/routeutils'

const route = useRoute()
const router = useRouter()
const routeUtils = useRouteUtils(router, route)
const resultStore = useResultStore()
const filters = useFilterStore()
const queryStore = useQueryStore()

// const naFilters = computed(()=>{
//    let out = []
//    filters.poolFilter(resultStore.selectedResults.pool.id).filter(pf => pf.na === true).forEach(pf=>{
//       let val = pf.value
//       out.push( {facet_id: pf.facet_id, value: val} )
//    })
//    return out
// })
const hasFilter = computed(()=>{
   return filters.poolFilter(resultStore.selectedResults.pool.id).filter(pf => pf.na != true).length > 0
})
// const hasNaFilter = computed(()=>{
//    return filters.poolFilter(resultStore.selectedResults.pool.id).filter(pf => pf.na === true).length > 0
// })
const appliedFilters = computed(()=>{
   // display is grouped by facet, raw data is just a series of
   // facet_id/value pairs. Convert to display
   let out = {}
   filters.poolFilter(resultStore.selectedResults.pool.id).filter(pf => pf.na != true).forEach(pf=>{
      let val = pf.value
      let facetName = pf.facet_name
      if ( Object.prototype.hasOwnProperty.call(out, facetName) == false ) {
         out[facetName] = []
      }
      out[facetName].push( {facet_id: pf.facet_id, value: val} )
   })
   return out
})

function removeFilter( filter ) {
   filters.toggleFilter(resultStore.selectedResults.pool.id, filter.facet_id, filter.value)
   routeUtils.filterChanged()
}

async function clearClicked() {
   analytics.trigger('Results', 'CLEAR_ALL_FILTERS', queryStore.mode)
   filters.resetPoolFilters(resultStore.selectedResults.pool.id)
   routeUtils.filterChanged()
}
</script>

<style lang="scss" scoped>
.filters {
   background: white;
   color: $uva-text-color-dark;
   padding: 10px;
   border-left: 1px solid $uva-grey-100;
   border-right: 1px solid $uva-grey-100;
   .working {
      padding: 10px 20px;
   }
}
.filters-section {
   padding-bottom: 0px;
   .filters-head {
      font-weight: bold;
      margin: 0 0 10px 0;
      padding: 0;
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      justify-content: space-between;

      .title {
         vertical-align: -webkit-baseline-middle;
         padding: 5px 10px;
      }
   }
   .no-filter {
      margin: 5px 0 5px 30px;
      display: block;
   }
   .filter-display {
      margin: 0 0 0 10px;
      display: flex;
      flex-flow: row wrap;
      gap: 5px;
      button.remove {
         border: 1px solid $uva-grey-100;
         padding: 4px 15px 4px 4px;
         border-radius: 0.3rem;
         margin: 0px;
         background: white;
         color: $uva-text-color-dark;
         cursor: pointer;
         span {
            white-space: nowrap;
         }
         i {
            margin: 1px 10px 0 0;
            color: $uva-red;
         }
         &:hover {
            background: $uva-grey-200;
         }
      }
   }
}
</style>
