<template>
   <div class="results-panel">
      <div class="toolbar">
         <p class="summary">{{searchSummary}}</p>
         <template v-if="total>0" >
            <p class="curr-pool">
               <span>Showing {{ currPool.total }} results from {{ currPool.name}}</span>
            </p>
            <ResultsPager v-if="currPoolHitCnt>0"/>
            <PoolResultsPicker/>
            <div style="clear:both;"></div>
         </template>
         <template v-else>
            <h4 class="no-hits">No matching records found</h4>
         </template>
      </div>
      <DebugPanel v-if="hasDebugInfo" :debugInfo="debugInfo"/>
      <div class="hits">
         <div class="hit" v-for="hit in currPool.hits" :key="hit.id">
            <div>
               <label>Identifier:</label>
               <span class="value">{{hit.id}}</span>
            </div>
            <div>
               <label>Title:</label>
               <span class="value">{{fullTitle(hit)}}</span>
            </div>
            <div>
               <label>Author:</label>
               <span class="value">{{hit.author}}</span>
            </div>
            <DebugPanel v-if="hasDebug(hit)" :debugInfo="hit.debug"/>
         </div>
      </div>
      <div class="toolbar">
         <ResultsPager v-if="currPoolHitCnt>0"/>
         <div style="clear:both;"></div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import ResultsPager from "@/components/ResultsPager"
import PoolResultsPicker from "@/components/PoolResultsPicker"
import DebugPanel from "@/components/DebugPanel"
export default {
   components: {
      ResultsPager, PoolResultsPicker, DebugPanel
   },
   computed: {
      ...mapGetters({
         currPool: 'currPool',
         hasDebugInfo: 'hasDebugInfo',
         debugInfo: 'debugInfo'
      }),
      ...mapState({
         total: state=>state.total,
         searchSummary: state => state.searchSummary,
         showResultsPicker: state => state.showResultsPicker
      }),
      currPoolHitCnt() {
         return this.currPool.hits.length
      }
   },
   methods: {
      fullTitle(hit) {
         if (hit.subtitle) {
            return hit.title + " " + hit.subtitle
         }
         return hit.title
      },
      hasDebug(hit) {
         return hit.debug
      }
   }
}
</script>

<style scoped>
h4.no-hits {
   text-align: center;
   color: var(--color-primary-text);;
   font-size: 1.25em;
}

.summary, .curr-pool {
   margin: 0 0 0.4vw 0;
   font-weight: 100;
   text-align: left;
}
.curr-pool {
   margin-bottom: 1vw;
}
div.toolbar {
   position: relative;
}
@media only screen and (min-width: 768px) {
   div.results-panel {
      margin: 0 auto 5vw auto;
      padding: 0;
      max-width: 800px;
   }
}
@media only screen and (max-width: 768px) {
   div.results-panel {
      margin: 0 2vw 2vw 2vw;
      padding: 0;
   }
}
div.hits {
   text-align: left;
}
.hit {
   width: 100%;
   border: 1px solid #ccc;
   padding: 10px;
   margin: 10px 0;
   box-sizing: border-box;
   border-radius: 5px;
}
label {
   font-weight: bold;
   width: 80px;
   text-align: right;
   margin-right: 10px;
   display: inline-block;
}
</style>
