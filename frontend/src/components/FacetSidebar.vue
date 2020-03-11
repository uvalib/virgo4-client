<template>
   <div class="facet-sidebar" :class="{overlay: !startExpanded}">
      <div class="global" :class="{overlay: !startExpanded}">
         <AccordionContent class="filter" :title="globalTitle" :background="filterColor"
            borderColor="var(--uvalib-brand-blue)"
            color="white" :expanded="startExpanded" :invert="!startExpanded">
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

      <div v-if="hasFacets" class="pool" :class="{overlay: !startExpanded}">
          <AccordionContent id="pool-filter" class="filter"
            :title="poolFilterTitle" :background="filterColor"
            color="white" :expanded="startExpanded"
            borderColor="var(--uvalib-brand-blue)"
            :layoutChange="updatingFacets"  :invert="!startExpanded">
            <div class="body">
               <div v-if="updatingFacets" class="working">
                  <V4Spinner message="Loading filters..."/>
               </div>
               <div v-if="facets.length == 0" class="none">
                  Filters are not available for this search
               </div>
               <dl v-else>
                  <template v-for="facetInfo in facets">
                     <dt :key="facetInfo.id">{{facetInfo.name}}</dt>
                     <dd v-for="(fv,idx) in facetValues(facetInfo,0,5)"  :key="valueKey(idx, facetInfo.id)"
                        @click="filterClicked(facetInfo.id, fv.value)" >
                        <i :class="facetControlClass(facetInfo, fv.value)"></i>
                        {{fv.value}}
                        <span class="cnt" v-if="fv.count">({{fv.count}})</span>
                     </dd>
                     <dd v-if="facetInfo.buckets && facetInfo.buckets.length > 5" :key="moreKey(facetInfo.id)">
                        <AccordionContent class="more" title="See More"
                           closeText="See Less" borderWidth="0">
                           <div class="expanded-item" v-for="(fv,idx) in facetValues(facetInfo,5)"
                              @click="filterClicked(facetInfo.id, fv.value)"
                              :key="valueKey(idx, facetInfo.id)"
                           >
                              <i :class="facetControlClass(facetInfo, fv.value)"></i>
                              {{fv.value}}
                              <span class="cnt" v-if="fv.count">({{fv.count}})</span>
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
import V4Spinner from "@/components/V4Spinner"
export default {
   components: {
      AccordionContent, V4Spinner
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
          facetSupport: 'pools/facetSupport'
      }),
      hasFacets() {
         return this.facetSupport(this.selectedResults.pool.id)
      },
      globalTitle() {
         if ( !this.startExpanded ) {
            return "Filter All"
         }
         return "Filter All Results By"
      },
      filterColor() {
         if ( !this.startExpanded ) {
            return "var(--uvalib-brand-blue)"
         }
         return "var(--uvalib-brand-blue)"
      },
      startExpanded() {
         return this.displayWidth > 810
      },
      poolFilterTitle() {
         if ( !this.startExpanded ) {
            return `Filter ${this.selectedResults.pool.name}`
         }
         return `Filter ${this.selectedResults.pool.name} By`
      },
      facets() {
         let out = this.allFacets(this.resultsIdx)
         return out.filter(f=>f.id != "FacetAvailability")
      },
      availabilityOpts() {
         return [
            {id: "any", name: "All"},
            {id: "online", name: "Online"},
            {id: "shelf", name: "On Shelf Now"},
         ]
      },
   },
   methods: {
      facetControlClass(facet, value) {
         if ( this.isFacetSelected(facet.id, value))  {
            if ( facet.type == "radio") {
               return "check fas fa-check-circle"
            }
            return "check fas fa-check-square"
         } else {
            if ( facet.type == "radio") {
               return "check far fa-circle"
            }
            return "check far fa-square"
         }
      },
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
.facet-sidebar .global, .facet-sidebar .pool {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.12);
  margin-bottom: 1rem;
}
.body {
   border-top: 0;
   text-align: left;
   padding: 10px;
   margin: 0;
   background: white;
   position: relative;
   min-height: 80px;
}
.pool .body {
   min-height: 150px;
}
.heading {
   background-color: var(--uvalib-brand-blue);
   text-align: left;
   padding: 5px 10px;
   color: white;
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
   color: var(--uvalib-text-dark);
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
   font-size: 0.95em;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   padding: 3px 2px;
   margin-left: 15px;
}
i.check {
   margin-right: 10px;
   color: var(--uvalib-text);
   font-size: 1.2em;
}
.working {
   color: var(--uvalib-text);
   text-align: center;
   background: white;
   position: absolute;
   left: 0;
   right: 0;
   padding: 25px 15px;
   bottom: 0;
   top: 0;
   z-index: 50;
   opacity: 0.9;
   font-size: 1.25em;
   font-weight: bold;
}
.global {
   margin-bottom: 10px;
}
.expanded-item {
   padding: 3px 0;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
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
.facet-sidebar.overlay {
   position: fixed;
   left: 0px;
   right: 0px;
   z-index: 5000;
   bottom: 0px;
   padding: 0;
   margin: 0;
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-end;
   justify-content: space-between;
}
div.global.overlay {
   margin: 0;
   flex: 1 1 auto;
   margin-right: 5px;
   border: none;
}
div.pool.overlay {
   margin: 0;
   flex: 1 1 auto;
   border: none;
}
div.pool.overlay .body {
   max-height: 450px;
   overflow: scroll;
}
div.pool.overlay .body,  div.global.overlay .body {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.12);
}
span.cnt {
   margin-left: 5px;
   margin-left: auto;
   font-size: 0.8em;
}
div.none {
   text-align: center;
   margin:25px 0;
   font-size: 1.25em;
   color: var(--uvalib-text);
}
</style>
<style>
#app .accordion.filter .title {
   padding: 5px 10px;
}
#app .accordion.more .title {
   padding: 5px 0;
   font-weight: bold;
}
#app .accordion.more {
   width: 100%;
}
</style>
