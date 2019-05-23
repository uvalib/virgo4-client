<template>
   <div class="results-panel">
      <p class="summary">{{searchSummary}}</p>
      <div class="hits">
         <div class="hit" v-for="hit in hits" :key="hit.id">
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
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         hits: state => state.hits,
         searchSummary: state => state.searchSummary
      })
   }
}
</script>

<style scoped>
div.hits {
   width: 50%;
   margin: 0 auto;
   text-align: left;
}
.hit {
   width: 100%;
   margin:15px;
}
label {
   font-weight: bold;
   width: 80px;
   text-align: right;
   margin-right: 10px;
   display: inline-block;
}
</style>
