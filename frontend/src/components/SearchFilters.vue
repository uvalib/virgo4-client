<template>
   <div class="filters">
      <div class="filters-head">
         <span>Search Filters</span>
         <span v-if="hasFilter" @click="applyClicked" class="apply">Apply Filters</span>
         <span v-if="hasFilter" @click="clearClicked" class="clear">Clear</span>
         <span v-if="!addingFilter" @click="addClicked" class="add">Add</span>
      </div>
      <template v-if="hasFilter">
         <table>
            <tr class="filter" v-for="(filter,i) in rawFilters" :key="i">
               <td class="label">{{filter.facet}}:</td>
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
         poolIdx: state => state.explorePoolIdx,
         rawFilters: state => state.filters.filters,
      }),
      ...mapGetters({
         hasFilter: 'filters/hasFilter',
         poolFacets: 'filters/poolFacets',
      }),
   },
   methods: {
      formatValues(values) {
         // The values list has objects like {value: value, name: value (count)}. 
         // Only want comma-separated values
         let out = []
         values.forEach( function(vObj) {
            out.push(vObj.value)
         })
         return out.join(", ")
      },
      addClicked(event) {
         event.stopPropagation()
         this.$store.commit("filters/showAdd")
      },
      applyClicked() {

      },
      clearClicked() {
         this.$store.commit("filters/cleaAllFilters")
      },
      removeFilter(_idx) {
          this.$store.commit("filters/removeFilter")
      }
   }
}
</script>

<style scoped>
table {
   margin-left: 15px;
}
table td {
   padding: 2px 5px;
}
td.filter {
   font-weight: 100;
   width: 100%;
}
td.label {
   padding: 0 5px 0 0;
   font-weight: bold;
   vertical-align: text-top;
   text-align: right;
}
.filters {
   background: white;
   color: #666;
   font-size: 0.8em;
   padding: 5px 0 5px 8px;
   margin-top: 5px;
   border-radius: 5px 0 0 0;
}
.filters-head {
   font-weight: bold;
   border-bottom: 1px solid #ccc;
   margin-bottom: 10px;
   padding-bottom: 5px;
}
.no-filter {
   margin-left: 15px;
}
.add, .apply, .clear {
   background: var(--color-primary-blue);
   float: right;
   margin-right: 6px;
   color: white;
   font-size:0.8em;
   padding: 2px 20px;
   border-radius: 5px;
   cursor:pointer;
   opacity: 0.7;
}
.add:hover, .apply:hover, .clear:hover {
   opacity: 1;
}
.add {
   background: var(--color-pale-blue);
}
span.clear {
    background: var(--color-error);
}
.remove-filter {
   padding-right: 10px;
   color: #666;
   opacity: 0.5;
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
