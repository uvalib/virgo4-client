<template>
   <div class="results-panel">
      <div class="query-summary">Showing results for: <i>{{queryString}}</i></div>
      <div class="toolbar">
         <div class="right-indent">
            <p class="summary">
               <span>{{total}} matches found in {{results.length}} sources.</span> 
               <span class="subtotal" v-if="skippedPoolCount">&nbsp;{{skippedPoolCount}} source(s) not searched. Click source to search.</span>
               <span class="subtotal" v-if="failedPoolCount">&nbsp;{{failedPoolCount}} source(s) failed.</span>
               <span v-if="searchMode=='basic'" @click="refineClicked()" class="refine text-button">Refine Search</span>
            </p>
            <AvailabilitySelector/>
         </div>

         <div class="pool-buttons">
            <template  v-for="(r,idx) in results">  
               <div @click="resultsButtonClicked(idx)" :key="idx" class="pool pure-button" v-bind:class="{showing: r.show}">
                  <span>
                     <i v-if="isTargetPool(r.pool.url)" class="fas fa-star"></i>
                     <span>{{r.pool.name}}&nbsp;</span>
                     <span v-if="poolFailed(r)" class="total">(failed)</span>
                     <span v-else-if="wasPoolSkipped(r)" class="total">(not searched)</span>
                     <span v-else class="total">({{r.total}})</span>
                  </span>
                  <template v-if="!poolFailed(r)">
                     <i v-if="r.show" class="showing fas fa-external-link-alt"></i>
                     <i v-else-if="r.total>0" class="showing fa fa-arrow-down"></i>   
                  </template>
               </div>
            </template>
         </div>
      </div>

      <div class="pools">
         <div :id="result.resultIdx" class="pool-panel" 
            v-for="(result,visibleIdx) in visibleResults" :key="visibleIdx">
            <div class="pool-titlebar">
               <div class="title1">
                  <i v-if="isTargetPool(result.pool.url)" class="fas fa-star"></i>
                  <span class="pool-name">{{result.pool.name}}</span>
                  <i @click="closeResults(result.resultIdx)" class="hide-pool far fa-times-circle"></i>
               </div>
               <AccordionContent title="Description"  align="left-narrow" 
                  background="var(--color-primary-orange)" color="white">
                  {{result.pool.description}}
               </AccordionContent>
            </div>
            <div class="pool-info">
               <div class="metrics">
                  <span>{{result.total}} matches found in {{result.timeMS}} ms</span>
               </div>
               <template v-if="hasFilter(result.resultIdx)">
                  <div class="filter-head">Search Filters</div>
                  <table class="filters">
                     <tr class="filter" v-for="(filter,i) in poolFilter(result.resultIdx, 'raw')" :key="i">
                        <td class="label">{{filter.facet.name}}:</td>
                        <td class="filter">{{formatFilterValues(filter.values)}}</td>
                     </tr>
                  </table>
               </template>
            </div>
            <template v-for="(hit,idx) in result.hits.slice(0,3)">
               <SearchHit v-if="hit.grouped==false"  :pool="result.pool.id" :hit="hit" :key="idx"/>
               <GroupedSearchHit v-else :hitIdx="idx" :pool="result.pool.id" :hit="hit" :key="idx"/>
            </template>
            <div @click="selectPool(visibleIdx)" class="more-panel">
               See More&nbsp;<i class="more-icon fas fa-external-link-alt"></i>
            </div>
         </div>
      </div>

   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHit from "@/components/SearchHit"
import GroupedSearchHit from "@/components/GroupedSearchHit"
import AccordionContent from '@/components/AccordionContent'
import AvailabilitySelector from '@/components/AvailabilitySelector'
export default {
   components: {
      SearchHit,AccordionContent,GroupedSearchHit,AvailabilitySelector
   },
   computed: {
      ...mapGetters({
         visibleResults: 'visibleResults',
         visibleResultIdx: 'visibleResultIdx',
         rawQueryString: 'query/string',
         hitPoolCount: 'hitPoolCount',
         skippedPoolCount: 'skippedPoolCount',
         failedPoolCount: 'failedPoolCount',
         hasFilter: 'filters/hasFilter',
         poolFilter: 'filters/poolFilter',
         isTargetPool: "pools/isTargetPool",
      }),
      ...mapState({
         total: state=>state.total,
         results: state=>state.results,
         searchMode: state=>state.query.mode,
      }),
      queryString() {
         return this.rawQueryString.replace(/\{|\}/g, "")
      },
   },
   watch: {
      visibleResults(newVis, oldVis) {
         if (newVis.length > oldVis.length) {
            let resultIdx = newVis[0].resultIdx
            setTimeout( ()=>{
               let panel = document.getElementById(resultIdx)
               let anim = "pulse"
               panel.classList.add('animated', "faster", anim)  
               panel.addEventListener('animationend', handleAnimationEnd)
               function handleAnimationEnd() {
                  panel.classList.remove('animated', "faster", anim)
                  panel.removeEventListener('animationend', handleAnimationEnd)
               }
            }, 5)
         }   
      }
   },
   methods: {
      poolFailed(p) {
         return p.statusCode != 408 && p.total == 0 & p.statusCode != 200
      },
      wasPoolSkipped(p) {
         return p.statusCode == 408 && p.total == 0
      },
      formatFilterValues(values) {
         return values.join(", ")
      },
      refineClicked() {
         this.$store.commit("query/setAdvancedSearch")
      },
      selectPool(visiblePoolIdx) {
         this.$store.commit("selectPoolResults", visiblePoolIdx)
      },
      closeResults(resultIdx) {
         let panel = document.getElementById(resultIdx)
         let anim = "fadeOut"
         let store = this.$store
         panel.classList.add('animated', "faster", anim)  
         panel.addEventListener('animationend', handleAnimationEnd)
         function handleAnimationEnd() {
            panel.classList.remove('animated', "faster", anim)
            panel.removeEventListener('animationend', handleAnimationEnd)
            store.commit("toggleResultVisibility", resultIdx)
         }
      },
      resultsButtonClicked(resultIdx) {
         let r = this.results[resultIdx]
         if ( this.poolFailed(r)) return

         if (this.results[resultIdx].show == false) {
            this.$store.commit("toggleResultVisibility", resultIdx)
            if ( this.results[resultIdx].show && this.results[resultIdx].statusCode == 408) {
               let visibleIdx = this.visibleResultIdx(resultIdx) 
               this.selectPool(visibleIdx)
            }
         } else {
            let visibleIdx = this.visibleResultIdx(resultIdx) 
            if (visibleIdx > -1) {
               this.selectPool(visibleIdx)
            } else {
                this.$store.commit("toggleResultVisibility", resultIdx)
            }
         }
      },
   }
}
</script>

<style scoped>
.pool-buttons div.pool.pure-button {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
}
.pool-buttons div.pool.pure-button > * {
   flex: 0 0 auto;
}
div.accordion {
   font-size: 0.9em;
   padding: 0 10px 5px 10px;
}
.pool-buttons {
   margin: 5px 0;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
}
i.showing {
   font-size:1.15em;
}
.pool-info {
   border-right: 1px solid #ccc;
   border-left: 1px solid #ccc;
   border-bottom: 1px solid #ccc;
   margin: 0;
   padding: 0px;
   font-size: 0.7em;
   font-weight: 500;
   background-color: #f5f5f5;
}
.metrics {
   padding: 5px;
   color: #333;
   font-weight: 500;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
}
.metrics .more:hover {
   cursor: pointer;
   color: var(--color-link)
}
.filter-head {
   margin: 0;
   border-bottom: 1px solid #ccc;
   border-top: 1px solid #ccc;
   padding: 2px 5px;
   font-weight: bold;
   background: #e5e5e5;
}
table.filters {
   margin: 3px 5px;
}
table td {
   padding: 2px 5px;
   color: #333;
}
td.filter {
   width: 100%;
   font-weight: 500;
   color: #333;
}
td.label {
   padding: 2px 4px 0 0;
   font-weight: normal;
   vertical-align: text-top;
   text-align: right;
   font-weight: 500;
   
}
div.right-indent {
   margin-left: 5px;
}
.pool.pure-button {
   margin: 5px;
   padding: 5px 10px;
   border-radius: 5px;
   font-size: 0.85em;
   font-weight: bold;
   color: #666;
   flex: 1 1 auto;
}
.pool.pure-button.showing {
   background-color: var(--color-primary-orange);
   color: #fff;
}
.pool.pure-button i.fa-star {
   margin-right: 5px;
}
.pool.pure-button.disabled {
   opacity: 0.3;
   cursor:default;
   color: #444;
   background: #ddd;
}
.pool.pure-button.disabled.failed {
   background: #D33;
   color: white;
   opacity: 0.5;
}
div.pools {
   display: grid;
   grid-gap: 10px;
   padding: 0 5px;
   grid-template-columns: repeat(auto-fill, minmax(340px, 1fr) ) ;
}
.more-panel {
   border: 1px solid #ccc;
   padding: 10px;
   text-align: center;
   cursor: pointer;
   border-radius: 0 0 5px 5px;
   color: #444;
   background: #e5e5e5
}
.more-panel:hover {
   color: var(--color-link);
}
.more-panel:hover .more-icon {
   opacity: 0.9;
   color: var(--color-link);
}
.more-icon {
   opacity: 0.6;
   margin-left: 5px;
   display: inline-block;
}

.pool-titlebar {
   padding: 0;
   background-color: var(--color-primary-orange);
   color: white;
   font-weight: bold;
   font-size: 0.9em;
   border-radius: 5px 5px 0 0;
   
}
.title1 {
   padding: 5px;
   display: flex;
   flex-flow: row;
   align-items: center;
   justify-content: space-between;
   border-radius: 5px 5px 0 0;
   background: var(--color-dark-orange);
}
.title1 .pool-name {
   margin-left: 5px;
}
.title1 .hide-pool {
   cursor: pointer;
   font-size: 1.3em;
   margin-left: auto; /* put close on right */
}
.query-summary {
   text-align: left;
   margin: 0 0 0.2vw 0;
   font-weight: bold;
   font-size: 1.1em;
}
.summary {
   margin: 0 0 0.2vw 0;
   font-weight: 500;
   text-align: left;
   font-size: 0.85em;
   position: relative;
}
.summary .subtotal {
   display: block;
   margin: 2px 0 2px 15px;
}
@media only screen and (min-width: 768px) {
   div.results-panel {
      margin: 0 5vw 5vw 5vw;
      padding: 0;
   }
}
@media only screen and (max-width: 768px) {
   div.results-panel {
      margin: 0 2vw 2vw 2vw;
      padding: 0;
   }
}
.refine {
   margin: 0 0 0 15px;
}
</style>
