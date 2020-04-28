<template>
   <div class="home">
      <div class="tips-container">
          <SearchTips/>
      </div>
      <V4Spinner  v-if="searching" message="Searching..." v-bind:overlay="true" v-bind:dots="false" />
      <div class="search-panel pure-form">
        <template v-if="basicSearch">
          <h1>Search</h1>
          <div v-if="hasTranslateMessage" class="translate-message">
            {{translateMessage}}
          </div>
          <div class="basic-search">
            <V4Select :selections="searchScopes" v-bind:attached="true"
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
            <router-link to="/search?mode=advanced">
              Advanced Search&nbsp;<i class="fas fa-search-plus"></i>
            </router-link>
          </div>
          <div class="advanced">
            <V4BarcodeScanner @scanned="barcodeScanned"/>
          </div>
          <div class="advanced">
            <router-link to="/journals">
              Browse Journals&nbsp;<i class="far fa-newspaper"></i>
            </router-link>
          </div>
        </template>
        <AdvancedSearch v-else/>
      </div>
      <transition name="message-transition"
          enter-active-class="animated faster fadeIn"
          leave-active-class="animated faster fadeOut">
        <p v-if="restoreMessage" class="session" v-html="restoreMessage"></p>
      </transition>
      <SearchResults v-if="hasResults"/>
      <Welcome  v-else-if="isHomePage"  />
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import SearchResults from "@/components/SearchResults"
import SearchTips from "@/components/popovers/SearchTips"
import SourceInfo from "@/components/popovers/SourceInfo"
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
      console.log("before update")
      this.stateFromQueryParams(to.query)
      next()
   },
   data: function() {
      return {
         showVideo: false,
         paramHandled: false
      }
   },
   computed: {
      ...mapState({
         searching: state => state.searching,
         searchMode: state => state.query.mode,
         translateMessage: state => state.system.translateMessage,
         restoreMessage: state => state.query.restoreMessage,
      }),
      ...mapGetters({
        queryURLParams: 'query/queryURLParams',
        rawQueryString: 'query/string',
        hasResults: 'hasResults',
        hasTranslateMessage: 'system/hasTranslateMessage',
        isSignedIn: 'user/isSignedIn',
        sources: 'pools/sortedList',
        selectedResults: 'selectedResults',
      }),
      ...mapFields('query',[
        'basic','basicSearchScope'
      ]),
      searchScopes() {
        let out = [{name: 'All Resource Types', id: 'all'}]
        return out.concat(this.sources)
      },
      basicSearch() {
        return this.searchMode == "basic"
      },
      isHomePage() {
         return this.$router.currentRoute.path == '/'
      },
      // This restore refers to a Saved Search
      isRestore() {
         return ( this.$route.params !== undefined &&
              this.$route.params.id !== undefined &&
              this.$route.params.id != "")
      }
   },
   created: function() {
       console.log("CREATED")
      this.searchCreated()
      setTimeout( ()=> {
         let  s = document.getElementById("search")
         if (s) s.focus()
      },250)
   },
   methods: {
      stateFromQueryParams( query) {
         // Interrogate query params and convert them to a search in the model (if present)
         if (query.mode == 'advanced') {
            this.$store.commit("query/setAdvancedSearch")
         } else {
            this.$store.commit("query/setBasicSearch")
            if (query.scope != "") {
               let tgtScope = this.searchScopes.find( s => s.id == query.scope)
               this.$store.commit("query/setBasicSearchScope", tgtScope)
            }
         }
         if (query.q) {
            this.$store.commit("query/restoreQueryFromURL",query.q)  
            this.$store.commit('resetSearchResults')
            this.$store.commit('filters/reset')
            this.$store.dispatch("searchAllPools")
         }
      },
      async searchCreated() {
         // Config and pools are needed for this page.
         await this.$store.dispatch("system/getConfig")
         await this.$store.dispatch('pools/getPools')

         this.stateFromQueryParams(this.$route.query)
         
         // TODO all of the restore stuff is broken by URL params. Needs to be redone

         // // When restoring a saved search, the call will be /search/:token
         // if ( this.isRestore) {
         //    let token = this.$route.params.id
         //    await this.$store.dispatch("query/loadSearch", token)
         //    this.$store.commit("restore/clearAll")
         //    return
         // } else if(this.$store.getters['restore/hasPreviousSearch']) {
         //   this.restorePreviousSearch()
         // }
      },

      async restorePreviousSearch() {
        try {
          // clear and cancel if not signed in
          if( !this.$store.getters['user/isSignedIn']) {
            return
          }
          await this.$store.dispatch("restore/loadSearch")

          this.showBookmarkTarget()
        } finally {
          this.$store.commit("restore/clearAll")
        }
      },

      showBookmarkTarget() {
        let bmRestore = this.$store.getters['restore/bookmarkData']

        if (!bmRestore.recordId) {return}

        let identifier = bmRestore.recordId
        let bmData = {pool: bmRestore.poolName, data: null}
        if ( bmRestore.groupParent) {
          let sel = `.hit[data-identifier="${bmRestore.groupParent}"]`
          let tgtEle = document.body.querySelector(sel)
          tgtEle.scrollIntoView()

          // find the item in the group that was targeted for a bookmark
          let parent = this.selectedResults.hits.find( r=> r.identifier == bmRestore.groupParent)
          bmData.data = parent.group.find( r=> r.identifier == identifier)

          // The group accordion watches this value. When set, the accordion will auto-expand
          this.$store.commit('setAutoExpandGroupID', bmRestore.groupParent)

          // once the group is expanded, scroll to the target group item
          setTimeout( ()=>{
            sel = `.group-hit[data-identifier="${identifier}"]`
            tgtEle = document.body.querySelector(sel)
            this.scrollToItem(tgtEle)
          }, 300)

        } else {
          let sel = `.hit[data-identifier="${identifier}"]`
          let tgtEle = document.body.querySelector(sel)
          this.scrollToItem(tgtEle)
          bmData.data = this.selectedResults.hits.find( r=> r.identifier == identifier)
        }
        this.$store.commit("restore/clearAll")
        this.$store.commit("bookmarks/showAddBookmark", bmData)
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
         let qp =  this.queryURLParams 
         this.$router.push(`/search?${qp}`)
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
.controls {
  padding: 10px 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
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
p.session {
  display: inline-block;
  background: var(--uvalib-blue-alt-light);
  padding: 10px 35px;
  border-radius: 5px;
  border: 2px solid var(--color-brand-blue);
  box-shadow: 1px 1px 5px #aaa;
}
</style>
