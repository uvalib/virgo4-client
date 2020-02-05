<template>
   <div class="filters">
      <template v-if="updatingFacets == false && hasFacets(resultsIdx) == false">
         <div class="no filters-head clearfix">
            <span class="title"><i class="warn fas fa-exclamation-triangle"></i>This source does not support filtering</span>
            <p>Any changes to the Availability filter will have no impact on the results presented below</p>
         </div>
      </template>
      <template v-else>
         <div class="filters-head clearfix">
            <span class="title">Applied Filters</span>
            <span v-if="hasFilter(resultsIdx)" @click="clearClicked" class="clear pure-button pure-button-primary">Clear All</span>
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
      </template>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         updatingFacets: state => state.filters.updatingFacets,
         availabilityFacet: state => state.filters.availabilityFacet,
      }),
      ...mapGetters({
         hasFilter: 'filters/hasFilter',
         allFilters: 'filters/poolFilter',
         selectedResults: 'selectedResults',
         hasFacets: 'filters/hasFacets'
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
   color: var(--uvalib-text);
   padding: 15px 5px;
   margin-top: 5px;
}
.filters-head {
   font-weight: bold;
   border-bottom: 1px solid var(--uvalib-grey-light);
   margin-bottom: 5px;
   padding-bottom: 10px;
}
.no.filters-head  {
   border-bottom: 0;
   margin-bottom: 0;
}
.no.filters-head p {
   font-weight: normal;
   margin: 15px 0 0 10px;
   padding: 0;
}
@media only screen and (max-width: 768px) {
  dl.filter-display {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 8px;
  }
}
@media only screen and (min-width: 768px) {
  dl.filter-display {
    display: grid;
    grid-template-columns: 0.5fr 1fr;
    grid-gap: 8px;
  }
}
.filter-display dt {
   font-weight: bold;
}
.filter-display dd {
  margin-inline-start: 0px;
}
.filter-display {
   margin-left: 10px;
}
.filters-head .title {
   vertical-align: -webkit-baseline-middle;
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
   float: right;
   margin-right: 6px;
   cursor:pointer;
}
.remove-filter {
   padding-right: 10px;
   color: var(--uvalib-text);
   cursor: pointer;
}
.remove-filter:hover {
   opacity: 1;
}
i.warn {
   margin-right: 5px;
   color: var(--uvalib-yellow);
   font-size:1.25em;
}
</style>
