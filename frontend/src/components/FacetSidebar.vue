<template>
   <div class="facet-sidebar">
      <div class="heading">
         <span>Filter By</span>
         <i class="fas fa-filter"></i>
      </div>
      <div class="body">
         <div v-if="updatingFacets" class="working">
            <div>Looking up filters...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <dl v-else>
            <dt>Availability</dt>
            <dd v-for="avail in availabilityOpts" :key="avail.id" @click="availSelected(avail)">
               <i v-if="isAvailSelected(avail)" class="check far fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>                                
               {{avail.name}}
            </dd>
            <template v-for="facetInfo in facets">
               <dt :key="facetInfo.facet.id">{{facetInfo.facet.name}}</dt>
               <dd v-for="(fv,idx) in facetValues(facetInfo)" :key="valueKey(idx, facetInfo.facet.id)">
                  <i class="check far fa-circle"></i>                                
                  {{fv.display}}
               </dd>
               <dd class="more" v-if="facetInfo.buckets && facetInfo.buckets.length > 4" :key="moreKey(facetInfo.facet.id)">
                  <span class="more text-button">View More</span>
               </dd>
            </template>
         </dl>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
export default {
   components: {
   },
   data: function() {
      return {
      };
   },
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         updatingFacets: state => state.filters.updatingFacets,
      }),
       ...mapGetters({
          allFacets: 'filters/poolFacets',
      }),
      ...mapFields('filters',[
         'globalAvailability',
      ]),
      facets() {
         let out = this.allFacets(this.resultsIdx)
         return out.filter(f=>f.facet.id != "FacetAvailability")
      },
      availabilityOpts() {
         return [
            {id: "any", name: "Any"},
            {id: "online", name: "Online"},
            {id: "shelf", name: "On Shelf"},
         ]
      }
   },
   methods: {
      facetValues(facet) {
         if (!facet.buckets) return []
         return facet.buckets.slice(0,3)
      },
      moreKey(id) {
         return "more"+id
      },
      valueKey(idx, facetID) {
         return facetID+"_val_"+idx
      },
      availSelected(avail) {
         this.globalAvailability = avail
         this.$store.dispatch("searchAllPools")
      },
      isAvailSelected(avail) {
         return this.globalAvailability.id == avail.id
      }
   },
   created() {
   }
}
</script>

<style scoped>
.facet-sidebar {
   margin: 0px 15px 25px 0;
   border-radius: 5px 5px 0 0;
   flex: 1 1 25%;
   min-width: 200px;
   display: inline-block;
}
.body {
   border: 3px solid var(--color-brand-blue);
   border-top: 0;
   border-radius: 0 0 5px 5px;
   text-align: left;
   padding: 10px;
   margin: 0;
   font-size: 0.9em;
}
.heading {
   background-color: var(--color-brand-blue);
   text-align: left;
   padding: 5px 10px;
   color: white;
   border-radius: 5px 5px 0 0;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
}
dl  {
   margin: 0;
   color: #444;
}
dt {
   font-weight: bold;
   margin-top: 10px;
}
dt:first-child {
   margin-top:0;
}
dd {
   cursor: pointer;
   font-size: 0.8em;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   padding: 2px;
}
dd.more {
   text-align:right;
}
i.check {
   margin-right: 10px;
   color: var(--color-brand-blue);
   font-size: 1.25em;
}
.working {
   text-align: center;
}
.working img {
   margin-top: 15px;
}

</style>
