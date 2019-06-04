<template>
   <div class="results-picker">
      <h4>Pool Results<i class="action close fas fa-times-circle" @click="closeClicked"></i></h4>
      <div class="pools-list">
         <div class="results" v-for="(r,idx) in results" :key="r.url">
            <template v-if="r.total > 0">
               <p @click="poolClicked" :data-idx="idx">{{r.name}} ({{r.total}} hits)</p>
         </template>
         </div>
      </div>
   </div>
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
      closeClicked() {
         this.$store.commit("toggleResultsPicker")
      },
      poolClicked(event) {
         let idx = event.currentTarget.dataset.idx 
         this.$store.commit("switchResultsPool", idx)
         this.$store.commit("toggleResultsPicker")
      }
   }
}
</script>

<style scoped>
.results-picker {
   position: absolute;
   background: white;
   padding: 0;
   text-align: left;
   font-size: 0.8em;
}
.pools-list {
   padding: 5px 15px;
   max-height: 300px;
   overflow-y: scroll;
   border: 1px solid #ccc;
   border-top: none;
}
.pools-list p {
   margin: 0;
   padding: 2px 6px
}
.pools-list p:hover {
   cursor: pointer;
   background: rgb(66, 184, 221);
   border-radius: 20px;
   color:white;
}
h4 {
   padding: 5px;
   margin: 0;
   text-align: left;
   font-size: 0.8em;
   background: #449;
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
