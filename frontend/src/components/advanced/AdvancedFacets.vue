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
               <dl v-else>
                  <template v-for="filterInfo in filters">
                     <dt :key="filterInfo.value">{{filterInfo.label}}</dt>
                     <div role="group" :aria-labelledby="filterInfo.value" :key="`f-${filterInfo.value}`">
                        <dd v-for="fv in filterValues(filterInfo,0,5)"  :key="fv.value">
                           <V4Checkbox :checked="fv.selected"
                              @click="filterClicked(filterInfo.value, fv.value)">
                              {{fv.value}}
                           </V4Checkbox>
                           <span class="cnt" v-if="fv.count">({{formatNum(fv.count)}})</span>
                        </dd>
                        <dd v-if="filterInfo.choices && filterInfo.choices.length > 5" :key="`more-${filterInfo.value}`">
                           <AccordionContent class="more" :id="`${filterInfo.value}-more`" borderWidth="0">
                              <template v-slot:title>
                                 <span :aria-label="`see more ${filterInfo.label} filters`">See More</span>
                              </template>
                              <div class="expanded-item" v-for="fv in filterValues(filterInfo,5)" :key="fv.value">
                                 <V4Checkbox :checked="fv.selected"
                                    @click="filterClicked(filterInfo.value, fv.value)">
                                    {{fv.value}}
                                 </V4Checkbox>
                                 <span class="cnt" v-if="fv.count">({{formatNum(fv.count)}})</span>
                              </div>
                              <template v-slot:footer>
                                 <span :aria-label="`see less ${filterInfo.label} filters`"><b>See Less</b></span>
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
import { mapState, mapGetters } from "vuex"
import AccordionContent from "@/components/AccordionContent"
export default {
   components: {
      AccordionContent
   },
   computed: {
      ...mapState({
         displayWidth: state => state.system.displayWidth,
         loadingFilters: state => state.query.loadingFilters,
         filters: state => state.query.preSearchFilters,
      }),
      ...mapGetters({
         hasResults: 'hasResults',
      }),
      filterColor() {
         return "var(--uvalib-brand-blue)"
      },
      startExpanded() {
         return this.displayWidth > 810
      },
      facets() {
         let out = this.allFacets(this.selectedResults.pool.id)
         return out.filter(f=>f.id != "FacetAvailability" && f.type != "boolean")
      },
   },
   methods: {
      formatNum(num) {
         return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      },
      filterValues(filter, start, end) {
         if (!filter.choices) return []
         let out = filter.choices.slice(start,end)
         return out
      },
      moreKey(id) {
         return "more"+id
      },
      valueKey(idx, facetID) {
         return facetID+"_val_"+idx
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
      filterClicked(facetID,value) {
         this.$store.commit("filters/reset")
         let data = {filterID: facetID, value: value}
         this.$store.commit("query/toggleFilter", data)
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
      outline: 1px solid var(--uvalib-brand-blue);
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
.expanded-item {
   padding: 3px 0;
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
div.none {
   text-align: center;
   margin:25px 5px;
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
