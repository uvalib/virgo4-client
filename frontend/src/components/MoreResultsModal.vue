<template>
   <div @click="closePool" class="more-results-overlay">
      <div class="more-header">
         {{poolDescription(selectedPool.url)}}<i @click="closePool" class="pool-close fas fa-times-circle"></i>
      </div>
      <div class="more-results-content">
         <div  v-infinite-scroll="loadMoreResults" infinite-scroll-disabled="searching"  class="hits">
             <template v-for="hit in selectedPool.hits">
               <SearchHit :hit="hit" :key="hit.id"/>
            </template>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHit from "@/components/SearchHit"
import infiniteScroll from 'vue-infinite-scroll'

export default {
   directives: {
      infiniteScroll
   },
   components: {
      SearchHit
   },
   computed: {
      ...mapState({
         results: state=>state.results,
         searching: state=>state.searching
      }),
      ...mapGetters({
         selectedPool: 'selectedPool',
         findPool: 'pools/find',
         hasMoreHits: 'hasMoreHits'
      }),
   },
   methods: {
      loadMoreResults() {
         if (this.hasMoreHits) {
            this.$store.dispatch("moreResults")
         }
      },
      closePool() {
         this.$store.commit("closePoolResults")
      },
      poolDescription(url) {
         let p = this.findPool(url) 
         if (p) {
            return p.description
         }
         return url
      },
   }
}
</script>

<style scoped>
.more-results-overlay {
   position: fixed;
   left: 0;
   top: 0;
   width: 100%;
   height: 100%;
   z-index: 1000;
   background:rgba(0,0,0,0.6);
}
.more-results-content {
   position: fixed;
   right: 0;
   top: 0;
   height: 100%;
   z-index: 100;
   background: white;
   box-sizing: border-box;
}
@media only screen and (min-width: 768px) {
   .more-results-modal, .more-results-content, div.more-header {
      left: 50%;
   }
}
@media only screen and (max-width: 768px) {
   .more-results-modal, .more-results-content, div.more-header {
      left: 10%;
   }
}
div.more-header {
   position: fixed;
   right: 0;
   font-size: 1.1em;
   color: white;
   background: var(--color-primary-orange);
   margin:0;
   padding: 5px 15px;
   text-align: left;
   z-index: 500;
}
.pool-close {
   position: absolute;
   right: 8px;
   top: 8px;
   cursor: pointer;
   opacity: 0.6;
}
.pool-close:hover {
   opacity: 1;
}
.hits {
   position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  padding-top: 40px;
    box-sizing: border-box;
}
</style>
