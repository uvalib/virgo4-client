<template>
   <div class="filters" v-if="resultStore.hasResults == false && !resultStore.searching">
      <div class="filters-head clearfix">
         <span class="title">Selected Filters</span>
         <FormKit v-if="anyFiltersSet" type="button" @click="clearClicked">Clear all</FormKit>
      </div>
      <template v-if="filters.getPresearchFacets == false && anyFiltersSet">
         <dl class="filter-display">
            <template v-for="psf in filters.preSearchFilters">
               <template v-if="hasSelections(psf)">
                  <dt :key="psf.value" class="label">{{psf.name}}:</dt>
                  <dd :key="`filters-${psf.id}`" class="filter">
                     <span  v-for="(sel,idx) in selections(psf)" :key="sel.value" class="selected">
                        <span v-if="idx > 0" class="sep">,</span>
                        <span class="filter">{{sel.value}}</span>
                     </span>
                  </dd>
               </template>
            </template>
         </dl>
      </template>
      <div v-else class="no-filter">
         <span>None</span>
      </div>
   </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import analytics from '@/analytics'

const resultStore = useResultStore()
const filters = useFilterStore()

const anyFiltersSet = computed(()=>{
   let filterSet = false
   filters.preSearchFilters.some( pf => {
      pf.buckets.some( c => {
         filterSet = c.selected
         return filterSet == true
      })
      return filterSet == true
   })
   return filterSet
})

function hasSelections( filter ) {
   let filtered = false
   filter.buckets.some( c => {
      filtered = c.selected
      return filtered == true
   })
   return filtered
}
function selections( filter ) {
   let out = filter.buckets.filter( c=> c.selected)
   return out
}
async function clearClicked() {
   analytics.trigger('AdvancedSearch', 'CLEAR_ALL_FILTERS', "")
   filters.preSearchFilters.forEach( pf => {
      let sel = pf.buckets.filter( c => c.selected)
      sel.forEach( fv=>{
         fv.selected = false
      })
   })
}
</script>

<style lang="scss" scoped>
.filters {
   background: white;
   color: var(--uvalib-text);
   padding: 20px 5px 15px 5px;
   margin: 25px 0 10px 0;
   border-bottom: 1px solid var(--uvalib-grey-light);
   border-top: 1px solid var(--uvalib-grey-light);
   text-align: left;
   .filters-head {
      font-weight: bold;
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      justify-content: space-between;
   }
   .filters-head {
      :deep(.v4-form-input) {
         margin-left: auto;
      }
   }
   .filter-display {
      margin: 0;
      dt {
         font-weight: 500;
      }
      dd {
         font-weight: normal;
         margin: 5px 0 20px 25px;
      }
      .sep {
         margin-right: 8px;
      }
   }
   .no-filter {
      text-align: left;
      margin: 15px 10px;
   }
}
</style>
