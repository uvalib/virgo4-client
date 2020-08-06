<template>
   <div class="facet-sidebar" :class="{overlay: !startExpanded}">
      <div class="global" :class="{overlay: !startExpanded}">
         <AccordionContent class="filter" :background="filterColor" id="global-filter"
            borderColor="var(--uvalib-brand-blue)"
            color="white" :expanded="startExpanded" :invert="!startExpanded">
            <template v-slot:title>{{globalTitle}}</template>
            <div v-if="hasFacets" class="body">
               <dl role="radiogroup" aria-labelledby="availability_label">
                  <dt id="availability_label">Availability</dt>
                  <dd v-for="avail in availabilityOpts" :key="avail.id">
                     <V4Button mode="icon" @click="availSelected(avail)" role="radio" :aria-checked="isAvailSelected(avail)">
                        <i v-if="isAvailSelected(avail)" class="check fas fa-check-circle"></i>
                        <i v-else class="check far fa-circle"></i>
                        {{avail.name}}
                     </V4Button>
                  </dd>
               </dl>
               <div class="circulate">
                  <V4Checkbox v-model="globalCirculating" @click="circFacetClicked">{{circulatingFacet.name}}</V4Checkbox>
               </div>
            </div>
            <div v-else class="none">
               This resource does not support filtering
            </div>
         </AccordionContent>
      </div>

      <div v-if="hasFacets && selectedResults.hits.length > 0" class="pool" :class="{overlay: !startExpanded}">
          <AccordionContent id="pool-filter" class="filter"
            :background="filterColor"
            color="white" :expanded="startExpanded"
            borderColor="var(--uvalib-brand-blue)"
            :layoutChange="updatingFacets"  :invert="!startExpanded">
            <template v-slot:title>{{poolFilterTitle}}</template>
            <div class="body">
               <div v-if="updatingFacets" class="working">
                  <V4Spinner message="Loading filters..."/>
               </div>
               <div v-if="facets.length == 0" class="none">
                  Filters are not available for this search
               </div>
               <dl v-else>
                  <template v-for="facetInfo in facets">
                     <dt :key="facetInfo.id" :id="facetInfo.id">{{facetInfo.name}}</dt>
                     <div role="group" :aria-labelledby="facetInfo.id" :key="`l${facetInfo.id}`">
                        <dd v-for="(fv,idx) in facetValues(facetInfo,0,5)"  :key="valueKey(idx, facetInfo.id)">
                           <V4Checkbox :checked="fv.selected" 
                              @click="filterClicked(facetInfo.id, fv.value)">
                              {{fv.value}}
                           </V4Checkbox>
                           <span class="cnt" v-if="fv.count">({{formatNum(fv.count)}})</span>
                        </dd>
                        <dd v-if="facetInfo.buckets && facetInfo.buckets.length > 5" :key="moreKey(facetInfo.id)">
                           <AccordionContent class="more" :id="`${facetInfo.id}-more`" borderWidth="0">
                              <template v-slot:title>
                                 <span :aria-label="`see more ${facetInfo.name} filters`">See More</span>
                              </template>
                              <div class="expanded-item" v-for="(fv,idx) in facetValues(facetInfo,5)" :key="valueKey(idx, facetInfo.id)">
                                 <V4Checkbox :checked="fv.selected" 
                                    @click="filterClicked(facetInfo.id, fv.value)">
                                    {{fv.value}}
                                 </V4Checkbox>
                                 <span class="cnt" v-if="fv.count">({{formatNum(fv.count)}})</span>
                              </div>
                              <template v-slot:footer>
                                 <span :aria-label="`see less ${facetInfo.name} filters`"><b>See Less</b></span>
                              </template>
                           </AccordionContent>
                        </dd>
                     </div>
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
import { mapFields } from "vuex-map-fields"
import AccordionContent from "@/components/AccordionContent"
export default {
   components: {
      AccordionContent
   },
   computed: {
      ...mapState({
         results: state => state.results,
         updatingFacets: state => state.filters.updatingFacets,
         globalAvailability: state => state.filters.globalAvailability,
         circulatingFacet: state => state.filters.circulatingFacet,
         globalCirculating: state => state.filters.globalCirculating,
         displayWidth: state => state.system.displayWidth,
      }),
      ...mapFields("filters", [
         "globalCirculating", 
      ]),
      ...mapGetters({
          allFacets: 'filters/poolFacets',
          selectedResults: 'selectedResults',
          filterQueryParam: 'filters/asQueryParam',
          facetSupport: 'pools/facetSupport',
      }),
      hasFacets() {
         return this.facetSupport(this.selectedResults.pool.id)
      },
      globalTitle() {
         if ( !this.startExpanded ) {
            return "Filter Results"
         }
         return "Filter Results By"
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
         let out = this.allFacets(this.selectedResults.pool.id)
         return out.filter(f=>f.id != "FacetAvailability" && f.type != "boolean")
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
      formatNum(num) {
         return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
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
      async availSelected(avail) {
         let origPoolID = this.selectedResults.pool.id
         this.$store.commit("filters/setGlobalAvailability", avail)
         this.addFilterToURL()
         this.$store.commit("clearSelectedPoolResults")
         await this.$store.dispatch("searchAllPools", true)
         let resIdx = this.results.findIndex( r => r.pool.id == origPoolID)
         await this.$store.dispatch("selectPoolResults", resIdx)
         this.$store.commit("setSearching", false)
         this.$store.dispatch("searches/updateHistory")
      },
      async circFacetClicked() {
         let origPoolID = this.selectedResults.pool.id
         this.addFilterToURL()
         this.$store.commit("clearSelectedPoolResults")
         await this.$store.dispatch("searchAllPools", true)
         let resIdx = this.results.findIndex( r => r.pool.id == origPoolID)
         await this.$store.dispatch("selectPoolResults", resIdx)
         this.$store.commit("setSearching", false)
         this.$store.dispatch("searches/updateHistory")
      },
      addFilterToURL() {
         // changing the filter resetes paging
         let query = Object.assign({}, this.$route.query)
         delete query.page
         let fqp = this.filterQueryParam( this.selectedResults.pool.id )
         if (fqp.length == 0) {
            delete query.filter
         } else if ( this.$route.query.filter != fqp ) {
            query.filter = fqp
         } 
         this.$router.push({ query })
      },
      isAvailSelected(avail) {
         return this.globalAvailability.id == avail.id
      },
      filterClicked(facetID,value) {
         let data = {pool: this.selectedResults.pool.id, facetID: facetID, value: value}
         this.toggleFacet(data)
      },
      toggleFacet(data) {
         this.$store.commit("filters/toggleFilter", data)
         this.addFilterToURL()
         this.$store.commit("clearSelectedPoolResults")
         this.$store.dispatch("searchSelectedPool")
         this.$store.dispatch("searches/updateHistory")
      },
   }
}
</script>
<style lang="scss" scoped>
.facet-sidebar {
   margin: 0px 10px 15px 0px;
   border-radius: 5px 5px 0 0;
   flex: 1 1 25%;
   min-width: 200px;
   display: inline-block;
}
.facet-sidebar .global, .facet-sidebar .pool {
  box-shadow: $v4-box-shadow-light;
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
   font-size: 1em;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   padding: 3px 2px;
   margin-left: 15px;
   font-weight: normal;
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
   font-weight: normal;
}
@media only screen and (min-width: $breakpoint-tablet) {
   .filter-icons {
      display: inline-block;
   }
}
@media only screen and (max-width: $breakpoint-tablet) {
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
  box-shadow:  $v4-box-shadow-light;
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
div.circulate {
   border-top: 1px solid var(--uvalib-grey-light);
   padding-top: 15px;
   color: var(--uvalib-text);
   margin: 15px 0 10px 15px;
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
