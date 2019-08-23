<template>
   <main class="home">
      <div v-show="searching" class="searching-overlay">
        <div class="searching-box">
          <h3>Searching...</h3>
          <img src="../assets/spinner2.gif">
        </div>
      </div>
      <div class="search-panel pure-form">
        <template v-if="basicSearch">
           <h1>Basic Search<SearchTips/></h1>
          <input
              @keyup.enter="searchClicked"
              id="keyword"
              v-model="basic"
              autocomplete="off"
              type="text"
              placeholder="Search Virgo for books, articles and more"
          >
          <div class="controls">
            <PoolSetup/>
            <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
            <div class="advanced">
              <span class="text-button advanced-link" @click="advancedClicked">
                Advanced Search&nbsp;<i class="fas fa-search-plus"></i>
              </span>
            </div>
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
        <div class="signin-message" v-if="signInMessage">
          {{signInMessage}}
        </div>
      </transition>
      <SearchResults v-if="hasResults"/>
   </main>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import SearchResults from "@/components/SearchResults"
import PoolSetup from "@/components/popovers/PoolSetup"
import SearchTips from "@/components/popovers/SearchTips"
import AdvancedSearch from "@/components/AdvancedSearch"
export default {
   name: "home",
   components: {
     SearchResults, PoolSetup,
     SearchTips, AdvancedSearch
   },
   computed: {
      ...mapState({
         fatal: state => state.fatal,
         error: state => state.error,
         searching: state => state.searching,
         showDebug: state => state.showDebug,
         showWarn: state => state.showWarn,
         searchMode: state => state.query.mode,
         signInMessage: state => state.user.signInMessage
      }),
      ...mapGetters({
        hasResults: 'hasResults',
      }),
      ...mapFields('query',[
        'basic',
      ]),
      basicSearch() {
        return this.searchMode == "basic"
      },
      debugLabel() {
        if (this.showDebug) {
          return "Hide Debug"
        }
        return "Show Debug"
      },
      warnLabel() {
        if (this.showWarn) {
          return "Hide Warnings"
        }
        return "Show Warnings"
      }
   },
   created: function() {
      this.$store.dispatch("getConfig")
   },
   methods: {
      searchClicked() {
        this.$store.dispatch("searchAllPools")
      },
      advancedClicked() {
        this.$store.commit("query/setAdvancedSearch")
      },
   }
};
</script>

<style scoped>
.searching-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 5vw;
  z-index: 1000;
}
div.searching-box {
  background: white;
  display: inline-block;
  padding: 20px 150px;
  border: 1px solid #ccc;
  box-shadow: 2px 2px 10px #ccc;
  border-radius: 5px;
  z-index: 1005;
}
div.searching-box h1 {
  color: var(--color-primary-text);
  border: none;
}
.controls {
  font-size: 0.85em;
  font-weight: bold;
  text-align: right;
  padding-top: 10px;
  position: relative;
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
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 1.1em;
  box-shadow: none;
  padding: 0.5vw 0.75vw;
  outline: none;
  border: 1px solid #ccc;
}
.debug.pure-button.pure-button-primary {
  font-size: 0.75em;
  padding: 2px 12px;
}
.signin-message {
  width: 50%;
  margin: 5px auto;
  background: var(--color-primary-orange);
  color: white;
  padding: 2px;
  border-radius: 5px;
  font-weight: bold;
}
div.advanced {
  text-align: right;
}
.text-button.advanced-link {
  margin-top: 15px;
  font-size: 1.1em;
}
.text-button.advanced-link:hover {
  text-decoration: underline;
}
</style>
