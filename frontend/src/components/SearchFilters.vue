<template>
   <div class="filters">
      <div class="filters-head clearfix">
         <span class="title">Applied Filters</span>
         <span v-if="hasFilter(resultsIdx)" @click="clearClicked" class="clear">Clear All</span>
      </div>
      <template v-if="hasFilter(resultsIdx)">
         <dl class="filter-display">
            <template v-for="(values,filter, idx) in displayFilter">
               <dt :key="filter" class="label">{{filter}}:</dt>
               <dd :key="idx" class="filter">{{formatValues(values)}}</dd>
            </template>
         </dl>
      </template> 
      <div v-else class="no-filter">
         <span>None</span>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         availabilityFacet: state => state.filters.availabilityFacet,
      }),
      ...mapGetters({
         hasFilter: 'filters/hasFilter',
         allFilters: 'filters/poolFilter',
         selectedResults: 'selectedResults',
      }),
      total() {
         return this.selectedResults.total
      },
      displayFilter() {
         // display is grouped by facet, raw data is just a series of 
         // facet_id/value pairs. Convert to display
         let out = {}
         this.allFilters(this.resultsIdx).forEach(pf=>{
            if ( Object.prototype.hasOwnProperty.call(out, pf.facet_name) == false ) {
               out[pf.facet_name] = [pf.value]
            } else {
               out[pf.facet_name].push(pf.value)
            }
         })
         return out
      }
   },
   methods: {
      formatValues(values) {
         return values.join(", ")
      },
      clearClicked() {
         this.$store.commit("filters/reset", this.resultsIdx)
         this.$store.commit("clearSelectedPoolResults")
         this.$store.dispatch("searchSelectedPool")
      },
   }
}
</script>

<style scoped>
.filters {
   background: white;
   color: #666;
   font-size: 0.8em;
   padding: 5px 0;
   margin-top: 5px;
}
.filters-head {
   font-weight: bold;
   border-bottom: 1px solid #ccc;
   margin-bottom: 5px;
   padding-bottom: 5px;
}
dt {
   font-weight: bold;
}
.filter-display {
   margin-left: 10px;
   font-size: 0.9em;
}
.filters-head .title {
   vertical-align: -webkit-baseline-middle;
   font-size: 1.1em;
   padding-left: 10px;
}
.no-filter {
   margin-left: 15px;
}
.clearfix::after {
  content: "";
  clear: both;
  display: table;
}
.clear {
   background: var(--color-primary-blue);
   float: right;
   margin-right: 6px;
   color: white;
   font-size:0.9em;
   padding: 5px 20px;
   border-radius: 5px;
   cursor:pointer;
   opacity: 0.9;
}
.remove-filter {
   padding-right: 10px;
   color: #666;
   opacity: 0.5;
   font-size: 1.25em;
   cursor: pointer;
}
.remove-filter:hover {
   opacity: 1;
}
</style>
