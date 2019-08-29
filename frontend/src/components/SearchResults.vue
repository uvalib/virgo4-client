<template>
   <div class="results-panel">
      <div class="query-summary">Showing results for: <i>{{queryString}}</i></div>
      <div class="toolbar">
         <div class="right-indent">
            <p class="summary">
               <span>{{total}} matches found in {{results.length}} sources.</span> 
               <span class="subtotal" v-if="skippedPoolCount">&nbsp;{{skippedPoolCount}} source(s) not searched. Click source to search.</span>
               <span class="subtotal" v-if="failedPoolCount">&nbsp;{{failedPoolCount}} source(s) failed.</span>
            </p>
            <span v-if="searchMode=='basic'" @click="refineClicked()" class="refine text-button">Refine Search</span>
         </div>
         <div class="pool-buttons">
            <template  v-for="(r,idx) in results">  
               <div v-if="wasPoolSkipped(r)" @click="toggleVisibility(idx)" :key="idx" 
                  class="pool pure-button" v-bind:class="{showing: r.show}">
                  {{r.pool.Name}} <span class="total">(not searched)</span>
               </div>
               <div v-else-if="poolFailed(r)" :key="idx" 
                  class="pool pure-button disabled failed"
                  :title="r.statusMessage">
                  {{r.pool.name}} <span class="total">(failed)</span>
               </div>
               <div v-else @click="toggleVisibility(idx)" :key="idx" 
                  class="pool pure-button" v-bind:class="{showing: r.show, disabled: r.total==0}">
                  {{r.pool.name}} <span class="total">({{r.total}})</span>
               </div>
            </template>
         </div>
      </div>

      <div class="pools"> 
         <div class="pool-panel" v-for="(result,visibleIdx) in visibleResults" :key="visibleIdx">
            <div class="pool-titlebar">
               <span>{{result.pool.summary}}</span>
               <i @click="toggleVisibility(result.resultIdx)" class="hide-pool fas fa-times-circle"></i>
            </div>
            <div class="pool-info">
               <div class="metrics">
                  <span>{{result.total}} matches found in {{result.timeMS}} ms</span>
               </div>
               <template v-if="hasFilter(result.resultIdx)">
                  <div class="filter-head">Search Filters</div>
                  <table class="filters">
                     <tr class="filter" v-for="(filter,i) in poolFilter(result.resultIdx, 'raw')" :key="i">
                        <td class="label">{{filter.facet}}:</td>
                        <td class="filter">{{formatFilterValues(filter.values)}}</td>
                     </tr>
                  </table>
               </template>
            </div>
            <template v-for="hit in result.hits.slice(0,3)">
               <SearchHit :pool="result.pool.id" :hit="hit" :key="hit.id"/>
            </template>
            <div @click="selectPool(visibleIdx)" class="more-panel">
               See More Results&nbsp;<i class="more-icon fas fa-arrow-circle-right"></i>
            </div>
         </div>
      </div>

   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHit from "@/components/SearchHit"
export default {
   components: {
      SearchHit
   },
   computed: {
      ...mapGetters({
         visibleResults: 'visibleResults',
         rawQueryString: 'query/string',
         hitPoolCount: 'hitPoolCount',
         skippedPoolCount: 'skippedPoolCount',
         failedPoolCount: 'failedPoolCount',
         hasFilter: 'filters/hasFilter',
         poolFilter: 'filters/poolFilter',
      }),
      ...mapState({
         total: state=>state.total,
         results: state=>state.results,
         searchMode: state=>state.query.mode
      }),
      queryString() {
         return this.rawQueryString.replace(/\{|\}/g, "")
      },
   },
   methods: {
      poolFailed(p) {
         return p.statusCode != 408 && p.total == 0 & p.statusCode != 200
      },
      wasPoolSkipped(p) {
         return p.statusCode == 408 && p.total == 0
      },
      formatFilterValues(values) {
         return values.join(", ")
      },
      refineClicked() {
         this.$store.commit("query/setAdvancedSearch")
      },
      selectPool(visiblePoolIdx) {
         this.$store.commit("selectPoolResults", visiblePoolIdx)
      },
      toggleVisibility(resultIdx) {
         this.$store.commit("toggleResultVisibility", resultIdx)
         if ( this.results[resultIdx].show && this.results[resultIdx].statusCode == 408) {
            this.selectPool(resultIdx)
         }
      },
   }
}
</script>

<style scoped>
.pool-buttons {
   margin-top: 5px;
   text-align: left;
}
.hide-pool {
   float: right;
   cursor: pointer;
   opacity: 0.6;
   font-size: 1.5em;
}
.hide-pool:hover {
   opacity: 1;
}
.pool-info {
   border-right: 1px solid #ccc;
   border-left: 1px solid #ccc;
   border-bottom: 1px solid #ccc;
   margin: 0;
   padding: 0px;
   font-size: 0.7em;
   font-weight: 100;
   background-color: #f5f5f5;
}
.metrics {
   padding: 5px;
}
.filter-head {
   margin: 0;
   border-bottom: 1px solid #ccc;
   border-top: 1px solid #ccc;
   padding: 2px 5px;
   font-weight: bold;
   background: #e5e5e5;
}
table.filters {
   margin: 3px 5px;
}
table td {
   padding: 2px 5px;
}
td.filter {
   font-weight: 100;
   width: 100%;
}
td.label {
   padding: 2px 4px 0 0;
   font-weight: normal;
   vertical-align: text-top;
   text-align: right;
   font-weight: 500;
}
span.view-all {
   float: right;
   cursor: pointer;
}
div.right-indent {
   margin-left: 5px;
}
.pool.pure-button {
   margin: 5px;
   padding: 5px 20px;
   border-radius:    5px;
   font-size: 0.85em;
   font-weight: bold;
   color: #666;
}
.pool.pure-button.showing {
   background-color: var(--color-primary-blue);
   color: #fff;
}
.pool.pure-button.disabled {
   opacity: 0.3;
   cursor:default;
   color: #444;
   background: #ddd;
}
.pool.pure-button.disabled.failed {
   background: #D33;
   color: white;
   opacity: 0.5;
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
   background: white;
   text-align: center;
   cursor: pointer;
   border-radius: 0 0 5px 5px;
   color: #444;
}
.more-panel:hover, .view-all:hover {
   color: var(--color-link);
}
.more-panel:hover .more-icon {
   opacity: 0.9;
   color: var(--color-link);
}
.more-icon {
   opacity: 0.6;
   margin-left: 5px;
   display: inline-block;
}
.pool-titlebar {
   padding: 10px 8px 10px 10px;
   background-color: var(--color-primary-orange);
   color: white;
   font-weight: bold;
   font-size: 0.9em;
   border-radius: 5px 5px 0 0;
}
h1.no-hits {
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
.summary {
   margin: 0 0 0.2vw 0;
   font-weight: 100;
   text-align: left;
   font-size: 0.85em;
   position: relative;
}
.summary .subtotal {
   display: block;
   margin: 2px 0 2px 15px;
}
div.toolbar {
   position: relative;
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
.total {
   font-weight: 100;
}
.refine {
   display: block;
   text-align: left;
   font-size: 0.9em;
   margin: 10px 0 5px;
}
</style>
