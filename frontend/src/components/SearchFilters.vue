<template>
   <div class="filters"  v-if="hasFacets">
      <div class="filters-section">
         <div class="filters-head">
            <span class="title">Applied Filters</span>
            <V4Button v-if="hasFilter || hasNaFilters" mode="primary" class="clear-all" @click="clearClicked">Clear All</V4Button>
         </div>
         <div class="no-filter working" v-if="updatingFacets">
            Working...
         </div>
         <template v-else>
            <dl class="filter-display" v-if="hasFilter">
               <template  v-for="(values, filter) in appliedFilters">
                  <dt :key="filter" class="label" v-show="filter != 'undefined'">{{filter}}</dt>
                  <dd :key="`${filter}-values`" class="label">
                     <span v-for="val in values" class="selected" :key="val.filter">
                        <V4Button mode="icon" class="remove" @click="removeFilter(val)"
                           :aria-label="`remove filter #{val}`">
                           <i class="fas fa-times-circle"></i>{{val.filter}}
                        </V4Button>
                     </span>
                  </dd>
               </template>
            </dl>
            <div v-else class="no-filter">
               <span>None</span>
            </div>
         </template>
      </div>

      <div v-if="naFilters.length>0 && !updatingFacets" class="filters-section">
         <div class="filters-head">
            <span class="title">Not Applicable Filters</span>
         </div>
         <div class="unsupported filter-display" >
            <span v-for="naF in naFilters" class="selected" :key="`${naF.value}`">
               <V4Button mode="icon" class="remove" @click="removeFilter({facet:'NotApplicable', filter: naF.value})"
                  :aria-label="`remove filter #{naf.value}`">
                  <i class="fas fa-times-circle"></i>{{naF.value}}
               </V4Button>
            </span>
         </div>
      </div>


   </div>
</template>

<script>
import { mapGetters, mapState } from "vuex"
import { mapFields } from "vuex-map-fields"
export default {
   computed: {
      ...mapGetters({
         allFilters: 'filters/poolFilter',
         notApplicableFilters: 'filters/notApplicableFilters',
         selectedResults: 'selectedResults',
         facetSupport: 'pools/facetSupport',
         filterQueryParam: 'filters/asQueryParam',
      }),
      ...mapState({
         updatingFacets: state => state.filters.updatingFacets,
      }),
      ...mapFields({
        userSearched: 'query.userSearched',
      }),
      naFilters() {
         return this.notApplicableFilters(this.selectedResults.pool.id)
      },
      formatNAFilters() {
         return this.naFilters.join(", ")
      },
      hasFilter() {
         return (this.allFilters(this.selectedResults.pool.id).length > 0)
      },
      appliedFilters() {
         // display is grouped by facet, raw data is just a series of
         // facet_id/value pairs. Convert to display
         let out = {}
         this.allFilters(this.selectedResults.pool.id).forEach(pf=>{
            let val = pf.value
            let facetName = pf.facet_name
            if ( Object.prototype.hasOwnProperty.call(out, facetName) == false ) {
               out[facetName] = []
            }
            out[facetName].push( {facet: pf.facet_id, filter: val} )
         })
         return out
      },
      hasNaFilters() {
         return this.naFilters.length > 0
      },
      hasFacets() {
         return this.facetSupport(this.selectedResults.pool.id)
      },
      total() {
         return this.selectedResults.total
      },
   },
   methods: {
      removeFilter( value) {
         this.userSearched = true
         let query = Object.assign({}, this.$route.query)
         delete query.page
         delete query.filter
         let data = {}

         data = {pool: this.selectedResults.pool.id, facetID: value.facet, value: value.filter}
         this.$store.commit("filters/toggleFilter", data)
         this.$store.commit("clearSelectedPoolResults")
         let fqp = this.filterQueryParam( this.selectedResults.pool.id )
         if (fqp) {
            query.filter = fqp
         }
         this.$router.push({ query })
      },

      async clearClicked() {
         this.$store.commit("filters/resetPoolFilters", this.selectedResults.pool.id)
         let query = Object.assign({}, this.$route.query)
         delete query.filter
         this.userSearched = true
         this.$router.push({ query })
      },
   }
}
</script>

<style lang="scss" scoped>
.filters {
   background: white;
   color: var(--uvalib-text);
   padding: 5px 5px 10px 5px;
   margin-top: 5px;
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
}
</style>
