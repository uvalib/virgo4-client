<template>
   <v-popover style="float:left;">
      <span class="other-pools pure-button pure-button-secondary">Other Pool Results</span>
      <div class="results-picker"  slot="popover">
         <h4>Pool Results</h4>
         <div class="pools-list">
            <div class="results" v-for="(r,idx) in results" :key="r.url">
               <template v-if="r.total > 0">
                  <p v-close-popover @click="poolClicked" :data-idx="idx">{{r.name}} ({{r.total}} hits)</p>
            </template>
            </div>
         </div>
      </div>
   </v-popover>
</template>

<script>
import { mapState } from "vuex"
export default {
   components: {
   },
   computed: {
      ...mapState({
         results: state => state.results,
      })
   },
   methods: {
      poolClicked(event) {
         let idx = event.currentTarget.dataset.idx 
         this.$store.commit("switchResultsPool", idx)
      }
   }
}
</script>

<style scoped>
.other-pools {
   font-size: 0.75em;
   padding: 3px 12px;   
   background: #0078e7;
   color:white;
   font-weight: bold;
}
.results-picker {
   background: white;
   padding: 0;
   text-align: left;
   font-size: 0.8em;
   box-shadow: 2px 2px 10px #ccc;
   color: #555;
   display: inline-block;
}
.pools-list {
   padding: 5px 0;
   max-height: 300px;
   overflow-y: scroll;
   border: 1px solid #ccc;
   border-top: none;
}
.pools-list p {
   margin: 0;
   padding: 2px 12px;
}
.pools-list p:hover {
   cursor: pointer;
   background: #f5f5ff;
}
h4 {
   padding: 5px;
   margin: 0;
   text-align: left;
   font-size: 0.8em;
   background: #0078e7;
   color: white;
   position: relative;
}
i.close {
  opacity: 0.8;
  font-size: 1.1em;
  position: absolute;
  top: 7px;
  right: 7px;
}
i.close:hover {
   opacity: 1;
   cursor: pointer;
}
</style>
