<template>
   <div class="results-panel">
      <div class="query-summary">
         <span>Showing results for: <i>{{queryString}}</i></span>
      </div>
      <div class="toolbar">
         <div class="right-indent">
            <p class="summary">
               <span>{{total}} matches found in {{results.length}} sources.</span>
               <span class="subtotal" v-if="skippedPoolCount">&nbsp;{{skippedPoolCount}} source(s) not searched. Click source to search.</span>
               <span class="subtotal" v-if="failedPoolCount">&nbsp;{{failedPoolCount}} source(s) failed.</span>
            </p>
         </div>
         <div class="search-controls">
            <AvailabilitySelector/>
            <span v-if="searchMode=='basic'" @click="refineClicked()" class="refine pure-button pure-button-primary">Refine Search</span>
         </div>

         <div class="pool-buttons">
            <p class="relevant">Most Relevant</p>
            <template  v-for="(r,idx) in results.slice(0,2)">
               <div @click="resultsButtonClicked(idx)" :key="idx" class="pool pure-button" v-bind:class="{showing: idx == selectedResultsIdx}">
                  <span>
                     <span>{{r.pool.name}}&nbsp;</span>
                  </span>
               </div>
            </template>
            <V4Select v-if="results.length > 2" :selections="otherSources" v-bind:attached="false" pad="4px 8px"
               :background="otherSrcBkg" :color="otherSrcColor" placeholder="Other Sources"
               v-model="selectedSource"/>
         </div>
      </div>

      <PoolResultDetail v-if="selectedResultsIdx > -1" />

   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import PoolResultDetail from "@/components/PoolResultDetail"
import AvailabilitySelector from '@/components/AvailabilitySelector'
import V4Select from "@/components/V4Select"
export default {
   components: {
      AvailabilitySelector,PoolResultDetail,V4Select
   },
   computed: {
      ...mapGetters({
         rawQueryString: 'query/string',
         hitPoolCount: 'hitPoolCount',
         skippedPoolCount: 'skippedPoolCount',
         failedPoolCount: 'failedPoolCount',
         hasFilter: 'filters/hasFilter',
         poolFilter: 'filters/poolFilter',
         isTargetPool: "preferences/isTargetPool",
      }),
      ...mapState({
         selectedResultsIdx: state=>state.selectedResultsIdx,
         total: state=>state.total,
         results: state=>state.results,
         searchMode: state=>state.query.mode,
      }),
      ...mapFields([
        'selectedSource'
      ]),
      queryString() {
         return this.rawQueryString.replace(/\{|\}/g, "")
      },
      otherSrcBkg() {
         if (this.selectedSource.id == "") return "#E6E6E6"
         return "var(--color-brand-blue)"
      },
      otherSrcColor() {
         if (this.selectedSource.id == "") return "#666"
         return "white"
      },
      otherSources() {
         let opts = []
         this.results.slice(1).forEach( r=>{
            let name = r.pool.name 
            if (this.poolFailed(r)) {
               name += " (failed)"
            } else if (this.wasPoolSkipped(r)) {
               name += " (skipped)"
            } else if (r.total ==0) {
               name += ` (no matches)`
            }
            opts.push({id: r.pool.id, name: name})
         })
         return opts
      }
   },
   watch: {
      selectedSource (newVal,oldVal) {
         if (newVal == "") return 
         let found = false
         this.results.some( (r,idx) => {
            if ( r.pool.id == newVal.id) {
               this.$store.commit("selectPoolResults", idx)
               found = true
            }
            return found
         })
      }
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
      resultsButtonClicked(resultIdx) {
         let r = this.results[resultIdx]
         if ( this.poolFailed(r)) return
         this.selectedSource = {id:"", name:""}
         this.$store.commit("selectPoolResults", resultIdx)
      },
   }
}
</script>

<style scoped>
p.relevant {
   margin:0;
   padding: 0 0 0 5px;
   font-size: 0.9em;
}
#app .pool-buttons div.pool.pure-button:first-child {
   margin-left: 0;
}
#app .pool-buttons div.pool.pure-button:last-child {
   margin-right: 0;
}
.total {
   margin-right: 10px;
}
.v4-select {
   margin-left: 3px;
}
.pool-buttons {
   margin: 15px 0 0 0;
   text-align: left;
}
div.right-indent {
   margin-left: 5px;
}
.pool.pure-button {
   margin: 0 3px;
   padding: 4px 8px;
   border-radius: 5px 5px 0 0;
   color: #666;
   border: 1px solid #e6e6e6;
   
}
.pool.pure-button.showing {
   background-color: var(--color-brand-blue);
   color: #fff;
   border: 1px solid var(--color-brand-blue);
}
.pool.pure-button i.fa-star {
   margin-right: 5px;
}
.pool.pure-button.disabled.failed {
   background: #D33;
   color: white;
   opacity: 0.5;
}
.query-summary {
   text-align: left;
   margin: 0 0 0.2vw 0;
   font-weight: bold;
   font-size: 1.1em;
}
.summary {
   margin: 0 0 0.2vw 0;
   font-weight: 500;
   text-align: left;
   font-size: 0.85em;
   position: relative;
}
.summary .subtotal {
   display: block;
   margin: 2px 0 2px 15px;
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
div.search-controls {
   display: flex;
   flex-flow: row wrap;
   font-size: 0.9em;
   justify-content: space-between;
   margin-top:10px;
   align-items: stretch;
}
</style>
