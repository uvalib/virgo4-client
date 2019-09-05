<template>
   <div class="filters">
      <div class="filters-head clearfix">
         <span class="title">Search Filters</span>
         <span v-if="hasFilter(poolIdx)" @click="clearClicked" class="clear">Clear</span>
         <span v-if="!addingFilter" @click="addClicked" 
            v-bind:class="{disabled: total==0}" class="add">Add</span>
      </div>
      <template v-if="hasFilter(poolIdx)">
         <table>
            <tr class="filter" v-for="(filter,i) in poolFilter(poolIdx, 'raw')" :key="i">
               <td class="label">{{filter.facet.name}}:</td>
               <td class="filter">{{formatValues(filter.values)}}</td>
               <td class="label"><i @click="removeFilter(i)" class="remove-filter fas fa-trash-alt"></i></td>
            </tr>
         </table>
      </template>
      <div v-else class="no-filter">
         <span>None</span>
      </div>
      <AddFilter v-if="addingFilter"/>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"   
import AddFilter from '@/components/AddFilter'
export default {
   components: {
      AddFilter
   },
   computed: {
      ...mapState({
         addingFilter: state => state.filters.adding,
         poolIdx: state => state.selectedResultsIdx,
      }),
      ...mapGetters({
         hasFilter: 'filters/hasFilter',
         poolFacets: 'filters/poolFacets',
         poolFilter: 'filters/poolFilter',
         selectedResults: 'selectedResults',
      }),
      total() {
         return this.selectedResults.total
      }
   },
   methods: {
      formatValues(values) {
         return values.join(", ")
      },
      addClicked() {
         if ( this.total > 0) {
            this.$store.commit("filters/showAdd")
         }
      },
      clearClicked() {
         this.$store.commit("filters/clearAllFilters", this.poolIdx)
         this.$store.commit("clearSelectedPoolResults")
         this.$store.dispatch("searchSelectedPool")
      },
      removeFilter(idx) {
         this.$store.commit("filters/removeFilter", {poolResultsIdx: this.poolIdx, filterIdx: idx})
         this.$store.commit("clearSelectedPoolResults")
         this.$store.dispatch("searchSelectedPool")
      }
   }
}
</script>

<style scoped>
table {
   margin-left: 15px;
}
table td {
   padding: 4px 5px 0 0;
}
td.filter {
   font-weight: 500;
   width: 100%;
}
td.label {
   font-weight: bold;
   text-align: right;
}
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
.add, .clear {
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
.add.disabled {
   opacity: 0.5;
   cursor: default;
}
.add:hover, .apply:hover, .clear:hover {
   opacity: 1;
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
.slide-enter-active {
   transition: all 0.1s ease;
}

.slide-leave-active {
  transition: all 0.1s ease;
}

.slide-enter-to, .slide-leave {
   max-height: auto;
   overflow: hidden;
}

.slide-enter, .slide-leave-to {
   overflow: hidden;
   max-height: 0;
}
</style>
