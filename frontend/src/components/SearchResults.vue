<template>
   <div class="results-panel">
      <div class="toolbar">
         <p class="summary">{{searchSummary}}</p>
         <p class="curr-pool">Showing {{ currPool.total }} results from {{ currPool.name}} </p>
         <ResultsPager v-if="currPoolHitCnt>0"/>
      </div>
      <div class="hits">
         <div class="hit" v-for="hit in currPool.hits" :key="hit.id">
            <div>
               <label>Identifier:</label>
               <span class="value">{{hit.id}}</span>
            </div>
            <div>
               <label>Title:</label>
               <span class="value">{{hit.title}}</span>
            </div>
            <div>
               <label>Author:</label>
               <span class="value">{{hit.author}}</span>
            </div>
         </div>
      </div>
      <div class="toolbar">
         <ResultsPager v-if="currPoolHitCnt>0"/>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import ResultsPager from "@/components/ResultsPager"
export default {
   components: {
      ResultsPager
   },
   computed: {
      ...mapGetters({
         currPool: 'currPool'
      }),
      ...mapState({
         searchSummary: state => state.searchSummary,
      }),
      currPoolHitCnt() {
         return this.currPool.hits.length
      }
   }
}
</script>

<style scoped>
.curr-pool {
   text-align: left;
}
.summary {
   margin: 10px;
   font-size: 0.9em;
   font-weight: 100;
   text-align: center;
}
div.toolbar {
   text-align: right;
}
div.results-panel {
   max-width: 600px;
   margin: 0 auto 2em auto;
   padding: 0 0.75em;
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
}
label {
   font-weight: bold;
   width: 80px;
   text-align: right;
   margin-right: 10px;
   display: inline-block;
}
</style>
