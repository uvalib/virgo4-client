<template>
   <div class="pool-results">
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
         isGroupSelected: 'isGroupSelected'
      }),
      filterLength() {
         return this.poolFilter(this.selectedResultsIdx, 'raw').length
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
   },
   created() {
      // this is only shown when there is one result. auto pick that result
      this.$store.commit("selectPoolResults", 0)
   },
}
</script>

<style>
div.infinite-status-prompt {
   background-color: var(--color-primary-orange);
   color: white;
   font-weight: 500;
   padding: 5px 0 0 0;
}
div.infinite-status-prompt  .loading-default {
   color: white;
   border: 1px solid white;
}
</style>

<style scoped>
.filters {
   border-radius: 5px;
}
div.results-header {
   font-size: 1em;
   color: white;
   background: var(--color-brand-blue);
   margin:0;
   text-align: left;
   padding: 5px;
   border-radius: 5px;
   margin-bottom: 10px;
}
.pool-name {
   font-weight: bold;
}
.hits-content {
   text-align: left;
   margin: 0;
}
.hit-wrapper {
   margin: 10px;
   border:1px solid #ccc;
   /* flex: 1 1 0; */
   border-radius: 5px;
}
</style>
