<template>
   <v-popover>
      <span class="trigger">
          <span class="more text-button">View More</span>
      </span>
      <div class="facets-container" slot="popover">
         <div class="popover-header">
            <span>{{facet.name}}</span>
            <i v-close-popover class="close fas fa-times-circle"></i>
         </div>
         <div class="message">
            <div class="facet" v-for="(fv,idx) in facet.buckets"  :key="idx"
               @click="facetClicked(fv.value)" >
               <i v-if="isFacetSelected(fv.value)" 
                  class="check fas fa-check-square"></i>
               <i v-else class="check far fa-square"></i>  
               {{fv.value}} ({{fv.count}})
            </div>
         </div>
      </div>
   </v-popover>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   props: {
      facet: Object,
   },
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
      }),
      ...mapGetters({
          allFilters: 'filters/poolFilter',
      })
   },
   methods: {
      facetClicked(value) {
         let data = {poolResultsIdx: this.resultsIdx, facetID: this.facet.id, value: value}
         this.$emit("facet-clicked", data)
      },
      isFacetSelected(value) {
         let filter = this.allFilters(this.resultsIdx)
         let idx = filter.findIndex( f=> f.facet_id == this.facet.id && f.value == value ) 
         return idx > -1
      },
   }
};
</script>

<style scoped>
div.popover-header {
   padding: 6px 0px 6px 8px;
   color: white;
   background-color: var(--color-primary-orange);
   font-size: 1.15em;
   font-weight: bold;
   border-radius: 5px 5px 0 0;
}
.facets-container {
   background: white;
   box-shadow: 1px 1px 15px #333;
   color: var(--color-primary-text);
   font-size: 0.9em;
   font-weight: 500;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
i.fas.fa-times-circle.close {
   opacity: 0.8;
   font-size: 1.1em;
   float:right;
   margin-right: 8px;
}
i.fas.fa-times-circle.close:hover {
   opacity: 1;
   cursor: pointer;
}
div.message {
   font-size: 0.9em;
   padding: 15px;
   text-align: left;
   border-left: 5px solid var(--color-primary-orange);
   border-right: 5px solid var(--color-primary-orange);
   border-bottom: 5px solid var(--color-primary-orange);
   border-radius: 0 0 5px 5px;
}
.facet {
   cursor:pointer;
   margin: 4px 0;
}
.check {
   margin-right: 10px;
}
</style>
