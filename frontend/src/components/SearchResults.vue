<template>
   <div class="results-panel">
      <div class="query-summary">Showing results for: <i>{{queryString}}</i></div>
      <div class="toolbar">
         <div class="right-indent">
            <p class="summary">{{total}} matches found in {{hitPoolCount}} pools</p>
            <span v-if="searchMode=='basic'" @click="refineClicked()" class="refine text-button">Refine Search</span>
         </div>
         <template v-if="total>0">
            <div class="pool-buttons">
               <div  v-for="(r,idx) in results" :key="idx"  @click="toggleVisibility(idx)" 
                  class="pool pure-button" v-bind:class="{showing: r.show, disabled: r.total==0}">
                  {{poolName(r.url)}} <span class="total">({{r.total}})</span>
               </div>
            </div>
         </template>
         <h5 v-else class="no-hits">No matching records found</h5>
      </div>

      <DebugPanel v-if="hasDebug" :debugInfo="debugInfo"/>
      <WarningPanel v-if="hasWarnings" :warnings="warnings"/>

      <transition-group tag="div" class="pools" 
            name="pool-transition"
            enter-active-class="animated faster fadeIn"
            leave-active-class="animated faster fadeOut"
            v-if="total>0">
         <div class="pool-panel" v-for="(pool,poolIdx) in visibleResults" :key="pool.url">
            <div class="pool-titlebar">{{poolDescription(pool.url)}}</div>
            <template v-for="hit in pool.hits.slice(0,3)">
               <SearchHit :hit="hit" :key="hit.id"/>
            </template>
            <div @click="selectPool(poolIdx)" class="more-panel">
               See More Results<img class="more-icon" src="../assets/more.png"/>
            </div>
         </div>
      </transition-group>

   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHit from "@/components/SearchHit"
import DebugPanel from "@/components/diagnostics/DebugPanel"
import WarningPanel from "@/components/diagnostics/WarningPanel"
export default {
   components: {
      DebugPanel, WarningPanel,SearchHit
   },
   computed: {
      ...mapGetters({
         visibleResults: 'visibleResults',
         hasDebug: 'diagnostics/hasDebug',
         debugInfo: 'diagnostics/debugInfo',
         hasWarnings: 'diagnostics/hasWarnings',
         warnings: 'diagnostics/warnings',
         findPool: 'pools/find',
         rawQueryString: 'query/string',
         hitPoolCount: 'hitPoolCount'
      }),
      ...mapState({
         total: state=>state.total,
         results: state=>state.results,
         searchMode: state=>state.searchMode
      }),
      queryString() {
         return this.rawQueryString.replace(/\{|\}/g, "")
      },
   },
   methods: {
      refineClicked() {
         this.$store.commit("setAdvancedSearch")
      },
      selectPool(resultIdx) {
         this.$store.commit("selectPoolResults", resultIdx)
      },
      toggleVisibility(resultIdx) {
         this.$store.commit("toggleResultVisibility", resultIdx)
      },
      poolName(url) {
         let p = this.findPool(url) 
         if (p) {
            return p.name
         }
         return url
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
.pool-buttons {
   margin-top: 10px;
   text-align: left;
}
div.right-indent {
   margin-left: 5px;
}
.pool.pure-button {
   margin: 5px;
   padding: 2px 20px;
   border-radius:    5px;
   font-size: 0.85em;
   font-weight: bold;
   color: #666;
}
.pool.pure-button.showing {
   background-color: rgb(66, 184, 221);
   color: #fff;
}
.pool.pure-button.disabled {
   opacity: 0.3;
   cursor:default;
   color: #444;
   background: #ddd;
}
div.pools {
   display: grid;
   grid-gap: 10px;
   grid-template-columns: repeat(auto-fill, minmax(350px, 5fr) ) ;
}
.pool-panel {
   margin: 5px;
   padding: 0;
}
.more-panel {
   border: 1px solid #ccc;
   border-top: none;
   padding: 10px;
   background: #f5f5f5;
   text-align: center;
   cursor: pointer;
   border-radius: 0 0 5px 5px
}
.more-panel:hover {
   text-decoration: underline;
}
.more-panel:hover .more-icon {
   opacity: 0.6;
}
.more-icon {
   opacity: 0.3;
   margin-left: 15px;
   display: inline-block;
   position: relative;
   top: 2px;
}
.pool-titlebar {
   padding: 4px 10px;
   background-color: var(--color-primary-orange);
   color: white;
   font-weight: normal;
   font-size: 0.9em;
   border-radius: 5px 5px 0 0;
}
h4.no-hits {
   text-align: center;
   color: var(--color-primary-text);;
   font-size: 1.25em;
}
.query-summary {
   text-align: left;
   margin: 0 0 0.2vw 0;
   font-weight: bold;
   font-size: 1.1em;
}
.query-summary  i {
   font-weight: 100;
}
.summary, .curr-pool {
   margin: 0 0 0.2vw 0;
   font-weight: 100;
   text-align: left;
   font-size: 0.85em;
   position: relative;
}
.curr-pool {
   margin-bottom: 1vw;
}
div.toolbar {
   position: relative;
   margin-bottom: 10px;
}
@media only screen and (min-width: 768px) {
   div.results-panel {
      margin: 0 5vw 5vw 5vw;
      padding: 0;
   }
}
@media only screen and (max-width: 768px) {
   div.results-panel {
      margin: 0 2vw 2vw 2vw;
      padding: 0;
   }
}
div.pools {
   text-align: left;
}
.refine {
   display: block;
   text-align: left;
   font-size: 0.9em;
}
</style>
