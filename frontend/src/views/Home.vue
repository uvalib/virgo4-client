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
          <input
              @keyup.enter="searchClicked"
              id="keyword"
              v-model="basic"
              autocomplete="off"
              type="text"
              placeholder="Search Virgo for books, articles and more"
          >
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
export default {
   name: "home",
   components: {
     SearchResults,
     SearchTips, AdvancedSearch,SearchingOverlay
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
        hasTranslateMessage: 'system/hasTranslateMessage'
      }),
      ...mapFields('query',[
        'basic',
      ]),
      basicSearch() {
        return this.searchMode == "basic"
      },
   },
   created: function() {
      this.$store.dispatch("system/getConfig")
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
#keyword {
  margin: 0;
  width: 100%;
  font-size: 1.15em;
  box-shadow: none;
  padding: 0.5vw 0.75vw;
  outline: none;
  border: 1px solid #ccc;
}
.debug.pure-button.pure-button-primary {
  font-size: 0.75em;
  padding: 2px 12px;
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
