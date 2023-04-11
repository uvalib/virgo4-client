<template>
   <div class="filters" aria-live="polite">
      <div class="working" v-if="filters.updatingFacets" aria-hidden="true">
         Loading filters...
      </div>
      <template v-else>
         <div class="filters-section">
            <div class="filters-head">
               <span class="title">Applied Filters</span>
               <V4Button v-if="hasFilter || hasNaFilter" mode="primary" class="clear-all" @click="clearClicked">Clear All</V4Button>
            </div>
            <dl class="filter-display" v-if="hasFilter">
               <template  v-for="(values, filter) in appliedFilters" :key="`${filter}-values`">
                  <dt class="label" v-show="filter != 'undefined'">{{filter}}</dt>
                  <dd class="label">
                     <span v-for="fv in values" class="selected" :key="`${filter}-${fv.value}`">
                        <V4Button mode="icon" class="remove" @click="removeFilter(fv)" :aria-label="`remove filter ${fv.value}`">
                           <i class="fas fa-times-circle"></i>
                           <span aria-hidden="true">{{fv.value}}</span>
                        </V4Button>
                     </span>
                  </dd>
               </template>
            </dl>
            <div v-else class="no-filter">
               <span>None</span>
            </div>
         </div>
         <div v-if="hasNaFilter" class="filters-section">
            <div class="filters-head">
               <span class="title">Not Applicable Filters</span>
            </div>
            <div class="unsupported filter-display" >
               <span v-for="naF in naFilters" class="selected" :key="`na-${naF.value}`">
                  <V4Button mode="icon" class="remove" @click="removeFilter(naF)"
                     :aria-label="`remove filter ${naF.value}`">
                     <i class="fas fa-times-circle"></i>
                     <span aria-hidden="true">{{naF.value}}</span>
                  </V4Button>
               </span>
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

const route = useRoute()
const router = useRouter()
const resultStore = useResultStore()
const filters = useFilterStore()
const queryStore = useQueryStore()

const naFilters = computed(()=>{
   let out = []
   filters.poolFilter(resultStore.selectedResults.pool.id).filter(pf => pf.na === true).forEach(pf=>{
      let val = pf.value
      out.push( {facet_id: pf.facet_id, value: val} )
   })
   return out
})
const hasFilter = computed(()=>{
   return filters.poolFilter(resultStore.selectedResults.pool.id).filter(pf => pf.na != true).length > 0
})
const hasNaFilter = computed(()=>{
   return filters.poolFilter(resultStore.selectedResults.pool.id).filter(pf => pf.na === true).length > 0
})
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
   queryStore.userSearched = true
   let query = Object.assign({}, route.query)
   delete query.page
   delete query.filter
   filters.toggleFilter(resultStore.selectedResults.pool.id, filter.facet_id, filter.value)
   resultStore.clearSelectedPoolResults()
   let fqp = filters.asQueryParam( resultStore.selectedResults.pool.id )
   if (fqp) {
      query.filter = fqp
   }
   router.push({ query })
}

async function clearClicked() {
   analytics.trigger('Results', 'CLEAR_ALL_FILTERS', queryStore.mode)
   filters.resetPoolFilters(resultStore.selectedResults.pool.id)
   let query = Object.assign({}, route.query)
   delete query.filter
   queryStore.userSearched = true
   router.push({ query })
}
</script>

<style lang="scss" scoped>
.filters {
   background: white;
   color: var(--uvalib-text);
   padding: 5px 5px 10px 5px;
   margin-top: 5px;
   .working {
      padding: 10px 20px;
   }
}
.filters-section {
   padding-bottom: 0px;
   .filters-head {
      font-weight: bold;
      margin: 0;
      padding: 0;
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      button.v4-button {
         margin-left: auto;
      }
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
      margin: 0 20px;
      font-size: 0.9em;
      dt {
         font-weight: 500;
      }
      dd {
         font-weight: normal;
         margin: 5px 0 10px 20px;
      }
      .v4-button.remove {
         border: 1px solid var(--uvalib-grey-light);
         padding: 2px 15px 2px 3px;
         border-radius: 10px;
         margin-right: 10px;
         cursor: pointer;
         i {
            margin-right: 10px;
            color: var(--uvalib-red);
         }
         &:hover {
            border: 1px solid var(--uvalib-grey);
            text-decoration: underline;
         }
      }
   }
}
</style>
