<template>
   <div class="home">
      <V4Spinner  v-if="searching" message="Searching..." v-bind:overlay="true" v-bind:dots="false"/>
      <div class="search-panel pure-form">
         <template v-if="basicSearch">
            <h1>Search</h1>
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
import { mapState } from "vuex"
import { mapGetters } from "vuex"
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
      },
      searching (newVal, _oldVal) {
         // If restore url is set, don't do special focus handling as it will mess up
         // the restore focus code
         if (newVal == false && this.restoreURL == "/") {
            setTimeout( () => {
               if ( this.total > 0) {
                  let r = document.getElementById("results-container")
                  let t =  document.getElementsByClassName("suggestion")[0]
                  if ( t) {
                     t.focus()
                  } else {
                     t = document.getElementById("global-filter")
                     t.focus()
                  }
                  this.$utils.scrollToItem(r)
               } else {
                  let s= document.getElementById("search")
                  if ( s) {
                     s.focus()
                     s.select()
                  } else {
                     s = document.getElementsByClassName("term")[0]
                     if ( s ) {
                        s.focus()
                     }

                  }
               }
            }, 250)
         }
      },
   },

   computed: {
      ...mapState({
         searching: state => state.searching,
         searchMode: state => state.query.mode,
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
        lastSearchScrollPosition: 'lastSearchScrollPosition'
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
      let cachedSrc = localStorage.getItem('v4SearchSources')
      if (cachedSrc) {
         this.searchSources = cachedSrc
      }
      await this.$store.dispatch('pools/getPools')
      this.$store.dispatch("query/getAdvancedSearchFilters")

      // When restoring a saved search, the call will be /search/:token
      let token = this.$route.params.id
      if ( token ) {
         // Load the search from the :token and restore it
         await this.$store.dispatch("query/loadSearch", token)
      }
      this.mapLegacyQueries( token )
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

   methods: {
      mapLegacyQueries( token ) {
         if (this.$route.query.scope || this.$route.query.pool || this.$route.query.exclude) {
            let newQ = Object.assign({}, this.$route.query)
            let oldSrc = newQ.scope
            if (!oldSrc) {
               oldSrc = newQ.pool
            }

            // look up a mpaaing from legacy v4 pool name to current pool name.
            // this mapping may be one to one for current pools, or pools that didn't change
            let mapping = this.poolMapping[oldSrc]
            if (mapping && (newQ.pool != mapping.pool || newQ.scope || newQ.exclude) ) {
               delete newQ.scope
               delete newQ.exclude
               newQ.pool = mapping.pool
               this.searchSources = mapping.pool
               if (mapping.filter != "all") {
                  let q = newQ.q
                  delete newQ.q
                  q += ` AND filter: {(FilterResourceType:"${mapping.filter}")}`
                  newQ.q = q
               }

               if ( token ) {
                  this.updateSavedSearch(token, newQ)
               }

               this.$router.replace({query: newQ})
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

         let targetPool = ""
         let oldFilterParam = ""
         let oldSort = ""
         if (query.pool && !query.scope) {
            targetPool = query.pool
            this.$store.commit("query/setTargetPool", targetPool)

            // get pool filters from URL (but preserve current)...
            oldFilterParam = this.filterQueryString(targetPool)
            if (query.filter) {
               this.$store.commit("filters/restoreFromURL", {filter: query.filter, pool: targetPool} )
            }

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

         // If no sort detecetd, set it to the default relevance sort
         if (oldSort == "") {
            oldSort = "SortRelevance_desc"
         }

         if ( query.q) {
            this.$store.commit("query/restoreFromURL", query.q)

            // only re-run search when query, sort or filtering has changed
            if ( this.rawQueryString != oldQ || this.filterQueryString(targetPool) != oldFilterParam ||
                 this.activeSort != oldSort || this.userSearched == true ) {
               this.$store.commit("resetSearchResults")
               // console.log(`Q: ${this.rawQueryString} vs ${oldQ}`)
               // console.log(`F: ${this.filterQueryString(targetPool)} vs ${oldFilterParam}`)
               // console.log(`S: ${this.activeSort} vs ${oldSort}`)
               // console.log(`U: ${this.userSearched}`)
               // console.log("SEARCH "+this.$router.currentRoute.fullPath)
               // dont keep the spinner up while getting facets if this is a search started by a user clicking search
               // NOTE: immediately reset the user searched flag because searchAllPools may append &pool=something to
               // the URL. When this happens, a route change is detected and the search should NOT be re-run as nothing
               // has changed. If userSearched is not reset, the search will run twice.
               this.userSearched = false
               if (this.searchSources == "all") {
                  await this.$store.dispatch("searchAllPools")
               } else {
                  let p = this.poolDetails(this.searchSources)
                  await this.$store.dispatch("searchPool", {pool: p})
               }
               this.$store.commit('setSearching', false)
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
         // Refine search updates:
         // if pool, filter or sort were specified previously, preserve them in the URL.
         // a new search will always reset paging, so don't preserve that
         let priorQ = Object.assign({}, this.$route.query)
         let qp = this.queryURLParams
         if ( priorQ.pool ) {
            qp += `&pool=${priorQ.pool}`
            this.$store.commit("query/setTargetPool", priorQ.pool)

            // grab current query string for the selected pool straight from the model.
            // cant rely on preserving prior filter string as the target pool may have changed
            // by the user selecting one from the dropdown
            qp += this.filterQueryString( priorQ.pool )
         } else {
            if (priorQ.filter) {
               qp += `&filter=${priorQ.filter}`
            }
         }
         if (priorQ.sort) {
            qp += `&sort=${priorQ.sort}`
         }
         this.userSearched = true
         this.$router.push(`/search?${qp}`)

         let s = "SIGNED_OUT"
         if ( this.isSignedIn ) {
            s = "SIGNED_IN"
         }
         this.$analytics.trigger('Search', 'BASIC_SEARCH', s)
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
