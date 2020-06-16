<template>
   <div class="home">
      <V4Spinner  v-if="searching" message="Searching..." v-bind:overlay="true" v-bind:dots="false" />
      <div class="search-panel pure-form">
        <template v-if="basicSearch">
          <h1>Search</h1>
          <div v-if="hasTranslateMessage" class="translate-message">
            {{translateMessage}}
          </div>
          <label class="screen-reader-text" for="search">Search Virgo for books, articles and more.</label>
         <label class="screen-reader-text" for="source-select">Search in</label>
          <div class="basic-search">
            <V4Select id="source-select" :selections="searchScopes" v-bind:attached="true"
              border="1px solid var(--uvalib-brand-blue)"
              v-model="basicSearchScope"/>
            <input class="basic"
                @keyup.enter="searchClicked"
                v-model="basic"
                autocomplete="off"
                type="text"
                id="search"
                placeholder="Search Virgo for books, articles and more"
            >
          </div>
          <div class="controls">
            <SourceInfo />
            <V4Button @click="searchClicked" class="search" mode="primary">Search</V4Button>
          </div>
          <div class="advanced">
            <SearchTips/><span class="sep">|</span> 
            <router-link tabindex="0" :to="advancedURL">
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
import SourceInfo from "@/components/disclosures/SourceInfo"
import AdvancedSearch from "@/components/AdvancedSearch"
import V4Select from "@/components/V4Select"
import Welcome from "@/components/Welcome"
import V4BarcodeScanner from "@/components/V4BarcodeScanner"

export default {
   name: "home",
   components: {
     SearchResults, V4BarcodeScanner,
     SearchTips, AdvancedSearch,
     V4Select, Welcome, SourceInfo
   },
   beforeRouteUpdate (to, _from, next) {
      // This happens any time the route or query params change.
      // The create handler only happens on initial page load, and in that case, 
      // beforeRouteUpdate is NOT called
      this.isHomePage = false
      if (to.path == "/") {
         this.isHomePage = true
      }
      this.restoreSearchFromQueryParams(to.query)
      next()
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
                  this.scrollToItem(r)
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
         restoreURL: state=>state.restore.url
      }),
      ...mapGetters({
        queryEntered: 'query/queryEntered',
        queryURLParams: 'query/queryURLParams',
        rawQueryString: 'query/string',
        hasResults: 'hasResults',
        hasTranslateMessage: 'system/hasTranslateMessage',
        sources: 'pools/sortedList',
        selectedResults: 'selectedResults',
      }),
      ...mapFields({
        basicSearchScope: 'query.basicSearchScope',
        basic: 'query.basic',
      }),
      searchScopes() {
        let out = [{name: 'All Resource Types', id: 'all'}]
        return out.concat(this.sources)
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
      advancedURL() {
         let url = "/search?mode=advanced"
         if (this.queryEntered) {
            url += `&q=${this.rawQueryString}`
         }
         return url
      }
   },
   methods: {
      async restoreSearchFromQueryParams( query, force ) {
         // No mode or query; just reset the search 
         if (!query.mode && !query.q) {
            this.$store.commit('resetSearchResults')
            this.$store.commit('filters/reset')
            this.$store.commit('query/clear')
            setTimeout( ()=> {
               let  s = document.getElementById("search")
               if (s) s.focus()
            },250)
            return
         }

         // Interrogate query params and convert them to a search in the model (if present)
         let oldQ = this.rawQueryString
         if (query.mode == 'advanced') {
            this.$store.commit("query/setAdvancedSearch")
         } else {
            this.$store.commit("query/setBasicSearch")
            if (query.scope && query.scope != "") {
               let tgtScope = this.searchScopes.find( s => s.id == query.scope)
               this.$store.commit("query/setBasicSearchScope", tgtScope)
            }
         }
         if (query.q) {
            this.$store.commit("query/restoreFromURL",query.q)  

            // Need this to prevent re-running the search when toggle between basic and advanced
            if (this.rawQueryString != oldQ || force === true) {
               this.$store.commit('resetSearchResults')
               this.$store.commit('filters/reset')
               await this.$store.dispatch("searchAllPools", true )
 
               let tgtResultIdx = 0
               if (query.pool) {
                  let idx = this.results.findIndex( r => r.pool.id == query.pool)
                  if ( idx > -1) {
                     // set up sort ordering so search is only done once
                     this.$store.commit("setResultsSort", {resultIdx: idx, sort: query.sort})
                     await this.$store.dispatch("selectPoolResults", idx)
                     tgtResultIdx = idx
                  }
               } else if (query.sort) {
                  // if no pool was selected, the defult pool can still have a sort order set
                  this.$store.commit("setResultsSort", {resultIdx: 0, sort: query.sort})
               }

               if (query.filter) {
                  this.$store.commit("filters/restoreFromURL", {filter: query.filter, resultIdx: tgtResultIdx} )  
               }

               if (query.sort || query.filter || query.page) {
                  this.$store.commit("clearSelectedPoolResults")
                  let page = parseInt(query.page, 10)
                  await this.$store.dispatch("searchSelectedPool", page)
               }
               this.$store.commit('setSearching', false)
            }
         } 
      },
      async searchCreated() {
         await this.$store.dispatch('pools/getPools')
         await this.$store.dispatch("query/getAdvancedSeatchFilters")

         // When restoring a saved search, the call will be /search/:token
         if ( this.isRestore ) {
            // Load the search from the :token and restore it
            let token = this.$route.params.id
            await this.$store.dispatch("query/loadSearch", token)
            this.restoreSearchFromQueryParams(this.$route.query, true)
            return
         } else {
            await this.restoreSearchFromQueryParams(this.$route.query)
         }

         let bmTarget = this.$store.getters['restore/bookmarkTarget']
         if (bmTarget.id != "") {
            this.showAddBookmark(bmTarget)
            this.$store.commit("restore/clear")
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
                  this.scrollToItem(tgtEle)
               }
            }, 250)

         } else {
               let sel = `.hit[data-identifier="${identifier}"]`
               let tgtEle = document.body.querySelector(sel)
               this.scrollToItem(tgtEle)
               bmData.data = this.selectedResults.hits.find( r=> r.identifier == identifier)
         }
         this.$store.commit("bookmarks/setNewBookmark", bmData)
         let bmEle = document.getElementById(`bm-modal-${identifier}-btn`)
         if (bmEle) {
            bmEle.focus()
            bmEle.click()
         }
      },

      scrollToItem( tgtEle ) {
        let nav = document.getElementById("v4-navbar")
        var headerOffset = nav.offsetHeight
        var elementPosition = tgtEle.getBoundingClientRect().top
        var offsetPosition = elementPosition - headerOffset
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        })
      },

      searchClicked() {
         // Update the query params in the URL, but since the store already
         // contains all of the data from the URL it wont trigger the search. Do it manually
         let qp =  this.queryURLParams 
         this.$router.push(`/search?${qp}`)
         this.$store.commit('resetSearchResults')
         this.$store.commit('filters/reset')
         this.$store.dispatch("searchAllPools")
         this.$store.dispatch("searches/updateHistory")
      },

      barcodeScanned( barcode ) {
         this.basic = barcode
         this.searchClicked()
      },
   }
};
</script>

<style scoped>
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
  outline: none;
  border: 1px solid #ccc;
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
