<template>
   <div class="pool-results">
      <div class="results-header">
         <div class="desc">
            {{selectedResults.pool.description}}
         </div>
         <SearchFilters />
      </div>
      <div class="hits">
         <div class="hits-content">
            <div v-for="(hit,idx) in selectedResults.hits" class="hit-wrapper" :key="idx">
               <SearchHit :pool="selectedResults.pool.id" :count="idx+1" :hit="hit" :key="idx"/>
            </div>
         </div>
      </div>
      <ScrollToTop />
      <div v-if="hasMoreHits" @click="loadMoreResults" class="see-more">
         <span v-if="loadingMore">
           <div class="spinner">
             <div class="bounce1"></div>
             <div class="bounce2"></div>
             <div class="bounce3"></div>
           </div>
         </span>
         <span v-else>Load More Results</span>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHit from "@/components/SearchHit"
import SearchFilters from "@/components/SearchFilters"
import ScrollToTop from "@/components/ScrollToTop"
export default {
   components: {
      SearchHit, SearchFilters, ScrollToTop
   },
   data: function() {
      return {
         loadingMore: false
      }
   },
   computed: {
      ...mapState({
         results: state=>state.results,
         searching: state=>state.searching,
         selectedResultsIdx: state => state.selectedResultsIdx,
         addingFilter: state => state.filters.adding,
         updatingFacets: state => state.filters.updatingFacets,
      }),
      ...mapGetters({
         selectedResults: 'selectedResults',
         hasMoreHits: 'hasMoreHits',
      }),
   },
   watch: {
      selectedResultsIdx () {
         if (this.selectedResults.statusCode == 408 && this.selectedResults.total == 0) {
            this.$store.dispatch("searchSelectedPool")
         }
      },
   },
   methods: {
      loadMoreResults() {
         if ( this.searching) return

         if (this.hasMoreHits) {
            this.loadingMore = true
            this.$store.dispatch("moreResults").finally( ()=> {
                this.loadingMore = false
            })
         }
      }
   }
}
</script>
<style scoped>
.desc  {
   padding: 10px;
   border-left: 1px solid var(--uvalib-brand-blue);
   border-right: 1px solid var(--uvalib-brand-blue);
   font-size: 0.9em;
}
.pool-results {
   border: 0;
   position: relative;
   top: -5px;
}
div.results-header {
   font-size: 1em;
   color: white;
   background: var(--uvalib-brand-blue);
   margin: 0 5px;
   text-align: left;
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.12);
   margin-bottom: 1rem;
}
.pool-name {
   font-weight: bold;
}
.hits-content {
   text-align: left;
   margin: 20px 0;
}
.hit-wrapper {
   margin: 0 5px 20px 5px;
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.12);
   margin-bottom: 1rem;
}
.hit-wrapper:last-child {
   margin-bottom: 0;
}
@media only screen and (max-width: 600px) {
   .hit-wrapper {
     max-width: 94vw;
   }
}
.see-more, .no-more {
   padding: 10px;
   background: var(--uvalib-brand-blue);
   border: 5px solid var(--uvalib-brand-blue);
   color: white;
   cursor: pointer;
   font-weight: bold;
}
.see-more:hover {
   text-decoration: underline;
   color: var(--uvalib-blue-alt-light);
}
.no-more {
   cursor: default;
}
.spinner {
  margin: 0 auto;
  width: 80px;
  text-align: center;
}
.spinner > div {
  width: 18px;
  height: 18px;
  background-color: var(--uvalib-brand-orange);
  border-radius: 100%;
  display: inline-block;
  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  margin: 0 2px;
}
.spinner .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.spinner .bounce2 {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
@-webkit-keyframes sk-bouncedelay {
  0%, 80%, 100% { -webkit-transform: scale(0) }
  40% { -webkit-transform: scale(1.0) }
}
@keyframes sk-bouncedelay {
  0%, 80%, 100% {
    -webkit-transform: scale(0);
    transform: scale(0);
  } 40% {
    -webkit-transform: scale(1.0);
    transform: scale(1.0);
  }
}
</style>
