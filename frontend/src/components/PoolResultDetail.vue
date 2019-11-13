<template>
   <div v-if="searching == false" class="pool-results">
      <div class="results-header">
         <div class="desc">
            {{selectedResults.pool.description}}
         </div>
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
      <transition name="message-transition"
          enter-active-class="animated faster fadeIn"
          leave-active-class="animated faster fadeOut">
         <div v-if="showScrollTop" class="scroll-to-top" @click="backToTop">
            <i class="fas fa-angle-up"></i>
         </div>
      </transition>
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
export default {
   components: {
      SearchHit,SearchFilters,InfiniteLoading,GroupedSearchHit
   },
   data: function() {
      return {
         showScrollTop: false
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
            this.$store.dispatch("searchSelectedPool")
         }
      }
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
      scrollChecker() {
         if (window.window.scrollY > 3000) {
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
.desc  {
   padding: 5px;
   font-size: 0.9em;
}
.filters {
   border-radius: 5px 5px 0 0;
}
.pool-results {
   border: 1px solid #ccc;
   border-top: 0;
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
   border-radius: 5px;
   border: 2px solid white;
   box-shadow: 0px 0px 5px black;
   right: 15px;
   bottom: 15px;
   cursor: pointer;
}
</style>
