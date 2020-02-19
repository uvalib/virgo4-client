<template>
   <div class="pool-results">
      <div class="results-header">
         <div class="desc">
            {{selectedResults.pool.description}}
         </div>
         <div v-if="hasLogo" class="source-logo">
            <a v-if="hasURL" :href="poolExtURL(selectedResults.pool.id)" target="_blank">
               <img class ="pure-img" :src="poolLogo(selectedResults.pool.id)">
            </a>
             <img v-else class ="pure-img" :src="poolLogo(selectedResults.pool.id)">
         </div>
         <SearchFilters />
      </div>
      <div class="hits">
         <ul v-if="selectedResults.pool.mode=='image'" class="image hits-content">
            <li v-for="(hit,idx) in selectedResults.hits" class="image hit-wrapper" :key="idx">
               <ImageSearchHit :pool="selectedResults.pool.id" :count="idx+1" :hit="hit" :key="idx"/>
            </li>
         </ul>
         <div v-else class="hits-content">
            <div v-for="(hit,idx) in selectedResults.hits" class="hit-wrapper" :key="idx">
               <SearchHit :pool="selectedResults.pool.id" :count="idx+1" :hit="hit" :key="idx"/>
            </div>
         </div>
      </div>
      <ScrollToTop />
      <div v-if="hasMoreHits" @click="loadMoreResults" class="see-more">
         <span v-if="loadingMore">
            <V4Spinner v-if="loadingMore" color="white"/>
         </span>
         <span v-else>Load More Results</span>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHit from "@/components/SearchHit"
import ImageSearchHit from "@/components/ImageSearchHit"
import SearchFilters from "@/components/SearchFilters"
import ScrollToTop from "@/components/ScrollToTop"
import V4Spinner from "@/components/V4Spinner"
export default {
   components: {
      ImageSearchHit, SearchHit, SearchFilters, ScrollToTop, V4Spinner
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
         poolLogo: 'pools/logo',
         poolExtURL: 'pools/externalURL',
      }),
      hasLogo() {
         return this.poolLogo(this.selectedResults.pool.id) != ""
      },
      hasURL() {
         return this.poolExtURL(this.selectedResults.pool.id) != ""
      }
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
.image.hits-content {
   text-align: left;
   margin: 20px 0;
   height: 100%;
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
   align-items: flex-start;
   align-content: flex-start;
   list-style: none;
   padding:0;
   margin:0;
}
.image.hit-wrapper {
    box-shadow: none;
    margin:0;
    padding:0;
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
.source-logo {
   background: white;
   padding: 5px;
}
</style>
