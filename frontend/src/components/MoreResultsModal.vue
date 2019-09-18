<template>
   <div @click="closePool" class="more-results-overlay"> 
      <div @click="blockClick" class="more-results-modal">
         <div id="more-header" class="more-header">
            <div  @click="closePool"  class="overlay-title">
               <span class="pool-name">{{selectedResults.pool.summary}}</span>
               <i class="pool-close fas fa-times-circle"></i>
            </div>
            <AccordionContent title="Description" align="left-narrow" 
               background="var(--color-primary-orange)" color="white"
               v-on:accordion-collapsed="calcHeaderHeight"
               v-on:accordion-expanded="calcHeaderHeight"
            >
               {{selectedResults.pool.description}}
            </AccordionContent>
            <SearchFilters />
         </div>
         <div class="hits" id="hits-scroller">
            <div class="summary"><b>{{selectedResults.total}} results for </b>{{queryString()}}</div>
            <template v-for="(hit,idx) in selectedResults.hits">
               <SearchHit v-if="hit.grouped==false"  :pool="selectedResults.pool.id" :hit="hit" :key="idx"/>
               <GroupedSearchHit v-else :pool="selectedResults.pool.id" :hitIdx="idx" :hit="hit" :key="idx"/>
            </template>
            <infinite-loading @infinite="loadMoreResults" ref="infiniteLoader" >
               <span slot="no-more">No more matches</span>
               <span slot="spinner"><img src="../assets/searching.gif"></span>
            </infinite-loading>
         </div>
      </div>
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
         rawQueryString: 'query/string',
         poolFilter: 'filters/poolFilter',
         isGroupSelected: 'isGroupSelected'
      }),
      filterLength() {
         return this.poolFilter(this.selectedResultsIdx, 'raw').length
      }
   },
    watch: {
      filterLength() {
         setTimeout( () => {
            this.calcHeaderHeight()
            // A filter has been aded or removed and length of
            // available results has changed. Need to reset the infinite 
            // loader so all results can be access. Note that caling this on a 
            // timeout of 10 did not work. Peril.
            this.$refs.infiniteLoader.stateChanger.reset()
         }, 500)
      },
      updatingBuckets() {
         setTimeout( () => {
            this.calcHeaderHeight()
         }, 500)
      },
      addingFilter() {
         setTimeout( () => {
            this.calcHeaderHeight()
         }, 10)
      }
   },
   methods: {
      calcHeaderHeight() {
         // scroller starts positioned absolute 0,0 and header floats over it
         // need to update the top of the scroller so it starts where the header
         // ends. this is called any time the header changes size for filter actions
         let hdrEle = document.getElementById("more-header")
         let scroller = document.getElementById("hits-scroller")
         scroller.style.top = hdrEle.offsetHeight+"px"
      },
      queryString() {
         return this.rawQueryString.replace(/\{|\}/g, "")
      },
      blockClick(event) {
        event.stopPropagation() 
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
      closePool() {
          this.$refs.infiniteLoader.stateChanger.reset()
         this.$store.commit("filters/closeAdd")
         this.$store.commit("closePoolResults")
      },
      handleKeyUp(evt) {
         if (evt.keyCode === 27 && this.isGroupSelected == false) {
            this.closePool()
         }
      }
   },
   mounted() {
      this.calcHeaderHeight()
      if ( this.selectedResults.statusCode == 408) {
         this.$store.dispatch("searchSelectedPool")
      }
   },
   created() {
      document.addEventListener('keyup', this.handleKeyUp )
   },
   destroyed() {
      document.removeEventListener('keyup', this.handleKeyUp )
   }
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

.more-results-overlay {
   position: fixed;
   left: 0;
   top: 0;
   bottom: 0;
   right: 0;
   z-index: 1000;
}
.more-results-modal {
   position: fixed;
   right: 0;
   top: 0;
   bottom: 0;
   background: white;
   box-sizing: border-box;
   border-left: 4px solid var(--color-primary-orange);
   box-shadow: -2px 0px 10px #333;
   z-index: 1005;
}
@media only screen and (min-width: 768px) {
   .more-results-modal, .more-results-modal, div.more-header {
      left: 50%;
   }
}
@media only screen and (max-width: 768px) {
   .more-results-modal, .more-results-modal, div.more-header {
      left: 10%;
   }
}
div.more-header {
   cursor: pointer;
   position: absolute;
   right:0;
   left: 0;
   font-size: 1em;
   color: white;
   background: var(--color-primary-orange);
   margin:0;
   text-align: left;
   border-bottom: 5px solid var(--color-primary-orange);
   border-top: 4px solid var(--color-primary-orange);
   z-index: 1020;
}
div.overlay-title {
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   padding: 3px 8px 3px 2px;
}
.pool-name {
   font-weight: bold;
   flex: 1 1 auto;
}
.pool-close { 
   font-size: 1.5em;
   cursor: pointer;
}
.summary {
   text-align: left;
   padding: 5px 10px;
   border-bottom: 1px solid #ccc;
   border-left: 1px solid #ccc;
   background-color: #eee;
}
.hits {
   position: absolute;
   left: 0;
   right: 0;
   bottom: 0;
   overflow: auto;
   overscroll-behavior: contain;
   color: #555;
   z-index: 1010;
}
</style>
