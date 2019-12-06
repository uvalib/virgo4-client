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
         if (window.window.scrollY > 800) {
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
.scroll-to-top {
   display: flex;
   flex-basis: auto;
   flex-direction: column;
   position: fixed;
   background-color: white;
   color: var(--uvalib-brand-orange);
   font-size: 2.5em;
   font-weight: 100;
   border: 3px solid var(--uvalib-brand-orange);
   border-radius: 50%;
   cursor: pointer;
   align-items: center;
   bottom: 30px;
   right: 25px;
   box-shadow: rgba(0, 0, 0, 0.14) 0px 2px 2px 0px;
   box-sizing: border-box;
   justify-content: center;
   min-width: 0px;
   padding: 0px 0px 4px 0px;
   width: 56px;
   height: 56px;
   z-index: 0;
}
.scroll-to-top.mobile {
   position: fixed;
   background-color: white;
   color: var(--color-brand-orange);
   border: 3px solid var(--color-brand-orange);
   font-size: 2em;
   font-weight: 100;
   padding: 0px 12px;
   right: 5px;
   bottom: 45px;
   cursor: pointer;
}
.scroll-to-top:hover, .scroll-to-top.mobile:hover {
  color: white;
  background-color: var(--uvalib-brand-orange);
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
</style>
