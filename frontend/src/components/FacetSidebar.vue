<template>
   <div class="facet-sidebar">
      <div class="global">
         <AccordionContent class="filter" title="Filter All Results By" background="var(--color-brand-blue)"
            color="white" :expanded="startExpanded">
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
         </AccordionContent>
      </div>

      <div class="pool">
          <AccordionContent id="zzz" class="filter" :title="poolFilterTitle" background="var(--color-brand-blue)"
            color="white" :expanded="startExpanded" :layoutChange="updatingFacets">
            <div class="body">
               <div v-if="updatingFacets" class="working">
                  <div>Looking up filters...</div>
                  <img src="../assets/spinner2.gif">
               </div>
               <dl v-else>
                  <template v-for="facetInfo in facets">
                     <dt :key="facetInfo.id">{{facetInfo.name}}</dt>
                     <dd v-for="(fv,idx) in facetValues(facetInfo,0,5)"  :key="valueKey(idx, facetInfo.id)"
                        @click="filterClicked(facetInfo.id, fv.value)" >
                        <i v-if="isFacetSelected(facetInfo.id, fv.value)" 
                           class="check fas fa-check-square"></i>
                        <i v-else class="check far fa-square"></i>                                
                        {{fv.value}} ({{fv.count}})
                     </dd>
                     <dd v-if="facetInfo.buckets && facetInfo.buckets.length > 5" :key="moreKey(facetInfo.id)">
                        <AccordionContent class="more" title="See More">
                           <div  v-for="(fv,idx) in facetValues(facetInfo,5)"  
                              @click="filterClicked(facetInfo.id, fv.value)"
                              :key="valueKey(idx, facetInfo.id)"
                           >   
                              <i v-if="isFacetSelected(facetInfo.id, fv.value)" 
                                 class="check fas fa-check-square"></i>
                              <i v-else class="check far fa-square"></i>  
                              {{fv.value}} ({{fv.count}})
                           </div>
                        </AccordionContent>
                     </dd>
                  </template>
               </dl>
            </div>
          </AccordionContent>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import AccordionContent from "@/components/AccordionContent"
export default {
   components: {
      AccordionContent
   },
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         updatingFacets: state => state.filters.updatingFacets,
         globalAvailability: state => state.filters.globalAvailability,
         globalFilterExpanded: state => state.filters.globalFilterExpanded,
         poolFilterExpanded: state => state.filters.poolFilterExpanded,
         displayWidth: state => state.system.displayWidth,
      }),
       ...mapGetters({
          allFacets: 'filters/poolFacets',
          selectedResults: 'selectedResults',
          allFilters: 'filters/poolFilter',
      }),
      startExpanded() {
         return this.displayWidth > 810
      },
      poolFilterTitle() {
         return `Filter ${this.selectedResults.pool.name} By`
      },
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
      },
   },
   methods: {
      toggleGlobal() {
         this.$store.commit("filters/toggleGlobalFilterExpanded")
      },
      togglePool() {
         this.$store.commit("filters/togglePoolFilterExpanded")
      },
      facetValues(facet, start, end) {
         if (!facet.buckets) return []
         let out = facet.buckets.slice(start,end)
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
         this.$store.commit("clearSelectedPoolResults")
         this.$store.dispatch("searchAllPools")
      },
      isAvailSelected(avail) {
         return this.globalAvailability.id == avail.id
      },
      filterClicked(facetID,value) {
         let data = {poolResultsIdx: this.resultsIdx, facetID: facetID, value: value}
         this.toggleFacet(data)
      },
      toggleFacet(data) {
         this.$store.commit("filters/toggleFilter", data)
         this.$store.commit("clearSelectedPoolResults")
         this.$store.dispatch("searchSelectedPool")
      },
      isFacetSelected(facetID, value) {
         let filter = this.allFilters(this.resultsIdx)
         let idx = filter.findIndex( f=> f.facet_id == facetID && f.value == value ) 
         return idx > -1
      },
   }
}
</script>

<style scoped>
.facet-sidebar {
   margin: 0px 10px 15px 10px;
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
   background: white;
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
   cursor: pointer;
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
   margin-left: 15px;
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
   margin: 15px 0;
}
.global {
   margin-bottom: 10px;
}
@media only screen and (min-width: 925px) {
   .filter-icons {
      display: inline-block;
   }
}
@media only screen and (max-width: 925px) {
   .filter-icons {
      display: none;
   }
}
</style>
<style> 
#app .accordion.filter .title {
   padding: 5px 10px;
}
#app .accordion.more .title {
   padding: 5px 10px 5px 0;
   font-weight: bold;
}
</style>
