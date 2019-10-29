<template>     
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
               background="var(--color-brand-blue)" color="white">
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
         <div class="result" v-for="(hit,idx) in result.hits.slice(0,3)" :key="idx">
            <SearchHit v-if="hit.grouped==false" v-bind:details="false" :pool="result.pool.id" :hit="hit" :key="idx"/>
            <GroupedSearchHit v-else :hitIdx="idx" :pool="result.pool.id" :hit="hit" :key="idx"/>
         </div>
         <div @click="selectPool(visibleIdx)" class="more-panel">
            See More Results&nbsp;<i class="more-icon fas fa-external-link-alt"></i>
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
export default {
   components: {
      SearchHit,AccordionContent,GroupedSearchHit
   },
   computed: {
      ...mapGetters({
         visibleResults: 'visibleResults',
         visibleResultIdx: 'visibleResultIdx',
         hasFilter: 'filters/hasFilter',
         poolFilter: 'filters/poolFilter',
         isTargetPool: "preferences/isTargetPool",
      }),
      ...mapState({
         total: state=>state.total,
         results: state=>state.results,
         searchMode: state=>state.query.mode,
      }),
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
      formatFilterValues(values) {
         return values.join(", ")
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
div.accordion {
   font-size: 0.9em;
   padding: 0 10px 5px 10px;
}
.pool-info {
   border-right: 1px solid #ccc;
   border-left: 1px solid #ccc;
   border-bottom: 1px solid #ccc;
   margin: 0;
   padding: 0px;
   font-size: 0.7em;
   font-weight: 500;
   background-color: #ccc;
}
.metrics {
   padding: 5px 10px;
   color: #333;
   font-weight: 500;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
}
.result {
   border: 1px solid #ccc;
   border-bottom: 0;
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
   text-align: left;
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
   background: #e5e5e5;
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
   background-color: var(--color-brand-blue);
   color: white;
   font-weight: bold;
   font-size: 0.9em;
   border-radius: 5px 5px 0 0;

}
.title1 {
   padding: 10px;
   display: flex;
   flex-flow: row;
   align-items: center;
   justify-content: space-between;
   border-radius: 5px 5px 0 0;
   background: var(--color-brand-blue);
}
.title1 .pool-name {
   font-size: 1.5em;
   font-weight: 900;
}
.title1 .hide-pool {
   cursor: pointer;
   font-size: 1.3em;
   margin-left: auto; /* put close on right */
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
</style>
