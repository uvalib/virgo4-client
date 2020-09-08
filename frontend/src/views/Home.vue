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
            <V4Select id="source-select" :selections="searchScopes" v-bind:attached="true"
              border="1px solid var(--uvalib-brand-blue)"
              v-model="basicSearchScope"
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
          <div class="controls">
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
          <!-- <div v-if="isHomePage" class="advanced">
            <router-link to="/journals">
              Browse Journals&nbsp;<i class="far fa-newspaper"></i>
            </router-link>
          </div> -->
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
import AdvancedSearch from "@/components/AdvancedSearch"
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
         tgtPoolPref: state=>state.preferences.targetPool,
         searchTemplate: state=>state.preferences.searchTemplate,
         optInPoolPrefs: state=>state.preferences.optInPools,
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
        excludedPoolPrefs: 'preferences/excludedPools',
        hasSearchTemplate: 'preferences/hasSearchTemplate',
        externalPoolIDs: 'pools/externalPoolIDs',
        poolSort: 'sort/poolSort'
      }),
      ...mapFields({
        basicSearchScope: 'query.basicSearchScope',
        basic: 'query.basic',
        userSearched: 'query.userSearched',
        lastSearchScrollPosition: 'lastSearchScrollPosition'
      }),
      searchScopes() {
        let out = [{name: 'All Resource Types', id: 'all'}]
        let filtered = this.sources.filter( s => !this.excludedPoolPrefs.includes(s.id) )
        return out.concat(filtered)
      },
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
      async restoreSearchFromQueryParams( query ) {
         if  (!query.q) {
            // No query - reset everything
            this.$store.dispatch('resetSearch')
            setTimeout( ()=> {
               let  s = document.getElementById("search")
               if (s) s.focus()
            }, 250)
         }

         // Interrogate query params and convert them to a search in the model (if present)
         let oldQ = this.rawQueryString
         if (query.mode == 'advanced') {
            this.$store.commit("query/setAdvancedSearch")
            this.$store.commit("query/setExcludePreferences", this.excludedPoolPrefs)
            if ( this.hasSearchTemplate ) {
               this.$store.commit("query/restoreTemplate", this.searchTemplate)
            }
         } else {
            this.$store.commit("query/setBasicSearch")
            if (query.scope && query.scope != "") {
               let tgtScope = this.searchScopes.find( s => s.id == query.scope)
               this.$store.commit("query/setBasicSearchScope", tgtScope)
            }
         }

         let excluded = []
         if (query.exclude) {
            excluded = [...new Set(query.exclude.split(","))]
         }

         // Check for pools that should be excluded unless opted-in
         this.externalPoolIDs.forEach( extPool => {
            // dont exclude the same pool multiple times
            if (excluded.includes(extPool) == false) {
               if ( this.isSignedIn == false ) {
                  excluded.push(extPool)
               } else {
                  if ( this.optInPoolPrefs.includes(extPool) == false) {
                     excluded.push(extPool)
                  }
               }
            }
         })
         this.$store.commit("query/setExcludePreferences", excluded)

         let targetPool = ""
         if (query.pool) {
            targetPool = query.pool
            this.$store.commit("query/setTargetPool", targetPool)
         } else {
            targetPool = this.tgtPoolPref
         }

         let oldFilterParam = this.filterQueryString(targetPool)
         if (query.filter) {
            this.$store.commit("filters/restoreFromURL", {filter: query.filter, pool: targetPool} )
         }

         // cant have sorting if a target pool is not defined...
         let oldSort = ""
         if ( targetPool != "") {
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

         if ( query.q) {
            this.$store.commit("query/restoreFromURL", query.q)

            // only re-run search when query, sort or filtering has changed
            if (this.rawQueryString != oldQ || this.filterQueryString(targetPool) != oldFilterParam ||
                  this.activeSort != oldSort || this.userSearched == true) {
               this.$store.commit("resetSearchResults")
               await this.$store.dispatch("searchAllPools", !this.userSearched)
               this.userSearched = false
               this.$store.commit('setSearching', false)
            }

            if ( this.lastSearchScrollPosition > 0 && (this.$route.path == "/" || this.$route.path == "/search")) {
               window.scrollBy({
                  top: this.lastSearchScrollPosition,
                  behavior: "auto"
               })
            }
         }
      },
      async searchCreated() {
         await this.$store.dispatch('pools/getPools')
         this.$store.dispatch("query/getAdvancedSeatchFilters")

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
               this.$utils.scrollToItem(tgtEle)
               bmData.data = this.selectedResults.hits.find( r=> r.identifier == identifier)
         }
         this.$store.commit("bookmarks/setNewBookmark", bmData)
         let bmEle = document.getElementById(`bm-modal-${identifier}-btn`)
         if (bmEle) {
            bmEle.focus()
            bmEle.click()
         }
      },

      scopeChanged( tgt ) {
         this.$analytics.trigger('Search', 'BASIC_SEARCH_RESOURCE_SET', tgt)
      },

      async searchClicked() {
         let skipPoolParam = false
         let tgtPool = this.tgtPoolPref
         if ( this.basicSearchScope.id == "all") {
            this.$store.commit("query/setTargetPool", tgtPool)
            this.$store.commit("query/setExcludePreferences", this.excludedPoolPrefs)
         } else {
            tgtPool = this.basicSearchScope.id
            this.$store.commit("query/setTargetPool",  tgtPool)
            this.$store.commit("query/setExcludePreferences", [])
            skipPoolParam = true
         }

         // Refine search updates:
         // if pool, filter or sort were specified previously, preserve them in the URL.
         // a new search will always reset paging, so don't preserve that
         let priorQ = Object.assign({}, this.$route.query)
         let qp = this.queryURLParams
         if (priorQ.pool && skipPoolParam==false) {
            qp += `&pool=${priorQ.pool}`
            this.$store.commit("query/setTargetPool", priorQ.pool)
         } else {
            qp += `&pool=${tgtPool}`
            this.$store.commit("query/setTargetPool", tgtPool)
         }
         if (tgtPool != "") {
            // grab current query string for the selected pool straight from the model.
            // cant rely on preserving prior filter string as the target pool may have changed
            // by the user selecting one from the dropdown
            qp += this.filterQueryString(tgtPool)
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
.controls {
  padding: 10px 0;
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  justify-content: flex-start;
}
.controls .search.v4-button {
   margin-left: auto;
}
.controls  > * {
  flex: 0 1 auto;
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
  max-width: 800px;
  padding: 10px 2vw 10px 2vw;
  font-size: 0.95em;
}
.basic-search {
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
}
#app .pure-form div.basic-search  input[type=text].basic {
  font-size: 1.15em;
  padding: 0.5vw 0.75vw;
  border: 1px solid #ccc;
  margin: 0;
  border-left: 0;
  border-radius: 0 5px 5px 0;
  flex: 1 1 auto;
  min-width: 100px;
  &:focus {
      @include be-accessible();
   }
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
