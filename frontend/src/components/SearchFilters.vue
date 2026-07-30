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
               <template  v-for="filter in appliedFilters" :key="`${filter}-values`">
                  <button class="remove" @click="removeFilter(filter.value)" :aria-label="`remove filter ${filter.value}`">
                     <i class="fas fa-times-circle"></i>
                     <span v-if="filter.name" aria-hidden="true">{{filter.name}}: {{filter.value}}</span>
                     <span v-else aria-hidden="true">{{filter.value}}</span>
                  </button>
               </template>
            </div>
            <div v-else class="no-filter">
               <span>None</span>
            </div>
         </div>
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

const hasFilter = computed(()=>{
   return filters.poolFilter(resultStore.selectedResults.pool.id).length > 0
})
const appliedFilters = computed(()=>{
   return filters.poolFilter(resultStore.selectedResults.pool.id)
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
