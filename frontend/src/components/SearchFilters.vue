<template>
   <div class="filters"  v-if="hasFacets">
      <div class="filters-head clearfix">
         <span class="title">Applied Filters</span>
         <V4Button v-if="hasFilter" mode="primary" class="clear-all" @click="clearClicked">Clear All</V4Button>
      </div>
      <template v-if="hasFilter">
         <dl class="filter-display">
            <template v-for="(values,filter, idx) in displayFilter">
               <template v-if="filter != 'undefined'">
                  <dt :key="filter" class="label">{{filter}}:</dt>
                  <dd :key="idx" class="filter">{{formatValues(values)}}</dd>
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
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapState({
         updatingFacets: state => state.filters.updatingFacets,
         availabilityFacet: state => state.filters.availabilityFacet,
      }),
      ...mapGetters({
         allFilters: 'filters/poolFilter',
         selectedResults: 'selectedResults',
         facetSupport: 'pools/facetSupport'
      }),
      hasFilter() {
         return this.allFilters(this.selectedResults.pool.id).length > 0
      },
      hasFacets() {
         return this.facetSupport(this.selectedResults.pool.id)
      },
      total() {
         return this.selectedResults.total
      },
      displayFilter() {
         // display is grouped by facet, raw data is just a series of
         // facet_id/value pairs. Convert to display
         let out = {}
         this.allFilters(this.selectedResults.pool.id).forEach(pf=>{
            let val = pf.value
            if (pf.facet_id == "FacetCirculating") {
               val = "Yes"
            }
            if ( Object.prototype.hasOwnProperty.call(out, pf.facet_name) == false ) {
               out[pf.facet_name] = [val]
            } else {
               out[pf.facet_name].push(val)
            }
         })
         return out
      }
   },
   methods: {
      formatValues(values) {
         let out = values.join(", ")
         if (out == "On shelf") {
            out = "On Shelf Now"
         }
         return out
      },
      clearClicked() {
         this.$store.commit("filters/resetPoolFilters", this.selectedResults.pool.id)
         let query = Object.assign({}, this.$route.query)
         delete query.filter
         this.$router.push({ query })
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
   padding: 5px 5px 10px 5px;
   margin-top: 5px;
}
.filters-head {
   font-weight: bold;
   border-bottom: 1px solid var(--uvalib-grey-light);
   margin-bottom: 5px;
   padding-bottom: 10px;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
}
.filters-head button.v4-button {
   margin-left: auto;
}
.no.filters-head  {
   border-bottom: 0;
   font-weight: normal;
   margin: 0;
   padding: 0;
   font-size: 0.9em;
   text-align: center;
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
    grid-template-columns: 0.3fr 1fr;
    grid-gap: 2px;
  }
}
.filter-display dt {
   font-weight: bold;
}
.filter-display dd {
  margin-inline-start: 0px;
  align-self: center;
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
}
</style>
