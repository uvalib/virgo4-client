<template>
   <div class="search-results shady">
      <SearchSuggestions />
      <div class="results-header">
         <template v-if="showSummary">
            <div class="summary">
               <div class="query">Showing results for: <i>{{queryString}}</i></div>
               <div class="counts">
                  <span>{{total}} matches</span>
               </div>
            </div>
            <span class="buttons">
               <SaveSearch v-if="isSignedIn" mode="share"/>
               <SaveSearch v-if="isSignedIn" mode="save"/>
               <span v-if="searchMode=='basic'" @click="refineClicked()"
                  class="refine pure-button pure-button-primary">
                  Refine Search
               </span>
            </span>
         </template>
      </div>

      <div class="results-wrapper" >
         <FacetSidebar />
         <div class="results-main">
            <div class="pool-tabs">
               <template  v-for="(r,idx) in sourceTabs">
                  <div @click="resultsButtonClicked(idx)" :key="idx" class="pool pure-button" v-bind:class="{showing: idx == selectedResultsIdx}">
                     <span>
                        <span class="pool">{{r.pool.name}}</span>
                        <span class="total">{{r.total}} hits</span>
                     </span>
                  </div>
               </template>
               <V4Select v-if="results.length > 3" :selections="otherSources" v-bind:attached="false" pad="4px 8px"
                  :background="otherSrcBkg" :color="otherSrcColor" alignment="right"
                  placeholder="Other"
                  v-model="otherSrcSelection"/>
            </div>
            <PoolResultDetail v-if="selectedResultsIdx > -1" />
            <div  v-if="total == 0 && selectedResultsIdx == -1" class="none">
               No results found
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import PoolResultDetail from "@/components/PoolResultDetail"
import V4Select from "@/components/V4Select"
import FacetSidebar from "@/components/FacetSidebar"
import SaveSearch from "@/components/popovers/SaveSearch"
import SearchSuggestions from "@/components/SearchSuggestions"
export default {
   components: {
      PoolResultDetail, V4Select, FacetSidebar, SaveSearch, SearchSuggestions
   },
   props: {
      showSummary: { type: Boolean, default: true},
   },
   computed: {
      ...mapGetters({
         isSignedIn: 'user/isSignedIn',
         rawQueryString: 'query/string'
      }),
      ...mapState({
         selectedResultsIdx: state=>state.selectedResultsIdx,
         total: state=>state.total,
         results: state=>state.results,
         searchMode: state=>state.query.mode,
      }),
      ...mapFields([
        'otherSrcSelection'
      ]),
      queryString() {
         return this.rawQueryString.replace(/\{|\}/g, "")
      },
      otherSrcBkg() {
         if (this.otherSrcSelection.id == "") return "#FFF"
         return "var(--uvalib-brand-blue)"
      },
      otherSrcColor() {
         if (this.otherSrcSelection.id == "") return "#666"
         return "white"
      },
      sourceTabs() {
         if (this.results.length == 3) {
            return this.results
         }
         return this.results.slice(0,2)
      },
      otherSources() {
         let opts = []
         let others = this.results.slice(2).sort( (a,b) => {
            if (a.pool.name < b.pool.name) return -1 
            if (a.pool.name > b.pool.name) return 1 
            return 0
         })
         
         others.forEach( r=>{
            let name = `<span class='pool'>${r.pool.name}</span>`
            if (this.poolFailed(r)) {
               name += "<span class='total'>Failed</span>"
            } else if (this.wasPoolSkipped(r)) {
               name += "<span class='total'>Skipped</span>"
            } else {
               name += `<span class='total'>${r.total} hits</span>`
            }
            opts.push({id: r.pool.id, name: name})
         })
         return opts
      }
   },
   watch: {
      otherSrcSelection (newVal, _oldVal) {
         if (newVal == "") return
         let found = false
         this.results.some( (r,idx) => {
            if ( r.pool.id == newVal.id) {
               this.$store.dispatch("selectPoolResults", idx)
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
         this.otherSrcSelection = {id:"", name:""}
         this.$store.dispatch("selectPoolResults", resultIdx)
      },
   }
}
</script>

<style>
.counts {
   margin-left: 15px;
}
div.pool-tabs {
  font-weight: bold;
}
div.pool-tabs span.total {
   display: block;
   font-size: 0.75em;
   margin: 0;
   font-weight: normal;
}

.shady {
  margin: 16px -1000px 16px -1000px;
  padding: calc(16px*2) 1000px calc(16px*2) 1000px;
  background-color: var(--uvalib-grey-lightest);
}

</style>
<style scoped>
p.relevant {
   text-align: left;
   padding: 0;
   margin: 0 0 0 10px;
}
.v4-select {
   margin: 0 0 2px 0;
   border-radius: 5px 5px 0 0;
   flex: 1 1 auto;
}
.pool-tabs {
   margin: 0 15px 0 0;
   text-align: left;
   display: flex;
   flex-flow: row wrap;
   justify-content: flex-start;
}
.pool.pure-button {
   margin: 0 2px 0 0;
   padding: 4px 8px;
   border-radius: 5px 5px 0 0;
   color: var(--uvalib-text-dark);
   border: 1px solid var(--uvalib-grey-light);
   text-align: left;
   flex: 1 1 auto;
   background: #FFF;
}
.pool.pure-button:first-child {
  margin-left: 4px;
}
.pool.pure-button.showing {
   background-color: var(--uvalib-brand-blue);
   color: #fff;
}
.pool.pure-button.disabled.failed {
   background: var(--uvalib-red-emergency);
   color: white;
   opacity: 0.5;
}
.pool-tabs .pool.pure-button:last-child {
   margin-right: 0;
}
.summary .query {
   text-align: left;
   margin: 0 0 0.2vw 0;
   font-weight: bold;
   font-size: 1.1em;
}
.summary .query i {
   font-weight: 100;
}
.results-header {
   display: flex;
   flex-flow: row wrap;
   align-content: center;
   align-items: center;
   justify-content: space-between;
   margin-top: 10px;
   padding-top: 10px;
   margin-bottom: 10px;
}
.results-main {
   display: inline-block;
   flex: 1 1 70%;
}
.summary {
   margin: 0 0 0.2vw 0;
   font-weight: 500;
   text-align: left;
}
.summary span {
   font-size: 0.85em;
}
.summary .subtotal {
   display: block;
   margin: 2px 0 2px 15px;
}
@media only screen and (min-width: 768px) {
   div.search-results {
      margin: 0;
      padding: 0 5vw 20px 5vw;
   }
    .save-box{ 
      width: 50%;
   }
}
@media only screen and (max-width: 768px) {
   div.search-results {
      margin: 0;
      padding: 0 2vw 20px 5vw;
   }
   span.refine.pure-button.pure-button-primary {
      display: none;
   }
   .save-box{ 
      width: 90%;
   }
}
.results-wrapper {
   display: flex;
   flex-flow: row wrap;
   justify-content: space-between;
}
.none {
   flex: 1 1 auto;
   font-size: 1.5em;
   font-weight: 500;
   padding-bottom: 150px;
   color: var(--uvalib-text);
}
</style>
