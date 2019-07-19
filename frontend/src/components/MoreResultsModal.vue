<template>
   <div @click="closePool" class="more-results-overlay">
      <div class="more-results-modal">
         <h2>{{poolDescription(selectedPool.url)}}<i @click="closePool" class="pool-close fas fa-times-circle"></i></h2>
         <div class="hits">
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
export default {
   components: {
      SearchHit
   },
   computed: {
      ...mapState({
         results: state=>state.results,
      }),
      ...mapGetters({
         selectedPool: 'selectedPool',
         findPool: 'pools/find',
      }),
   },
   methods: {
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
.more-results-modal {
   position: absolute;
   right: 0;
   top: 0;
   height: 100%;
   z-index: 1000;
   background: white;
}
@media only screen and (min-width: 768px) {
   .more-results-modal {
      left: 50%;
   }
}
@media only screen and (max-width: 768px) {
   .more-results-modal {
      left: 10%;
   }
}
h2 {
   font-size: 1.1em;
   color: white;
   background: var(--color-primary-orange);
   margin:0;
   padding: 5px 15px;
   text-align: left;
   position: absolute;
   z-index: 2;
   left: 0;
   right: 0;
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
  padding-top:40px;
}
</style>
