<template>
   <div class="add-filter clearfix pure-form">
      <p>Add a Filter</p>
      <div class="add-contents">
         <table class="settings">
            <tr>
               <td class="label">Facet:</td>
               <td class="sel">
                  <select v-model="selectedFacet" @change="facetChosen" class="facets">
                     <option value="">Select a facet</option>
                     <option v-for="(facet) in poolFacets(resultsIdx)" 
                        :key="facet.id" :value="facet.id ">
                        {{ facet.name }}
                     </option>
                  </select>
               </td>
            </tr>
            <tr>
               <td class="label">Value:</td>
               <td class="sel">
                  <template v-if="selectedFacet && !updatingFacets">
                     <multiselect v-model="facetValues" class="buckets"  :multiple="true"  
                           placeholder="Select at least one value"
                           :block-keys="['Tab', 'Enter']" :hideSelected="true"
                           :showLabels="false" 
                           track-by="value" label="display" :searchable="false"
                           :optionHeight="32" :loading="updatingFacets"
                           :options="facetBuckets(resultsIdx, selectedFacet)">
                     </multiselect>
                  </template>
                  <template v-else>
                     <label v-if="updatingFacets">Loading facet values...</label>
                     <label v-else>Select a facet to see value options</label>
                  </template>
               </td>
            </tr>
         </table>
      </div>
      <div class="controls">
         <span @click="cancelAdd" class="pure-button pure-button-secondary filter">Cancel</span>
         <span @click="addFilter" class="pure-button pure-button-primary filter">OK</span>
      </div>
   </div>

</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import Multiselect from 'vue-multiselect'
export default {
   components: {
      Multiselect
   },
   data: function()  {
      return {
         selectedFacet: '',
         facetValues: []
      }
   },
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         searching: state => state.searching,
         updatingFacets: state => state.filters.updatingFacets
      }),
      ...mapGetters({
         poolFacets: 'filters/poolFacets',
         facetBuckets: 'filters/facetBuckets',
      }),
   },
   methods: {
      cancelAdd() {
         this.$store.commit("filters/closeAdd")
      },
      addFilter() {
         // IMPORTANT: vue-multiselect binds v-model to this.facetValues. The binding shoves
         // the whole json object for the option into the array 
         // ({name: xxx, value: yyy} instead of just the value)
         this.$store.commit("filters/addFilter", 
            {poolResultsIdx: this.resultsIdx, facetID: this.selectedFacet, values: this.facetValues}
         )
         this.$store.commit("filters/closeAdd")
         this.$store.commit("clearSelectedPoolResults")
         this.$store.dispatch("searchSelectedPool")
      },
      facetChosen() {
         this.facetValues.splice(0, this.facetValues.length)
         this.$store.dispatch("filters/getBuckets", {poolResultsIdx: this.resultsIdx, facet: this.selectedFacet})
      }
   }
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style>
#app li.multiselect__element span.multiselect__option.multiselect__option--highlight {
   background: var(--color-primary-blue);
   color: white;
   font-weight: bold;
}
#app li.multiselect__element span.multiselect__option.multiselect__option--highlight:after {
   background: var(--color-primary-blue) !important;
}
#app li.multiselect__element span.multiselect__option {
   padding: 10px;
   font-size: 0.9em;
}
#app .buckets span.multiselect__placeholder {
   margin-bottom:0;
   padding-top: 1px;
}
#app .buckets .multiselect--active div.multiselect__select {
   top: -10px;
}
#app .buckets div.multiselect__select:before {
   border-color: #888 transparent transparent;
   border-width: 10px 8px 0;
}
#app .buckets span.multiselect__tag {
   background: var(--color-primary-blue);
   color: white;
   margin-bottom: 0;
   margin-right: 5px;
   cursor: default;
   font-size: 0.9em;
   font-weight: bold;
} 
#app .buckets .multiselect__tags {
   padding: 5px 40px 0px 5px;
   min-height: 32px;
}
#app i.multiselect__tag-icon:after {
   color: white;
}
#app i.multiselect__tag-icon:hover {
   background: var(--color-primary-blue);
}
</style>

<style scoped>
p{
  margin: 0 0 5px 2px;
  font-weight: bold;
}
.add-contents {
   padding: 5px 15px 0 15px;
}
#app .add-filter.pure-form select {
   height: initial;
   display: inline-block;
   margin-right: 10px;
}
select {
   box-sizing: border-box;
   width: 100%;
}
select.disabled {
   opacity: 0.6;
}
div.add-filter {
   border-top: 1px solid #ccc;
   padding-top: 7px;
   margin-top: 5px;
}
div.controls {
   text-align: right;
   margin: 8px 0 0 0;
}
#app span.pure-button.filter {
   padding: 5px 20px;
   margin: 0 5px 0 0;
   font-size: 0.9em;
   font-weight: bold;

}
.clearfix::after {
  content: "";
  clear: both;
  display: table;
}
table {
   width: 100%;
}
td {
   padding: 0 5px 0 0;
}
td.label {
   font-weight: bold;
}
td.sel {
   width: 100%;
}
label {
   color: #999;
   font-style: italic;
}
</style>