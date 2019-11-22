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
      <transition name="message-transition"
          enter-active-class="animated faster fadeIn"
          leave-active-class="animated faster fadeOut">
         <div v-if="showScrollTop" class="scroll-to-top" :class="{mobile: smallScreen}" @click="backToTop">
            <i class="fas fa-angle-up"></i>
         </div>
      </transition>
      <div v-if="hasMoreHits" @click="loadMoreResults" class="see-more">
         <span v-if="loadingMore"><img src="../assets/searching.gif"></span>
         <span v-else>Load More Results</span>
      </div>
      <div v-else class="no-more"></div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHit from "@/components/SearchHit"
import SearchFilters from "@/components/SearchFilters"
export default {
   components: {
      SearchHit, SearchFilters
   },
   data: function() {
      return {
         showScrollTop: false,
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
         displayWidth: state => state.system.displayWidth,
      }),
      ...mapGetters({
         selectedResults: 'selectedResults',
         hasMoreHits: 'hasMoreHits',
      }),
      smallScreen() {
         return this.displayWidth <= 810
      },
   },
   watch: {
      selectedResultsIdx () {
         if (this.selectedResults.statusCode == 408 && this.selectedResults.total == 0) {
            this.$store.dispatch("searchSelectedPool")
         }
      },
   },
   methods: {
      backToTop: function() {
         var scrollStep = -window.scrollY / (500 / 10),
         scrollInterval = setInterval(()=> {
            if ( window.scrollY != 0 ) {
               window.scrollBy( 0, scrollStep ) 
            } else {
               clearInterval(scrollInterval)
            }
         },10)
      },
      loadMoreResults() {
         if ( this.searching) return

         if (this.hasMoreHits) {
            this.loadingMore = true
            this.$store.dispatch("moreResults").finally( ()=> {
                this.loadingMore = false
            })
         } 
      },
      scrollChecker() {
         if (window.window.scrollY > 1500) {
            this.showScrollTop = true
         } else {
            this.showScrollTop = false
         }
      }
   },
   created: function() {
      window.addEventListener("scroll", this.scrollChecker)
   },
   destroyed: function() {
      window.removeEventListener("scroll", this.scrollChecker)
   }
}
</script>

<style scoped>
.desc  {
   padding: 5px;
   font-size: 0.9em;
}
.filters {
   border-radius: 5px 5px 0 0;
}
.pool-results {
   border: 0;
   border-radius: 5px;
   background-color: var(--color-brand-blue);
   position: relative;
   top: -5px;
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
}
.hit-wrapper:last-child {
   margin-bottom: 0;
}
.scroll-to-top {
   position: fixed;
   background: var(--color-brand-orange);
   color: white;
   font-size: 2em;
   font-weight: 100;
   padding: 0px 12px;
   border: 2px solid black;
   right: 15px;
   bottom: 15px;
   cursor: pointer;
}
.scroll-to-top.mobile {
   position: fixed;
   background: var(--color-brand-orange);
   color: white;
   font-size: 2em;
   font-weight: 100;
   padding: 0px 12px;
   border: 2px solid black;
   right: 5px;
   bottom: 45px;
   cursor: pointer;
}
.see-more, .no-more {
   padding: 10px;
   background: var(--color-brand-blue);
   border: 5px solid var(--color-brand-blue);
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
</style>
