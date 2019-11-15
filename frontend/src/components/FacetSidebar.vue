<template>
   <div class="facet-sidebar">
      <div class="global">
         <div class="heading">
            <span>Filter All Results By</span>
            <span>
               <i class="global fas fa-globe-americas"></i>
               <i class="fas fa-filter"></i>
            </span>
         </div>
         <div class="body">
            <dl>
               <dt>Availability</dt>
               <dd v-for="avail in availabilityOpts" :key="avail.id" @click="availSelected(avail)">
                  <i v-if="isAvailSelected(avail)" class="check fas fa-check-circle"></i>
                  <i v-else class="check far fa-circle"></i>                                
                  {{avail.name}}
               </dd>
            </dl>
         </div>
      </div>

      <div class="pool">
         <div class="heading">
            <span>Filter {{selectedResults.pool.name}} By</span>
            <i class="fas fa-filter"></i>
         </div>
         <div class="body">
            <div v-if="updatingFacets" class="working">
               <div>Looking up filters...</div>
               <img src="../assets/spinner2.gif">
            </div>
            <dl v-else>
               <template v-for="facetInfo in facets">
                  <dt :key="facetInfo.id">{{facetInfo.name}}</dt>
                  <dd v-for="(fv,idx) in facetValues(facetInfo)"  :key="valueKey(idx, facetInfo.id)"
                     @click="filterClicked(facetInfo.id, fv.value)" >
                     <i v-if="isFacetSelected(facetInfo.id, fv.value)" 
                        class="check fas fa-check-square"></i>
                     <i v-else class="check far fa-square"></i>                                
                     {{fv.value}} ({{fv.count}})
                  </dd>
                  <dd class="more" v-if="facetInfo.buckets && facetInfo.buckets.length > 5" :key="moreKey(facetInfo.id)">
                     <span class="more text-button">View More</span>
                  </dd>
               </template>
            </dl>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
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
         globalAvailability: state => state.filters.globalAvailability,
      }),
       ...mapGetters({
          allFacets: 'filters/poolFacets',
          selectedResults: 'selectedResults',
          allFilters: 'filters/poolFilter',
      }),
      facets() {
         let out = this.allFacets(this.resultsIdx)
         return out.filter(f=>f.id != "FacetAvailability")
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
         let out = facet.buckets.slice(0,5)
         return out
      },
      moreKey(id) {
         return "more"+id
      },
      valueKey(idx, facetID) {
         return facetID+"_val_"+idx
      },
      availSelected(avail) {
         this.$store.commit("filters/setGlobalAvailability", avail)
         this.$store.dispatch("searchAllPools")
         this.backToTop()
      },
      isAvailSelected(avail) {
         return this.globalAvailability.id == avail.id
      },
      filterClicked(facetID,value) {
         let data = {poolResultsIdx: this.resultsIdx, facetID: facetID, value: value}
         this.$store.commit("filters/toggleFilter", data)
         this.$store.commit("clearSelectedPoolResults")
         this.$store.dispatch("searchSelectedPool")
         this.backToTop()
      },
      isFacetSelected(facetID, value) {
         let filter = this.allFilters(this.resultsIdx)
         let idx = filter.findIndex( f=> f.facet_id == facetID && f.value == value ) 
         return idx > -1
      },
      backToTop: function() {
         var scrollStep = -window.scrollY / (500 / 10),
         scrollInterval = setInterval(()=> {
            if ( window.scrollY != 0 ) {
               window.scrollBy( 0, scrollStep ) 
            } else {
               clearInterval(scrollInterval)
            }
         },10)
      },

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
   border: 5px solid var(--color-brand-blue);
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
i.global {
   margin-right: 10px;
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
.global {
   margin-bottom: 10px;
}

</style>
