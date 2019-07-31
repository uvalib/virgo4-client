<template>
   <div class="more-results-overlay">
      <div id="more-header" class="more-header">
         <span class="pool-name">{{poolDescription(selectedPool.url)}}</span>
         <i @click="closePool" class="pool-close fas fa-times-circle"></i>
         <SearchFilters />
      </div>
      
      <div @click="contentClick" class="more-results-content">
         <div id="hits-scroller" v-infinite-scroll="loadMoreResults" infinite-scroll-disabled="searching"  
               class="hits" v-bind:style="{ top: scrollTop + 'px' }">
            <div class="summary"><b>{{selectedPool.total}} results for </b>{{queryString()}}</div>
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
import SearchFilters from "@/components/SearchFilters"
import infiniteScroll from 'vue-infinite-scroll'

export default {
   directives: {
      infiniteScroll
   },
   data: function()  {
      return {
         scrollTop: 90
      }
   },
   components: {
      SearchHit,SearchFilters
   },
   computed: {
      ...mapState({
         results: state=>state.results,
         searching: state=>state.searching,
         selectedPoolIdx: state => state.selectedPoolIdx,
         addingFilter: state => state.filters.adding,
      }),
      ...mapGetters({
         selectedPool: 'selectedPool',
         findPool: 'pools/find',
         hasMoreHits: 'hasMoreHits',
         rawQueryString: 'query/string',
         poolFilter: 'filters/poolFilter',
      }),
      filterLength() {
         return this.poolFilter(this.selectedPoolIdx, 'raw').length
      }
   },
   watch: {
      filterLength() {
         setTimeout( () => {
            this.calcHeaderHeight()
         }, 10)
      },
      addingFilter() {
         setTimeout( () => {
            this.calcHeaderHeight()
         }, 10)
      }
   },
   methods: {
      calcHeaderHeight() {
         let hdrEle = document.getElementById("more-header")
            let hdrStyle = getComputedStyle(hdrEle)
            let hdrH = 0
            hdrH += parseInt(hdrStyle.getPropertyValue("height").replace("px", ""),10)
            hdrH += parseInt(hdrStyle.getPropertyValue("padding-top").replace("px", ""),10)
            hdrH += parseInt(hdrStyle.getPropertyValue("padding-bottom").replace("px", ""),10)
            let scroller = document.getElementById("hits-scroller")
            scroller.style.top = hdrH+"px"
      },
      queryString() {
         return this.rawQueryString.replace(/\{|\}/g, "")
      },
      contentClick(event) {
        event.stopPropagation() 
      },
      infiniteScrollEnabled() {
         return (this.searching == false && this.hasMoreHits == true)
      },
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
   },
   mounted() {
      this.calcHeaderHeight()
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
}
.more-results-content {
   position: fixed;
   right: 0;
   top: 0;
   height: 100%;
   z-index: 100;
   background: white;
   box-sizing: border-box;
   border-left: 4px solid var(--color-primary-orange);
   box-shadow: -2px 0px 10px #333;
   border-radius: 10px 0 0 0;
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
   padding: 4px 0 4px 4px;
   text-align: left;
   z-index: 500;
   border-radius: 5px 0 0 0;
}
.pool-name {
   margin-left: 10px;
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
   width: 100%;
   height: 100%;
   overflow-y: scroll;
   overflow-x: hidden;
   box-sizing: border-box;
   color: #555;
}
</style>
