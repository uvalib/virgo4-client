<template>
   <main class="home">
      <div class="tips-container">
          <SearchTips/>
      </div>
      <div v-show="searching" class="searching-overlay">
        <div class="searching-box">
          <p>Searching...</p>
          <img src="../assets/searching.gif">
        </div>
      </div>
      <div class="search-panel pure-form">
        <template v-if="basicSearch">
          <h1>Basic Search</h1>
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
        queryEntered: 'query/queryEntered',
      }),
      ...mapFields('query',[
        'basic',
      ]),
      basicSearch() {
        return this.searchMode == "basic"
      },
   },
   created: function() {
      this.$store.dispatch("getConfig")
   },
   methods: {
      searchClicked() {
        if (this.queryEntered ) {
          this.$store.dispatch("searchAllPools")
        } else {
          this.$store.commit('setError', "Please enter a search query")
        }
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
  top: 0;
  bottom: 0;
  z-index: 1000;
}
div.searching-box {
  background: white;
  display: inline-block;
  padding: 20px 90px;
  border: 5px solid var(--color-primary-orange);
  z-index: 1005;
  font-weight: bold;
  margin: 10vw auto;
}
@media only screen and (min-width: 768px) {
   div.searching-box {
    padding: 20px 90px;
   }
   #keyword {
    padding: 0.5vw 0.75vw;
   }
}
@media only screen and (max-width: 768px) {
   div.searching-box {
       width: 95%;
       padding: 20px 0;
       margin-top:30%;
   }
   #keyword {
      padding: 5px 10px;
   }
   div.tips-container {
     display: none;
   }
}
div.searching-box p {
  color: var(--color-primary-text);
  border: none;
  font-size: 1.25em;
  margin: 0 0 10px 0;
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
</style>
