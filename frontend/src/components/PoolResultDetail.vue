<template>
   <div v-if="searching == false" class="pool-results">
      <div class="results-header">
         <div class="pool-name">{{selectedResults.pool.name}}</div>
         <AccordionContent title="Description" align="left-narrow" 
            background="var(--color-brand-blue)" color="white">
            {{selectedResults.pool.description}}
         </AccordionContent>
         <SearchFilters />
      </div>
      <div class="hits">
         <div class="hits-content">
            <div v-for="(hit,idx) in selectedResults.hits" class="hit-wrapper" :key="idx">
               <SearchHit v-if="hit.grouped==false"  :pool="selectedResults.pool.id" :hit="hit" :key="idx"/>
               <GroupedSearchHit v-else :pool="selectedResults.pool.id" :hitIdx="idx" :hit="hit" :key="idx"/>
            </div>
         </div>
      </div>
      <infinite-loading @infinite="loadMoreResults" ref="infiniteLoader" >
         <span slot="no-more">No more matches</span>
         <span slot="spinner"><img src="../assets/searching.gif"></span>
      </infinite-loading>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHit from "@/components/SearchHit"
import GroupedSearchHit from "@/components/GroupedSearchHit"
import SearchFilters from "@/components/SearchFilters"
import InfiniteLoading from 'vue-infinite-loading'
import AccordionContent from '@/components/AccordionContent'
export default {
   components: {
      SearchHit,SearchFilters,InfiniteLoading,AccordionContent,GroupedSearchHit
   },
   computed: {
      ...mapState({
         results: state=>state.results,
         searching: state=>state.searching,
         selectedResultsIdx: state => state.selectedResultsIdx,
         addingFilter: state => state.filters.adding,
         updatingBuckets: state => state.filters.updatingBuckets,
      }),
      ...mapGetters({
         selectedResults: 'selectedResults',
         hasMoreHits: 'hasMoreHits',
         poolFilter: 'filters/poolFilter',
      }),
      filterLength() {
         return this.poolFilter(this.selectedResultsIdx, 'raw').length
      }
   },
   watch: {
      selectedResultsIdx () {
         if ( this.$refs.infiniteLoader ) {
            this.$refs.infiniteLoader.stateChanger.reset()
         }
         if (this.selectedResults.statusCode == 408 && this.selectedResults.total == 0) {
            alert("GET")
            this.$store.dispatch("searchSelectedPool")
         }
      }
   },
   methods: {
      loadMoreResults($state) {
         if ( this.searching) return

         if (this.hasMoreHits) {
            this.$store.dispatch("moreResults").finally( ()=> {
               $state.loaded()
            })
         } else {
            $state.loaded()
            $state.complete() 
         }
      },
   }
}
</script>

<style>
div.infinite-status-prompt {
   background-color: var(--color-brand-blue);
   color: white;
   font-weight: bold;
   padding: 5px;
   border-radius: 0;
}
</style>

<style scoped>
.filters {
   border-radius: 5px 5px 0 0;
}
.pool-results {
   border: 1px solid #ccc;
   border-radius: 5px;
   background-color: var(--color-brand-blue);
}
div.results-header {
   font-size: 1em;
   color: white;
   background: var(--color-brand-blue);
   margin:0;
   text-align: left;
   padding: 5px 5px 0 5px;
   border-radius: 5px 5px 0 0;
   margin-bottom: 0px;
}
.pool-name {
   font-weight: bold;
}
.hits-content {
   text-align: left;
   margin: 0;
}
.hit-wrapper {
   margin: 5px;
   /* border:1px solid #ccc;
   border-radius: 5px; */
}
.hit-wrapper:last-child {
   margin-bottom: 0;
}
</style>
