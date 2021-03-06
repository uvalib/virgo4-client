<template>
   <section class="facet-sidebar" :class="{overlay: !startExpanded}" role="group">
      <AccordionContent id="pool-filter" class="filter"
         :background="filterColor"
         color="white" :expanded="startExpanded"
         borderColor="var(--uvalib-brand-blue)"
         :layoutChange="updatingFacets"  :invert="!startExpanded">
         <template v-slot:title>{{poolFilterTitle}}</template>

         <div v-if="!hasFacets" class="none">
            {{selectedResults.pool.name}} does not support filtering
         </div>
         <div v-else class="body">
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
                        <span class="cnt" v-if="$utils.formatNum(fv.count)">({{$utils.formatNum(fv.count)}})</span>
                     </dd>
                     <dd v-if="facetValuesCount(facetInfo) > 5" :key="moreKey(facetInfo.id)">
                        <AccordionContent class="more" :id="`${facetInfo.id}-more`" borderWidth="0">
                           <template v-slot:title>
                              <span :aria-label="`see more ${facetInfo.name} filters`">See More</span>
                           </template>
                           <div class="expanded-item" v-for="(fv,idx) in facetValues(facetInfo,5)" :key="valueKey(idx, facetInfo.id)">
                              <V4Checkbox :checked="fv.selected"
                                 @click="filterClicked(facetInfo.id, fv.value)">
                                 {{fv.value}}
                              </V4Checkbox>
                              <span class="cnt">({{$utils.formatNum(fv.count)}})</span>
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
   </section>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import AccordionContent from "@/components/AccordionContent"
export default {
   components: {
      AccordionContent
   },
   computed: {
      ...mapState({
         results: state => state.results,
         updatingFacets: state => state.filters.updatingFacets,
         displayWidth: state => state.system.displayWidth,
      }),
      ...mapGetters({
          allFacets: 'filters/poolFacets',
          selectedResults: 'selectedResults',
          filterQueryParam: 'filters/asQueryParam',
          facetSupport: 'pools/facetSupport',
      }),
      ...mapFields({
        userSearched: 'query.userSearched'
      }),
      hasFacets() {
         return this.facetSupport(this.selectedResults.pool.id)
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
         return this.allFacets(this.selectedResults.pool.id).filter( f=> f.hidden !== true && f.na !== true)
      },
   },
   methods: {
      facetValuesCount(facet) {
         if (!facet.buckets) return 0
         return facet.buckets.filter(b=>b.value && b.na != true).length
      },
      facetValues(facet, start, end) {
         if (!facet.buckets) return []
         let out = facet.buckets.filter(b=> b.value && b.na != true).slice(start,end)
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
         let data = {pool: this.selectedResults.pool.id, facetID: facetID, value: value}
         this.toggleFacet(data)
      },
      async toggleFacet(data) {
         this.$store.commit("filters/toggleFilter", data)
         this.$store.commit("clearSelectedPoolResults")
         this.userSearched = true
         this.addFilterToURL()
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
   box-shadow: $v4-box-shadow-light;
   height: fit-content;

   .pool-filter-header, .filter {
      width: 100%;
   }
   .body {
      border-top: 0;
      text-align: left;
      padding: 10px;
      margin: 0;
      background: white;
      position: relative;
      min-height: 150px;
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
   }
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
.expanded-item {
   padding: 3px 0;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   font-weight: normal;
}
.facet-sidebar.overlay {
   position: fixed;
   left: 5px;
   right: 5px;
   z-index: 5000;
   bottom: 0px;
   padding: 0;
   margin: 0;
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-end;
   justify-content: space-between;
   margin: 0;
   flex: 1 1 auto;
   box-shadow: $v4-box-shadow;

   .body {
      max-height: 450px;
      overflow: scroll;
   }
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
