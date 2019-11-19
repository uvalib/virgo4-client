<template>
   <div class="facet-sidebar">
      <div class="global">
         <div class="heading" @click="toggleGlobal">
            <span>
               Filter All Results By
               <i class="toggle fas fa-angle-down" 
                  :style="{ transform: rotation(globalFilterExpanded) }"></i>
            </span>
            <span>
               <i class="global fas fa-globe-americas"></i>
               <i class="fas fa-filter"></i>
            </span>
         </div>
         <transition name="accordion"
            v-on:before-enter="beforeEnter" v-on:enter="enter"
            v-on:before-leave="beforeLeave" v-on:leave="leave">
            <div v-show="globalFilterExpanded" class="body">
               <dl>
                  <dt>Availability</dt>
                  <dd v-for="avail in availabilityOpts" :key="avail.id" @click="availSelected(avail)">
                     <i v-if="isAvailSelected(avail)" class="check fas fa-check-circle"></i>
                     <i v-else class="check far fa-circle"></i>                                
                     {{avail.name}}
                  </dd>
               </dl>
            </div>
         </transition>
      </div>

      <div class="pool">
         <div class="heading" @click="togglePool">
            <span>
               Filter {{selectedResults.pool.name}} By
               <i class="toggle fas fa-angle-down" 
                  :style="{ transform: rotation(poolFilterExpanded) }"></i>
            </span>
            <i class="fas fa-filter"></i>
         </div>
         <transition name="accordion"
            v-on:before-enter="beforeEnter" v-on:enter="enter"
            v-on:before-leave="beforeLeave" v-on:leave="leave">
            <div v-show="poolFilterExpanded" class="body">
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
                        <FacetList :facet="facetInfo" v-on:facet-clicked="toggleFacet" />
                     </dd>
                  </template>
               </dl>
            </div>
         </transition>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import FacetList from "@/components/popovers/FacetList"
export default {
   components: {
      FacetList
   },
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         updatingFacets: state => state.filters.updatingFacets,
         globalAvailability: state => state.filters.globalAvailability,
         globalFilterExpanded: state => state.filters.globalFilterExpanded,
         poolFilterExpanded: state => state.filters.poolFilterExpanded,
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
      },
   },
   methods: {
      toggleGlobal() {
         this.$store.commit("filters/toggleGlobalFilterExpanded")
      },
      togglePool() {
         this.$store.commit("filters/togglePoolFilterExpanded")
      },
      rotation(flag) {
         if (flag) {
            return "rotate(180deg)"
         }
         return "rotate(0deg)"
      },
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
         setTimeout( ()=> {
            this.$store.commit("clearSelectedPoolResults")
            this.$store.dispatch("searchSelectedPool")
         }, 500)
      },
      isFacetSelected(facetID, value) {
         let filter = this.allFilters(this.resultsIdx)
         let idx = filter.findIndex( f=> f.facet_id == facetID && f.value == value ) 
         return idx > -1
      },
      beforeEnter: function(el) {
         el.style.height = '0'
      },
      enter: function(el) {
         el.style.height = el.scrollHeight + 'px'
         this.expandedItem = el
      },
      beforeLeave: function(el) {
         el.style.height = el.scrollHeight + 'px'
         this.expandedItem = el
      },
      leave: function(el) {
         el.style.height = '0'
      }
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
   transition: 250ms ease-out;
   overflow: hidden;
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
}
i.toggle {
   transition: 250ms ease-out;   
   margin-left: 10px;
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
