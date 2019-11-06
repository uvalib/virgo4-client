<template>
   <div class="results-panel">
      <div class="query-summary">
         <span>Showing results for: <i>{{queryString}}</i></span>
      </div>
      <div class="toolbar">
         <div class="right-indent">
            <p class="summary">
               <span>{{total}} matches found in {{results.length}} sources.</span>
               <span class="subtotal" v-if="skippedPoolCount">&nbsp;{{skippedPoolCount}} source(s) not searched. Click source to search.</span>
               <span class="subtotal" v-if="failedPoolCount">&nbsp;{{failedPoolCount}} source(s) failed.</span>
            </p>
         </div>
         <div class="search-controls">
            <AvailabilitySelector/>
            <span v-if="searchMode=='basic'" @click="refineClicked()" class="refine pure-button pure-button-primary">Refine Search</span>
         </div>

         <div class="pool-buttons">
            <template  v-for="(r,idx) in results">
               <div @click="resultsButtonClicked(idx)" :key="idx" class="pool pure-button" v-bind:class="{showing: idx == selectedResultsIdx}">
                  <span>
                     <i v-if="isTargetPool(r.pool.url)" class="fas fa-star"></i>
                     <span>{{r.pool.name}}&nbsp;</span>
                     <span v-if="poolFailed(r)" class="total">(failed)</span>
                     <span v-else-if="wasPoolSkipped(r)" class="total">(not searched)</span>
                     <span v-else class="total">({{r.total}})</span>
                  </span>
               </div>
            </template>
         </div>
      </div>

      <PoolResultDetail v-if="selectedResultsIdx > -1" />

   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import PoolResultDetail from "@/components/PoolResultDetail"
import AvailabilitySelector from '@/components/AvailabilitySelector'
export default {
   components: {
      AvailabilitySelector,PoolResultDetail
   },
   computed: {
      ...mapGetters({
         rawQueryString: 'query/string',
         hitPoolCount: 'hitPoolCount',
         skippedPoolCount: 'skippedPoolCount',
         failedPoolCount: 'failedPoolCount',
         hasFilter: 'filters/hasFilter',
         poolFilter: 'filters/poolFilter',
         isTargetPool: "preferences/isTargetPool",
      }),
      ...mapState({
         selectedResultsIdx: state=>state.selectedResultsIdx,
         total: state=>state.total,
         results: state=>state.results,
         searchMode: state=>state.query.mode,
      }),
      queryString() {
         return this.rawQueryString.replace(/\{|\}/g, "")
      },
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
      resultsButtonClicked(resultIdx) {
         let r = this.results[resultIdx]
         if ( this.poolFailed(r)) return
         this.$store.commit("selectPoolResults", resultIdx)
      },
   }
}
</script>

<style scoped>
#app .pool-buttons div.pool.pure-button:first-child {
   margin-left: 0;
}
#app .pool-buttons div.pool.pure-button:last-child {
   margin-right: 0;
}
.pool-buttons div.pool.pure-button {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
}
.total {
   margin-right: 10px;
}
.pool-buttons {
   margin: 5px 0 0 0;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
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
}
.pool.pure-button.showing {
   background-color: var(--color-brand-blue);
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
div.search-controls {
   display: flex;
   flex-flow: row wrap;
   font-size: 0.9em;
   justify-content: space-between;
   margin-top:10px;
   align-items: stretch;
}
</style>
