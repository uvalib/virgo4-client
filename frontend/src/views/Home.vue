<template>
   <div class="home">
      <div class="tips-container">
          <SearchTips/>
      </div>
      <SearchingOverlay message="Searching..." />
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
                placeholder="Search Virgo for books, articles and more"
            >
          </div>
          <div class="controls">
            <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
          </div>
          <div class="advanced">
            <span class="text-button advanced-link" @click="advancedClicked">
              Advanced Search&nbsp;<i class="fas fa-search-plus"></i>
            </span>
          </div>
        </template>
        <AdvancedSearch v-else/>
      </div>
      <transition name="message-transition"
          enter-active-class="animated faster fadeIn"
          leave-active-class="animated faster fadeOut">
        <p v-if="error" class="error">{{ error }}</p>
      </transition>
      <transition name="message-transition"
          enter-active-class="animated faster fadeIn"
          leave-active-class="animated faster fadeOut">
        <p v-if="sessionMessage" class="session" v-html="sessionMessage"></p>
      </transition>
      <SearchResults v-if="hasResults"/>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import SearchResults from "@/components/SearchResults"
import SearchTips from "@/components/popovers/SearchTips"
import AdvancedSearch from "@/components/AdvancedSearch"
import SearchingOverlay from "@/components/layout/SearchingOverlay"
import V4Select from "@/components/V4Select"
export default {
   name: "home",
   components: {
     SearchResults,
     SearchTips, AdvancedSearch,SearchingOverlay,
     V4Select
   },
   computed: {
      ...mapState({
         fatal: state => state.system.fatal,
         error: state => state.system.error,
         showDebug: state => state.showDebug,
         showWarn: state => state.showWarn,
         searchMode: state => state.query.mode,
         translateMessage: state => state.system.translateMessage,
         sessionMessage: state => state.system.sessionMessage,
      }),
      ...mapGetters({
        rawQueryString: 'query/string',
        hasResults: 'hasResults',
        hasTranslateMessage: 'system/hasTranslateMessage',
        isSignedIn: 'user/isSignedIn',
        sources: 'pools/sortedList',
        hasFilter: 'filters/hasFilter',
        selectedResults: 'selectedResults',
      }),
      ...mapFields('query',[
        'basic','basicSearchScope'
      ]),
      searchScopes() {
        let out = [{name: 'All Sources', id: 'all'}]
        return out.concat(this.sources)
      },
      basicSearch() {
        return this.searchMode == "basic"
      },
   },
   created: function() {
      this.$store.dispatch("system/getConfig").then(() => {
        // once cfg is available, get pools. they may be needed
        // to populate the pool selector for non-signed in users
        this.$store.dispatch('pools/getPools')

        // Special query parameter handling; for subject searches the 'subject' param will exist
        let subj = this.$route.query.subject
        if ( subj ) {
          // Grab the current query, then set it to match the query param
          // do the search only if it changes something 
          let prior = this.rawQueryString
          this.$store.commit("query/setSubjectSearch", subj)
          if ( prior != this.rawQueryString) {
            this.$store.commit('query/setLastSearch', this.rawQueryString)
            this.$store.commit('filters/reset')
            this.$store.commit('resetOtherSourceSelection')
            this.$store.dispatch("searchAllPools")
          }
        }

        this.restoreBookmarkTarget()
      })
   },
   methods: {
      // Look for the bookmark cookie. If found, it is an indicator that a user tried to bookmark
      // an item while not signed in. If there is now a signed in user, replay the search,
      // scroll to the target hit and open bookmark popup
      async restoreBookmarkTarget() {
        let bmCookie = this.$cookies.get('v4_bookmark')
        if ( bmCookie && this.isSignedIn) {
          this.$store.commit('query/restoreSearch', bmCookie)
          this.$store.commit('filters/restoreFilters', bmCookie)
          this.$cookies.remove('v4_bookmark')
          await this.$store.dispatch("searchAllPools", bmCookie.page)
          await this.$store.dispatch("selectPoolResults", bmCookie.resultsIdx)
          if ( this.hasFilter(bmCookie.resultsIdx)) {
            this.$store.commit("clearSelectedPoolResults") 
            await this.$store.dispatch("searchSelectedPool")
            this.showBookmarkTarget(bmCookie)
          } else {
            this.showBookmarkTarget(bmCookie)
          }
        }
      },
      showBookmarkTarget(bmCookie) {
        let identifier = bmCookie.hit
        let pool = bmCookie.pool
        let bmData = {pool: pool, data: null}
        if ( bmCookie.groupParent) {
          let sel = `.hit[data-identifier="${bmCookie.groupParent}"]`
          let tgtEle = document.body.querySelector(sel)
          tgtEle.scrollIntoView()

          // find the item in the group that was targeted for a bookmark
          let parent = this.selectedResults.hits.find( r=> r.identifier == bmCookie.groupParent)
          bmData.data = parent.group.find( r=> r.identifier == identifier)

          // The group accordion watches this value. When set, the accordion will auto-expand
          this.$store.commit('setAutoExpandGroupID', bmCookie.groupParent)

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
        
        this.$store.commit("user/showAddBookmark", bmData)
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
        this.$store.commit('query/setLastSearch', this.rawQueryString)
        this.$store.commit('filters/reset')
        this.$store.commit('resetOtherSourceSelection')
        this.$store.dispatch("searchAllPools")
      },

      advancedClicked() {
        this.$store.commit("query/setAdvancedSearch")
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
  justify-content: flex-end;
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
p.fatal, p.error {
  font-weight: bold;
  margin: 0;
  color: var(--color-error);
  opacity: 1;
  visibility: visible;
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
.text-button.advanced-link:hover {
  text-decoration: underline;
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
