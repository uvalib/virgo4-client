<template>
   <div class="filters" aria-live="polite">
      <div class="filters-head">Applied Filters</div>
      <div class="filter-display">
         <button v-if="queryStore.dateFilter" class="remove" @click="removeDateFilter" :aria-label="`remove date filter`">
            <i class="fas fa-times-circle"></i>
            <span aria-hidden="true">{{ dateFilterLabel }}</span>
         </button>
         <template  v-for="filter in appliedFilters" :key="`${filter}-values`">
            <button class="remove" @click="removeFilter(filter)" :aria-label="`remove filter ${filter.value}`">
               <i class="fas fa-times-circle"></i>
               <span v-if="filter.facet_name" aria-hidden="true">{{filter.facet_name}}: {{filter.value}}</span>
               <span v-else aria-hidden="true">{{filter.value}}</span>
            </button>
         </template>
         <VirgoButton @click="clearClicked" label="Clear Applied Filters" severity="secondary" size="small"/>
      </div>
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

const hasFilter = computed(()=>{
   return filters.poolFilter(resultStore.selectedResults.pool.id).length > 0
})
const appliedFilters = computed(()=>{
   return filters.poolFilter(resultStore.selectedResults.pool.id)
})

const dateFilterLabel = computed(()=>{
   let label = "Date Published: "
   const df = queryStore.dateFilter
   //{startDate: startDate, comparison: comparison, endDate: endDate} 
   if ( df.comparison == "EQUAL" ) {
      label +=  df.startDate
   } else  if ( df.comparison == "BEFORE" ) {
       label += `before ${df.startDate}`
   } else  if ( df.comparison == "AFTER" ) {
       label += `after ${df.startDate}`
   } else {
       label += `${df.startDate} to ${df.endDate}`
   }
   return label
})

function removeFilter( filter ) {
   filters.toggleFilter(resultStore.selectedResults.pool.id, filter.facet_id, filter.value)
   routeUtils.filterChanged()
}

const removeDateFilter = (() => {
   queryStore.removeDateFilter( resultStore.selectedResults.pool.id )
   queryStore.userSearched = true
   routeUtils.searchChanged()
})


function clearClicked() {
   analytics.trigger('Results', 'CLEAR_ALL_FILTERS', queryStore.mode)
   queryStore.removeDateFilter( resultStore.selectedResults.pool.id )
   filters.resetPoolFilters(resultStore.selectedResults.pool.id)

   // this action changes filters and serach so need to flag both.
   // the routeUtils will catch this flag and update the URL 
   // to remove the filters and perform the search correctly
   queryStore.userSearched = true
   queryStore.filtersCleared = true
   routeUtils.searchChanged()
}
</script>

<style lang="scss" scoped>
.filters {
   background: white;
   color: $uva-text-color-dark;
   padding-bottom: 15px;
   border-bottom: 1px solid $uva-grey-100;
   margin-bottom: 5px;

   .filters-head {
      margin-bottom: 10px;
      padding: 0;
   }

   .filter-display {
      display: flex;
      flex-direction: column;
      gap: 5px;
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
</style>
