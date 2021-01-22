<template>
   <div class="filters">
      <div class="filters-section">
         <div class="filters-head">
            <span class="title">Applied Filters</span>
            <V4Button v-if="hasFilter || hasNaFilter" mode="primary" class="clear-all" @click="clearClicked">Clear All</V4Button>
         </div>
         <div class="no-filter working" v-if="updatingFacets">
            Working...
         </div>
         <template v-else>
            <dl class="filter-display" v-if="hasFilter">
               <template  v-for="(values, filter) in appliedFilters">
                  <dt :key="filter" class="label" v-show="filter != 'undefined'">{{filter}}</dt>
                  <dd :key="`${filter}-values`" class="label">
                     <span v-for="fv in values" class="selected" :key="fv.value">
                        <V4Button mode="icon" class="remove" @click="removeFilter(fv)"
                           :aria-label="`remove filter #{val}`">
                           <i class="fas fa-times-circle"></i>{{fv.value}}
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

      <div v-if="hasNaFilter && !updatingFacets" class="filters-section">
         <div class="filters-head">
            <span class="title">Not Applicable Filters</span>
         </div>
         <div class="unsupported filter-display" >
            <span v-for="naF in naFilters" class="selected" :key="`${naF.value}`">
               <V4Button mode="icon" class="remove" @click="removeFilter(naF)"
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
         let out = []
         this.allFilters(this.selectedResults.pool.id).filter(pf => pf.na === true).forEach(pf=>{
            let val = pf.value
            out.push( {facet_id: pf.facet_id, value: val} )
         })
         return out
      },
      hasFilter() {
         return this.allFilters(this.selectedResults.pool.id).filter(pf => pf.na != true).length > 0
      },
      hasNaFilter() {
         return this.allFilters(this.selectedResults.pool.id).filter(pf => pf.na === true).length > 0
      },
      appliedFilters() {
         // display is grouped by facet, raw data is just a series of
         // facet_id/value pairs. Convert to display
         let out = {}
         this.allFilters(this.selectedResults.pool.id).filter(pf => pf.na != true).forEach(pf=>{
            let val = pf.value
            let facetName = pf.facet_name
            if ( Object.prototype.hasOwnProperty.call(out, facetName) == false ) {
               out[facetName] = []
            }
            out[facetName].push( {facet_id: pf.facet_id, value: val} )
         })
         return out
      },
   },
   methods: {
      removeFilter( filter ) {
         this.userSearched = true
         let query = Object.assign({}, this.$route.query)
         delete query.page
         delete query.filter
         let data = {}

         data = {pool: this.selectedResults.pool.id, facetID: filter.facet_id, value: filter.value}
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
