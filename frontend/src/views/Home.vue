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
               <V4Select id="source-select" :selections="resourceTypes" v-bind:attached="true"
               border="1px solid var(--uvalib-brand-blue)"
               :value="basicSearchScope"
               @changed="scopeChanged"
               />
               <input class="basic"
                  @keyup.enter="searchClicked"
                  v-model="basic"
                  autocomplete="off"
                  type="text"
                  id="search"
                  placeholder="Search Virgo for books, articles, and more"
               >
            </div>
            <div class="controls-wrapper">
               <div class="controls">
                  <template v-if="hasResults">
                     <V4Button mode="text" @click="resetSearch" >Reset Search</V4Button>
                     <span class="sep">|</span>
                  </template>
                  <V4Button @click="searchClicked" class="search" mode="primary">Search</V4Button>
               </div>
               <div class="advanced">
                  <SearchTips/><span class="sep">|</span>
                  <router-link tabindex="0" to="/search?mode=advanced">
                  <span>Advanced Search&nbsp;<i class="fas fa-search-plus"></i></span>
                  </router-link>
               </div>
               <div class="advanced">
                  <V4BarcodeScanner @scanned="barcodeScanned"/>
               </div>
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
import SearchTips from "@/components/disclosures/SearchTips"
import AdvancedSearch from "@/components/advanced/AdvancedSearch"
import Welcome from "@/components/Welcome"
import V4BarcodeScanner from "@/components/V4BarcodeScanner"

export default {
   name: "home",
   components: {
     SearchResults, V4BarcodeScanner,
     SearchTips, AdvancedSearch,
     Welcome
   },

   created: function() {
      this.isHomePage = false
      if (this.$route.path == "/") {
         this.isHomePage = true
      }
      this.searchCreated()

   },

   data: function() {
      return {
         showVideo: false,
         isHomePage: true,
      }
   },
   watch: {
      $route() {
         console.log("NEW HOME ROUTE "+ this.$route.fullPath)
         this.isHomePage = false
         if (this.$route.path == "/") {
            this.isHomePage = true
         }
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
         results: state => state.results,
         total: state=>state.total,
         restoreURL: state=>state.restore.url,
         restoreSaveSearch: state=>state.restore.restoreSaveSearch,
         searchTemplate: state=>state.preferences.searchTemplate,
         signedInUser: state => state.user.signedInUser,
         activeSort: state=>state.sort.activeSort,
      }),
      ...mapGetters({
        queryEntered: 'query/queryEntered',
        queryURLParams: 'query/queryURLParams',
        rawQueryString: 'query/string',
        filterQueryString: 'filters/asQueryParam',
        hasResults: 'hasResults',
        hasTranslateMessage: 'system/hasTranslateMessage',
        sources: 'pools/sortedList',
        selectedResults: 'selectedResults',
        isSignedIn: 'user/isSignedIn',
        hasSearchTemplate: 'preferences/hasSearchTemplate',
        externalPoolIDs: 'pools/externalPoolIDs',
        poolSort: 'sort/poolSort',
        resourceTypes: 'query/resourceTypes',
        basicSearchScope:  'query/basicSearchScope'
      }),
      ...mapFields({
        basic: 'query.basic',
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
   },
   methods: {
      async resetSearch(){
         this.$store.dispatch('resetSearch')
         this.$router.push(`/search`)
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
            if ( this.hasSearchTemplate ) {
               this.$store.commit("query/restoreTemplate", this.searchTemplate)
            }
         } else {
            this.$store.commit("query/setBasicSearch")
         }

         let targetPool = ""
         let oldFilterParam = ""
         let oldSort = ""
         if (query.pool) {
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
               await this.$store.dispatch("searchAllPools")
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
      async searchCreated() {
         await this.$store.dispatch('pools/getPools')
         this.$store.dispatch("query/getAdvancedSearchFilters")

         // When restoring a saved search, the call will be /search/:token
         if ( this.isRestore ) {
            // Load the search from the :token and restore it
            let token = this.$route.params.id
            await this.$store.dispatch("query/loadSearch", token)
            this.restoreSearchFromQueryParams(this.$route.query)
            return
         } else {
            await this.restoreSearchFromQueryParams(this.$route.query)
         }

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

      scopeChanged( val ) {
         this.$analytics.trigger('Search', 'BASIC_SEARCH_RESOURCE_SET', val)
         this.$store.commit("query/setBasicSearchFilter", val)
         this.$store.commit("filters/reset")
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
  div.tips-container {
    display: none;
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
span.sep {
   margin: 0 5px;
}
.controls-wrapper  {
   max-width: 800px;
   margin: 0 auto 0 auto;
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

.home {
   min-height: 400px;
   position: relative;
}
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
   align-items: flex-start;
   max-width: 800px;
   margin: 0 auto 0 auto;
}
#app .pure-form div.basic-search  input[type=text].basic {
  font-size: 1.15em;
  padding: 0.5vw 0.75vw;
  border: 1px solid var(--uvalib-grey);
  margin: 0;
  border-left: 0;
  border-radius: 0 5px 5px 0;
  flex: 1 1 auto;
  min-width: 100px;
}
div.advanced {
  margin-top: 10px;
  font-size: 1em;
  text-align: right;
}
div.tips-container {
  position: absolute;
  font-size: 1em;
  top: 15px;
  right: 15px;
}
div.translate-message {
  margin: 5px 0 15px 0;
  font-size: 0.85em;
}
</style>
