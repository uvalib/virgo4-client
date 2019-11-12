<template>
   <main class="home">
      <div class="tips-container">
          <SearchTips/>
      </div>
      <SearchingOverlay message="Searching..." />
      <div class="search-panel pure-form">
        <template v-if="basicSearch">
          <h1>Basic Search</h1>
          <div v-if="hasTranslateMessage" class="translate-message">
            {{translateMessage}}
          </div>
          <div class="basic-search">
            <V4Select :selections="searchScopes" v-bind:attached="true" 
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
      <SearchResults v-if="hasResults"/>
   </main>
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
         translateMessage: state => state.system.translateMessage
      }),
      ...mapGetters({
        hasResults: 'hasResults',
        queryEntered: 'query/queryEntered',
        hasTranslateMessage: 'system/hasTranslateMessage',
        isSignedIn: 'user/isSignedIn',
        sources: 'pools/sortedList'
      }),
      ...mapFields('query',[
        'basic','basicSearchScope'
      ]),
      searchScopes() {
        let out = [{name: 'All Sources', value: 'all'}]
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
      })
   },
   methods: {
      searchClicked() {
        if (this.queryEntered ) {
          this.$store.dispatch("searchAllPools")
        } else {
          this.$store.commit('system/setError', "Please enter a search query")
        }
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
  font-size: 0.85em;
  font-weight: bold;
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
</style>
