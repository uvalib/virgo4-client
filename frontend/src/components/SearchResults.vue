<template>
   <div class="results-panel">
      <div class="toolbar">
         <p class="summary">{{searchSummary}}</p>
         <template v-if="total>0" >
            <p class="curr-pool">
               <span>Showing {{ currPool.total }} results from {{ currPool.name}}</span>
            </p>
            <span @click="showPickerClicked" class="other-pools pure-button pure-button-primary">Other Pool Results</span>
            <ResultsPager v-if="currPoolHitCnt>0"/>
            <PoolResultsPicker v-if="showResultsPicker"/>
         </template>
         <template v-else>
            <h4 class="no-hits">No matching records found</h4>
         </template>
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
import PoolResultsPicker from "@/components/PoolResultsPicker"
export default {
   components: {
      ResultsPager, PoolResultsPicker
   },
   computed: {
      ...mapGetters({
         currPool: 'currPool'
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
      showPickerClicked() {
        this.$store.commit("toggleResultsPicker")
      }
   }
}
</script>

<style scoped>
.other-pools {
   font-size: 0.75em;
   padding: 3px 12px;   
   float: left;
   font-weight: bold;
}
h4.no-hits {
   text-align: center;
   color: #555;
   font-size: 1.25em;
}
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
   position: relative;
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
