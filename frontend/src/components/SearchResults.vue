<template>
   <PrintedSearchResults v-if="printing" />
   <div tabindex="-1" id="results-container"
      class="search-results" aria-describedby="search-summary"
   >
      <SearchSuggestions />
      <div class="results-header" role="heading" aria-level="2">
         <template v-if="showSummary">
            <div id="search-summary" class="summary">
               <div class="query">Showing {{$utils.formatNum(total)}} results for:</div>
               <div class="qs">{{queryString}}</div>
            </div>
            <span class="buttons" role="toolbar">
               <V4Button mode="text" @click="resetSearch" >Reset Search</V4Button>
               <SaveSearch v-if="isSignedIn"/>
               <SignInRequired v-else id="save-signin-modal" act="save-search"/>
               <V4Button v-if="selectedResults.pool.id=='uva_library'" mode="primary" @click="printResults">Print Results</V4Button>
            </span>
         </template>
      </div>

      <div class="results-wrapper" >
         <FacetSidebar />
         <div class="results-main">
            <div class="pool-tabs">
               <V4Button v-for="(r,idx) in sourceTabs" :key="idx"
                  class="pool" v-bind:class="{showing: idx == selectedResultsIdx}"
                  mode="text" @click="resultsButtonClicked(idx)"
               >
                  <span>
                     <span class="pool">{{r.pool.name}}</span>
                     <span :aria-label="`has ${r.total} results`" class="total">({{$utils.formatNum(r.total) || '0'}})</span>
                  </span>
               </V4Button>
               <V4Select v-if="results.length > maxTabs" :selections="otherSources" v-bind:attached="false" pad="4px 8px"
                  :background="otherSrcBkg" :color="otherSrcColor" alignment="right"
                  placeholder="More"
                  @changed="poolSelected"
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
import PrintedSearchResults from "@/components/PrintedSearchResults"
import FacetSidebar from "@/components/FacetSidebar"
import SaveSearch from "@/components/modals/SaveSearch"
import SearchSuggestions from "@/components/SearchSuggestions"
import SignInRequired from '@/components/modals/SignInRequired'
export default {
   components: {
      PoolResultDetail, FacetSidebar, SaveSearch, SearchSuggestions, SignInRequired, PrintedSearchResults
   },
   props: {
      showSummary: { type: Boolean, default: true},
   },
   computed: {
      ...mapGetters({
         isSignedIn: 'user/isSignedIn',
         rawQueryString: 'query/string',
         filterQueryParam: 'filters/asQueryParam',
         selectedResults: 'selectedResults',
         hasSearchTemplate: 'preferences/hasSearchTemplate',
      }),
      ...mapState({
         selectedResultsIdx: state=>state.selectedResultsIdx,
         activeSort: state=>state.sort.activeSort,
         total: state=>state.total,
         results: state=>state.results,
         searchMode: state=>state.query.mode,
         maxTabs: state=>state.preferences.maxTabs,
         searchTemplate: state=>state.preferences.searchTemplate,
         printing: state=>state.system.printing,
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
         if (this.results.length <= this.maxTabs) {
            return this.results
         }
         return this.results.slice(0, this.maxTabs-1 )
      },
      otherSources() {
         let opts = []
         let others = this.results.slice(this.maxTabs-1).sort( (a,b) => {
            if (a.pool.name < b.pool.name) return -1
            if (a.pool.name > b.pool.name) return 1
            return 0
         })

         others.forEach( r=>{
            let name = `<span class='other-src'><span class='pool'>${r.pool.name}</span>`
            if (this.poolFailed(r)) {
               name += "<span class='total error'>Failed</span>"
            } else if (this.wasPoolSkipped(r)) {
               name += "<span class='total'>Skipped</span>"
            } else {
               let t = this.$utils.formatNum(r.total)
               name += `<span class='total'>(${t || '0'})</span>`
            }
            name += "</span>"
            opts.push({id: r.pool.id, name: name})
         })
         return opts
      }
   },
   methods: {
      printResults() {
         this.$store.commit("system/setPrinting", true)
         this.$nextTick( () => {
            let contents = document.getElementById("print-results").innerHTML
            let printFrame = document.createElement('iframe')
            printFrame.name = "printFrame"
            printFrame.style.position = "absolute"
            printFrame.style.right = "1000000px"
            document.body.appendChild(printFrame)
            let frameDoc = printFrame.contentWindow.document
            frameDoc.open()
            frameDoc.write('<html lang="en"><head><title>Search Results</title>')
            frameDoc.write('<link rel="stylesheet" type="text/css" href="/print.css"/>')
            frameDoc.write('</head><body>')
            frameDoc.write(contents)
            frameDoc.write('</body></html>')
            frameDoc.close()
            setTimeout( () => {
               window.frames["printFrame"].focus()
               window.frames["printFrame"].print()
               document.body.removeChild(printFrame)
               this.$store.commit("system/setPrinting", false)
            }, 500)
         })
      },
      async resetSearch(){
         this.$store.dispatch('resetSearch')
         if ( this.searchMode == "basic") {
            this.$router.push(`/search`)
         } else {
            this.$store.commit("query/resetAdvancedForm")
            this.$router.push('/search?mode=advanced')
            if ( this.hasSearchTemplate ) {
               this.$store.commit("query/setTemplate", this.searchTemplate)
            }
         }
      },
      updateURL( poolID) {
         let query = Object.assign({}, this.$route.query)
         query.pool = poolID
         delete query.filter
         delete query.sort
         delete query.page
         let fqp = this.filterQueryParam( poolID )
         if (fqp.length > 0) {
            query.filter = fqp
         }
         if (this.activeSort.length > 0) {
            query.sort = this.activeSort
         }
         if (this.selectedResults.page > 0) {
            query.page = this.selectedResults.page +1
         }
         if ( this.$route.query != query ) {
            this.$router.push({query})
         }
      },
      poolFailed(p) {
         return p.statusCode != 408 && p.total == 0 & p.statusCode != 200
      },
      wasPoolSkipped(p) {
         return p.statusCode == 408 && p.total == 0
      },
      formatFilterValues(values) {
         return values.join(", ")
      },

      resultsButtonClicked(resultIdx) {
         if ( this.selectedResultsIdx != resultIdx) {
            let r = this.results[resultIdx]
            if ( this.poolFailed(r)) return
            this.otherSrcSelection = {id:"", name:""}
            this.poolSelected(r.pool.id)
         }
      },

      poolSelected( id ) {
         this.$analytics.trigger('Results', 'POOL_SELECTED', id)

         let tgtIdx = this.results.findIndex( r => r.pool.id ==id )
         if (tgtIdx > -1 ) {
            this.$store.dispatch("selectPoolResults", tgtIdx)
            let newPoolID = this.results[tgtIdx].pool.id
            if ( this.$route.query.pool != newPoolID ) {
               this.updateURL(newPoolID)
            }
         }
      }
   },
}
</script>


<style scoped lang="scss">
:deep(.other-src) {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   padding:0;
   margin:0;
   .total {
      margin-left: auto;
   }
   .total.error {
      color: var(--uvalib-red-emergency);
      font-weight: bold;
   }
   .pool {
      margin-right: 5px;
   }
}

.results-main {
   display: inline-block;
   flex: 1 1 70%;
}

.search-results  {
   box-sizing: border-box;
   outline: 0;
   background-color: var(--uvalib-grey-lightest);
}

.results-header {
   display: flex;
   flex-flow: row wrap;
   align-content: center;
   align-items: center;
   justify-content: space-between;
   padding-top: 10px;
   margin-bottom: 10px;
   .summary {
      margin: 0 0 0.2vw 0;
      font-weight: 500;
      text-align: left;
      .qs {
         margin-left:15px;
         font-style: italic;
         font-weight: 100;
      }
      span {
         font-size: 0.85em;
      }
      .subtotal {
         display: block;
         margin: 2px 0 2px 15px;
      }
      .query {
         text-align: left;
         margin: 0 0 0.2vw 0;
         font-weight: bold;
         font-size: 1.1em;
      }
   }
   .buttons {
      display: flex;
      flex-flow: row nowrap;
   }
}


div.pool-tabs {
   font-weight: bold;
   margin: 0;
   text-align: left;
   display: flex;
   flex-flow: row wrap;
   justify-content: flex-start;
   span.total {
      display: block;
      font-size: 0.75em;
      margin: 0;
      font-weight: normal;
   }
   .v4-select {
      margin: 0 -1px 2px 0;
      border-radius: 5px 5px 0 0;
      flex: 1 1 auto;
   }
}

.pool-tabs .pool.v4-button {
   margin: 0;
   padding: 8px 8px 10px 8px;
   border-radius: 5px 5px 0 0;
   color: var(--uvalib-text-dark);
   border: 1px solid var(--uvalib-grey-light);
   text-align: left;
   flex: 1 1 auto;
   background: #FFF;
   outline: none;
   &:focus {
      z-index: 1;
      &:focus {
         @include be-accessible();
      }
   }
}
.pool.v4-button:first-child {
  margin-left: 4px;
}
.pool.v4-button.showing {
   background-color: var(--uvalib-brand-blue);
   color: #fff;
}
.pool.v4-button.disabled.failed {
   background: var(--uvalib-red-emergency);
   color: white;
   opacity: 0.5;
}
.pool-tabs .pool.v4-button:last-child {
   margin-right: -1px;
}


@media only screen and (min-width: $breakpoint-mobile) {
   div.search-results {
      margin: 0;
      padding: 0 5vw 20px 5vw;
   }
}
@media only screen and (max-width: $breakpoint-mobile) {
   div.search-results {
      margin: 0;
      padding: 0 2vw 20px 2vw;
   }
   .pool.v4-button:first-child {
      margin-left: -1px;
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
