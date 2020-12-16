<template>
   <div class="filters" v-if="hasResults == false">
      <div class="filters-head clearfix">
         <span class="title">Selected Filters</span>
         <V4Button v-if="anyFiltersSet" mode="primary" class="clear-all" @click="clearClicked">Clear All</V4Button>
      </div>
      <template v-if="loadingFilters == false && anyFiltersSet">
         <dl class="filter-display">
            <template v-for="psf in preSearchFilters">
               <template v-if="hasSelections(psf)">
                  <dt :key="psf.value" class="label">{{psf.name}}</dt>
                  <dd :key="`filters-${psf.id}`" class="filter">
                     <template  v-for="sel in selections(psf)">
                        <span :key="sel.value" class="selected">
                           <V4Button mode="icon" class="remove" @click="sel.selected = false"
                              :aria-label="`remove filter #{sel.value}`">
                              <i class="fas fa-times-circle"></i>{{sel.value}}
                           </V4Button>
                        </span>
                     </template>
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

<script>
import { mapState, mapGetters } from "vuex"
export default {
   computed: {
      ...mapGetters({
         hasResults: 'hasResults',
         preSearchFilters: 'filters/preSearchFilters',
      }),
      ...mapState({
         loadingFilters: state => state.filters.updatingFacets,
      }),
      anyFiltersSet() {
         let filters = false
         this.preSearchFilters.some( pf => {
            pf.buckets.some( c => {
               filters = c.selected
               return filters == true
            })
            return filters == true
         })
         return filters
      },
   },
   methods: {
      hasSelections( filter ) {
         let filtered = false
         filter.buckets.some( c => {
            filtered = c.selected
            return filtered == true
         })
         return filtered
      },
      selections( filter ) {
         let out = filter.buckets.filter( c=> c.selected)
         console.log("SEL: "+JSON.stringify(out))
         return out
      },
      async clearClicked() {
         this.preSearchFilters.forEach( pf => {
            let sel = pf.buckets.filter( c => c.selected)
            sel.forEach( fv=>{
               fv.selected = false
            })
         })
      },
   }
}
</script>

<style lang="scss" scoped>
.filters {
   background: white;
   color: var(--uvalib-text);
   padding: 5px 5px 15px 5px;
   margin: 0 0 10px 0;
   border-bottom: 1px solid var(--uvalib-grey-light);
   text-align: left;
   .filters-head {
      font-weight: bold;
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
   }
   .filters-head button.v4-button {
      margin-left: auto;
   }
   .filter-display {
      margin: 0 10px;
      dt {
         font-weight: 500;
      }
      dd {
         font-weight: normal;
         margin: 5px 0 10px 15px;
      }
      .filter-sep {
         margin: 0 8px 0 0;
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
   .no-filter {
      text-align: left;
      margin: 15px 10px;
   }
}

.clearfix::after {
  content: "";
  clear: both;
  display: table;
}
</style>
