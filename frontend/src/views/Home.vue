<template>
   <div class="home">
      <V4Spinner  v-if="searching" message="Searching..." v-bind:overlay="true" v-bind:dots="false"/>
      <div class="search-panel pure-form">
         <template v-if="basicSearch">
            <div v-if="hasTranslateMessage" class="translate-message">
               {{translateMessage}}
            </div>
            <label class="screen-reader-text" for="search">Search Virgo for books, articles, and more.</label>
            <label class="screen-reader-text" for="source-select">Search in</label>
            <div class="basic-search">
               <input class="basic"
                  @keyup.enter="searchClicked"
                  v-model="basic"
                  autocomplete="off"
                  type="text"
                  id="search"
                  placeholder="Search Virgo for books, articles, and more"
               >
               <V4Button @click="searchClicked" class="search" mode="primary">Search</V4Button>
            </div>
            <div class="controls-wrapper">
               <SourceSelector mode="basic"/>
            </div>
            <div class="search-mode">
               <router-link tabindex="0" to="/search?mode=advanced">Advanced Search</router-link>
            </div>
            <div class="search-mode">
               <V4BarcodeScanner @scanned="barcodeScanned"/>
            </div>
         </template>
         <AdvancedSearch v-else/>
      </div>
      <Welcome  v-if="isHomePage && hasResults==false" />
      <SearchResults/>
   </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import SearchResults from "@/components/SearchResults"
import AdvancedSearch from "@/components/advanced/AdvancedSearch"
import Welcome from "@/components/Welcome"
import V4BarcodeScanner from "@/components/V4BarcodeScanner"
import SourceSelector from "@/components/SourceSelector"

export default {
   name: "home",
   components: {
     SearchResults, V4BarcodeScanner, AdvancedSearch, Welcome, SourceSelector
   },
   watch: {
      $route() {
         console.log("NEW HOME ROUTE "+ this.$route.fullPath)
         this.restoreSearchFromQueryParams(this.$route.query)
         this.pageTitle = "Search"
         if (this.searchMode != "basic") {
            this.pageTitle = "Advanced Search"
         }
      },
      searching (newVal, _oldVal) {
         if (newVal == false && this.restoreURL == "/") {
            this.$nextTick( () => {
               let r = document.getElementById("results-container")
               if (r) {
                  // sometimes results may not be availble - maybe auth session problems for one
                  r.focus({preventScroll:true})
                  this.$utils.scrollToItem(r)
               }
            })
         }
      },
   },

   computed: {
      ...mapState({
         searching: state => state.searching,
         searchMode: state => state.query.mode,
         currentPool: state => state.query.targetPool,
         translateMessage: state => state.system.translateMessage,
         total: state=>state.total,
         restoreURL: state=>state.restore.url,
         restoreSaveSearch: state=>state.restore.restoreSaveSearch,
         activeSort: state=>state.sort.activeSort,
         poolMapping: state=>state.system.poolMapping,
         signedInUser: state=>state.user.signedInUser,
      }),
      ...mapGetters({
        queryURLParams: 'query/queryURLParams',
        rawQueryString: 'query/string',
        filterQueryString: 'filters/asQueryParam',
        hasResults: 'hasResults',
        hasTranslateMessage: 'system/hasTranslateMessage',
        selectedResults: 'selectedResults',
        isSignedIn: 'user/isSignedIn',
        poolSort: 'sort/poolSort',
        poolDetails: 'pools/poolDetails',
      }),
      ...mapFields({
        basic: 'query.basic',
        searchSources: 'query.searchSources',
        userSearched: 'query.userSearched',
        lastSearchScrollPosition: 'lastSearchScrollPosition',
        pageTitle: 'pageTitle'
      }),
      basicSearch() {
        return this.searchMode != "advanced"
      },
      // This restore refers to a Saved Search
      isRestore() {
         return ( this.$route.params !== undefined &&
              this.$route.params.id !== undefined &&
              this.$route.params.id != "")
      },
      isHomePage() {
         return (this.$route.path == "/")
      },
   },

   created: async function() {
      // When restoring a saved search, the call will be /search/:token
      let token = this.$route.params.id
      if ( token ) {
         // Load the search from the :token and restore it
         await this.$store.dispatch("query/loadSearch", token)
      }

      // await this.mapLegacyQueries( token )
      await this.restoreSearchFromQueryParams(this.$route.query)

      let bmTarget = this.$store.getters['restore/bookmarkTarget']
      if (bmTarget.id != "") {
         this.showAddBookmark(bmTarget)
         this.$store.commit("restore/clear")
      } else if ( this.restoreSaveSearch ) {
         let saveBtn = document.getElementById("save-modal-open")
         if (saveBtn) {
            saveBtn.focus()
            saveBtn.click()
         }
      }
   },
   mounted() {
      if ( this.searchMode == "basic") {
         this.$announcer.set(`virgo search has loaded`)
      }
   },

   methods: {
      async mapLegacyQueries( token ) {
         let changed = false
         let newQ = Object.assign({}, this.$route.query)

         // always discard exclude param if it is present
         if (newQ.exclude) {
            delete newQ.exclude
            changed = true
         }

         // Older filters were called Facet*... update name to Filter*
         // and fix a completely new mapping: FacetCollection => FilterDigitalCollection
         if (newQ.filter) {
            if (newQ.filter.indexOf("Facet") > -1) {
               let f = newQ.filter
               delete newQ.filter
               let  fixed = f.replace("FacetCollection", "FilterDigitalCollection")
               fixed =  fixed.replace(/Facet/g, "Filter")
               newQ.filter = fixed
               changed = true
            }
         }

         let queryStr = newQ.q
         if ( queryStr) {
            let idx0 = queryStr.indexOf(" AND filter:")
            if ( idx0 > -1) {
               delete newQ.q
               changed = true

               newQ.q = queryStr.substring(0,idx0).trim()
               let f = queryStr.substring(idx0)
               let newFilter =  ""
               if ( f.indexOf("Special Collections") !== -1) {
                  newFilter = '{"FilterCollection":["Special Collections"]}'
               } else if ( f.indexOf("Libra Repository") !== -1) {
                  newFilter = '{"FilterCollection":["Libra Repository"]}'
               }
               if ( newQ.filter ) {
                  newQ.filter = `{${newQ.filter.replace(/{|}/g, "")},${newFilter.replace(/{|}/g, "")}}`
               } else {
                  newQ.filter = newFilter
               }
            } else {
               let idx0 = queryStr.indexOf("filter:")
               if ( idx0 == 0) {
                  newQ.q = "keyword:{*}"
                  let fStr = queryStr.replace(/filter:|{|}|\(|\)/g, "").trim()
                  fStr = `{"${fStr.split(":")[0]}":[${fStr.split(":")[1]}]}`
                  newQ.filter = fStr
                  changed = true
               }
            }
         }

         if (newQ.scope || newQ.pool ) {
            let oldSrc = newQ.pool
            if (!oldSrc ) {
               oldSrc = newQ.scope
            }
            delete newQ.scope

            // look up a mapping from legacy v4 pool name to current pool name.
            // this mapping may be one to one for current pools for pools that didn't change
            let mapping = this.poolMapping[oldSrc]
            if (mapping && (newQ.pool != mapping.pool) ) {

               newQ.pool = mapping.pool
               if (mapping.filter != "all") {
                  if (newQ.filter) {
                     let stripped = newQ.filter.replace(/{|}/g, "")
                     newQ.filter = `{${stripped},"FilterResourceType":["${mapping.filter}"]}`
                  } else {
                     newQ.filter = `{"FilterResourceType":["${mapping.filter}"]}`
                  }
               }
               changed = true
            }
         }

         if ( changed ) {
            if ( token ) {
               this.updateSavedSearch(token, newQ)
            }

            // set set of sources searched to widest to ensure currect results shown
            this.searchSources = "all"
            if (newQ.pool == "images") {
               this.searchSources = "images"
            } else if (newQ.pool == "articles") {
               this.searchSources = "articles"
            } else if (newQ.pool == "uva_library") {
               this.searchSources = "uva_library"
            }
            await this.$router.replace({query: newQ})
         } else {
            if ( this.userSearched == false ) {
               if (newQ.pool == "images") {
                  this.searchSources = "images"
               } else if (newQ.pool == "articles") {
                  this.searchSources = "articles"
               } else if (newQ.pool == "uva_library") {
                  this.searchSources = "uva_library"
               }
            }
         }
      },

      updateSavedSearch(token, newQuery) {
         let qs = []
         for (const [k, v] of Object.entries(newQuery)) {
            qs.push(`${k}=${encodeURIComponent(v)}`)
         }
         let searchURI = `/search?${qs.join("&")}`
         let userID = this.signedInUser
         this.$store.dispatch("searches/updateURL", {userID, token, searchURI})
      },

      async restoreSearchFromQueryParams( query ) {
         if  (!query.q) {
            // only reset the search when there is NO query present,
            // otherwise the search is re-excuted each time a tab changes
            this.$store.dispatch('resetSearch')
         }

         // Interrogate query params and convert them to a search in the model (if present)
         let oldQ = this.rawQueryString
         if (query.mode == 'advanced') {
            this.$store.commit("query/setAdvancedSearch")
         } else {
            this.$store.commit("query/setBasicSearch")
         }

         let targetPool = "presearch"
         let oldFilterParam = ""
         let oldSort = ""
         let poolChanged = false

         if ( query.pool ) {
            poolChanged = (query.pool != this.currentPool)
            targetPool = query.pool
            this.$store.commit("query/setTargetPool", targetPool)

            // get sort from URL (but preserve current sort)...
            let oldSortObj = this.poolSort(targetPool)
            oldSort = `${oldSortObj.sort_id}_${oldSortObj.order}`
            if (query.sort  ) {
               this.$store.commit("sort/setPoolSort", {poolID: targetPool, sort: query.sort})
               this.$store.commit("sort/setActivePool", targetPool)
            } else {
               this.$store.commit("sort/setPoolSort", {poolID: targetPool, sort: "SortRelevance_desc"})
               this.$store.commit("sort/setActivePool", targetPool)
            }
         }

         // get pool filters from URL (but preserve current)...
         oldFilterParam = this.filterQueryString(targetPool)
         if (query.filter) {
            this.$store.commit("filters/restoreFromURL", {filter: query.filter, pool: targetPool} )
         } else {
            this.$store.commit("filters/resetPoolFilters", targetPool)
         }

         // If no sort detecetd, set it to the default relevance sort
         if (oldSort == "") {
            oldSort = "SortRelevance_desc"
         }

         if ( query.q ) {
            this.$store.commit("query/restoreFromURL", query.q)
         }

         // If there is a query or filter in params it may be necessary to run a search
         if ( query.q || query.filter) {
            // console.log(`Q: ${this.rawQueryString} vs ${oldQ}`)
            // console.log(`F: ${this.filterQueryString(targetPool)} vs ${oldFilterParam}`)
            // console.log(`S: ${this.activeSort} vs ${oldSort}`)
            // console.log(`U: ${this.userSearched}`)

            // only re-run search when query, sort or filtering has changed
            if ( this.rawQueryString != oldQ || this.filterQueryString(targetPool) != oldFilterParam ||
                 this.activeSort != oldSort || this.userSearched == true ) {
               this.$store.commit("resetSearchResults")
               let changed = this.rawQueryString != oldQ || this.filterQueryString(targetPool) != oldFilterParam || this.userSearched == true

               if ( this.userSearched ) {
                  this.$store.dispatch("searches/updateHistory")
                  this.userSearched = false
               }

               this.$announcer.set(`search in progress`, 'assertive')
               if (this.searchSources == "all") {
                  await this.$store.dispatch("searchAllPools")
               } else {
                  let p = this.poolDetails(this.searchSources)
                  await this.$store.dispatch("searchPool", {pool: p})
               }
               this.$store.dispatch("filters/getSelectedResultFacets", changed)
            } else {
               if (poolChanged) {
                  this.$store.dispatch("filters/getSelectedResultFacets", false)
               }
            }

            // make sure the currently selected pool is always in URL
            if (this.selectedResults.pool.id != "none" && query.pool != this.selectedResults.pool.id) {
               let newQ = Object.assign({}, query)
               newQ.pool = this.selectedResults.pool.id
               await this.$router.replace({query: newQ})
            }

            if ( this.lastSearchScrollPosition > 0 && (this.$route.path == "/" || this.$route.path == "/search")) {
               window.scrollTo({
                  top: this.lastSearchScrollPosition,
                  behavior: "auto"
               })
            }
         }
      },

      showAddBookmark( bmRestore ) {
         let identifier = bmRestore.id
         let bmData = {pool: this.selectedResults.pool.id, data: null}
         if ( bmRestore.parent && bmRestore.parent != "") {
            // find the item in the group that was targeted for a bookmark
            let parent = this.selectedResults.hits.find( r=> r.identifier == bmRestore.parent)
            bmData.data = parent.group.find( r=> r.identifier == identifier)

            // The group accordion watches this value. When set, the accordion will auto-expand
            this.$store.commit('setAutoExpandGroupID', bmRestore.parent)

            // once the group is expanded, scroll to the target group item
            setTimeout( ()=>{
               let sel = `.group-hit[data-identifier="${identifier}"]`
               let tgtEle = document.body.querySelector(sel)
               if ( tgtEle ) {
                  this.$utils.scrollToItem(tgtEle)
               }
            }, 250)

         } else {
               let sel = `.hit[data-identifier="${identifier}"]`
               let tgtEle = document.body.querySelector(sel)
               if ( tgtEle) {
                  this.$utils.scrollToItem(tgtEle)
                  bmData.data = this.selectedResults.hits.find( r=> r.identifier == identifier)
               }
         }
         let bmEle = document.getElementById(`bm-modal-${identifier}-btn`)
         if (bmEle) {
            bmEle.focus()
            bmEle.click()
         }
      },

      async searchClicked() {
         if ( this.isSignedIn ) {
            this.$analytics.trigger('Search', 'BASIC_SEARCH', "SIGNED_IN")
         } else {
            this.$analytics.trigger('Search', 'BASIC_SEARCH', "SIGNED_OUT")
         }
         let newQ = Object.assign({}, this.$route.query)
         newQ.q = this.rawQueryString
         this.userSearched = true
         await this.$router.replace({query: newQ})
      },

      barcodeScanned( barcode ) {
         this.basic = barcode
         this.searchClicked()
      },
   }
};
</script>

<style lang="scss" scoped>
.home {
   min-height: 400px;
   position: relative;
   h2 {
      margin-top:30px;
      color: #444;
   }
   .search-panel {
      margin: 0 auto 0 auto;
      text-align: center;
      padding: 10px 2vw 10px 2vw;
      font-size: 0.95em;
   }
   .basic-search {
      display: flex;
      flex-flow: row nowrap;
      align-items: stretch;
      justify-content: flex-start;
      max-width: 800px;
      margin: 0 auto 0 auto;

      input[type=text].basic {
         font-size: 1.15em;
         padding: 0.5vw 0.75vw;
         border: 1px solid var(--uvalib-grey);
         border-right: 0;
         margin: 0 !important;
         border-radius: 5px 0 0 5px;
         flex: 1 1 auto;
         min-width: 100px;
      }
      .search {
         border-radius: 0 5px 5px 0;
         margin: 0;
         padding: 0 40px;
      }
   }
   div.advanced {
      margin-top: 10px;
      font-size: 1em;
      text-align: right;
   }
   div.translate-message {
      margin: 5px 0 15px 0;
      font-size: 0.85em;
   }
   span.sep {
      margin: 0 5px;
   }
   .controls-wrapper  {
      max-width: 800px;
      margin: 0 auto 20px auto;
      .controls {
         padding: 10px 0;
         display: flex;
         flex-flow: row wrap;
         align-items: center;
         justify-content: flex-end;
      }
      .controls  > * {
         flex: 0 1 auto;
      }
   }
   .search-mode {
      text-align: center;
      margin: 10px 0 5px 0;
   }
}

@media only screen and (min-width: 768px) {
  div.searching-box {
    padding: 20px 90px;
  }
}

@media only screen and (max-width: 768px) {
  div.searching-box {
      width: 95%;
      padding: 20px 0;
      margin-top:30%;
  }
  ::-webkit-input-placeholder {
    color:transparent;
  }
  :-moz-placeholder { /* Firefox 18- */
    color:transparent;
  }
  ::-moz-placeholder {  /* Firefox 19+ */
    color:transparent;
  }
  :-ms-input-placeholder {
    color:transparent;
  }
}
</style>
