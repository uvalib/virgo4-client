<template>
   <div class="filter-sidebar" :class="{overlay: !startExpanded}" v-if="hasResults == false">
      <div class="filters">
          <AccordionContent class="filter" id="acc-filter-sidebar"
            :background="filterColor"
            color="white" :expanded="startExpanded"
            borderColor="var(--uvalib-brand-blue)"
            :layoutChange="loadingFilters"  :invert="!startExpanded">
            <template v-slot:title>Filters</template>
            <div class="body">
               <div v-if="loadingFilters" class="working">
                  <V4Spinner message="Loading filters..."/>
               </div>

               <template v-else v-for="filterInfo in filters.filter( f=> f.hidden !== true)">
                  <AccordionContent  :key="filterInfo.id"
                     :id="`${filterInfo.id}-acc`"
                     class="filter-list"
                     background="var(--uvalib-grey-lightest)"
                     borderWidth="1px"
                  >
                     <template v-slot:title>
                        <span :aria-label="`see more ${filterInfo.name} filters`">{{filterInfo.name}}</span>
                     </template>
                     <div class="expanded-item" v-for="fv in filterInfo.buckets.filter(f => f.value)" :key="fv.value">
                        <V4Checkbox :checked="fv.selected"
                           @click="filterClicked(filterInfo.id, fv.value)">
                           {{fv.value}}
                        </V4Checkbox>
                        <span class="cnt" v-if="fv.count">({{formatNum(fv.count)}})</span>
                     </div>
                  </AccordionContent>
               </template>

            </div>
          </AccordionContent>
      </div>
   </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import AccordionContent from "@/components/AccordionContent"
export default {
   components: {
      AccordionContent
   },
   computed: {
      ...mapState({
         displayWidth: state => state.system.displayWidth,
         loadingFilters: state => state.filters.updatingFacets,
      }),
      ...mapGetters({
         hasResults: 'hasResults',
         filters: 'filters/preSearchFilters',
      }),
      filterColor() {
         return "var(--uvalib-brand-blue)"
      },
      startExpanded() {
         return this.displayWidth > 810
      },
   },
   methods: {
      formatNum(num) {
         return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      },
      filterClicked(facetID, value) {
         let data = {pool: "presearch", facetID: facetID, value: value}
         this.$store.commit("filters/toggleFilter", data)
      },
   }
}
</script>
<style lang="scss" scoped>
.filter-sidebar.overlay {
   position: fixed;
   left: 0px;
   right: 0px;
   z-index: 5000;
   bottom: 0px;
   padding: 0;
   margin: 0 5px;
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
   border-radius: 0;
   min-height: 25px;
   background: transparent;
   border-top: 2px solid white;
   border-right: 2px solid white;
   border-left: 2px solid white;
   .filters {
      width: 100%;
   }
   .body {
      max-height: 400px;
      overflow: scroll;
   }
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
.filter-sidebar {
   margin: 0px 25px 15px 0px;
   border-radius: 5px 5px 0 0;
   flex-basis: 25%;
   min-width: 200px;
   display: inline-block;

   .filters {
      outline: 1px solid var(--uvalib-grey-light);
      .body {
         border-top: 0;
         text-align: left;
         padding: 10px;
         margin: 0;
         background: white;
         position: relative;
         min-height: 80px;
         min-height: 150px;
      }
   }
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
.filter-list {
   margin-bottom: 10px;
}
.expanded-item {
   padding: 3px 0 3px 10px;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   font-weight: normal;
}
span.cnt {
   margin-left: 5px;
   margin-left: auto;
   font-size: 0.8em;
}
</style>
<style>
#app .accordion.filter .title {
   padding: 5px 10px;
   font-weight: bold;
}
</style>
