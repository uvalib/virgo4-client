<template>
   <div class="home">
      <DebugControls v-if="hasResults" />
      <div v-show="searching" class="searching-overlay">
        <div class="searching-box">
          <h3>Searching...</h3>
          <img src="../assets/spinner2.gif">
        </div>
      </div>
      <div class="search-panel pure-form">
        <template v-if="basicSearch">
           <h4>Basic Search<SearchTips/></h4>
          <input
              @keyup.enter="searchClicked"
              id="keyword"
              v-model="keyword"
              autocomplete="off"
              type="text"
          >
          <div class="controls">
            <PoolsList/>
            <span class="pure-button pure-button-primary" @click="advancedClicked">Advanced</span>
            <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
          </div>
        </template>
        <AdvancedSearch v-else/>
      </div>
      <h3 v-bind:class="{invisible: error.length==0}" class="error">{{ error }}</h3>
      <SearchResults v-if="hasResults"/>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import SearchResults from "@/components/SearchResults"
import PoolsList from "@/components/PoolsList"
import SearchTips from "@/components/SearchTips"
import DebugControls from "@/components/diagnostics/DebugControls"
import AdvancedSearch from "@/components/AdvancedSearch"
export default {
   name: "home",
   components: {
     SearchResults, PoolsList,
     SearchTips, DebugControls, AdvancedSearch
   },
   data: function() {
      return {
        mode: "basic"
      };
   },
   computed: {
      ...mapState({
         fatal: state => state.fatal,
         error: state => state.error,
         searching: state => state.searching,
         showDebug: state => state.showDebug,
         showWarn: state => state.showWarn,
         searchMode: state => state.searchMode
      }),
      ...mapGetters({
        hasResults: 'hasResults',
      }),
      ...mapFields('query',[
        'keyword',
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
        this.$store.dispatch("doSearch")
      },
      advancedClicked() {
        this.$store.commit("setAdvancedSearch")
      },
   }
};
</script>

<style scoped>
.searching-overlay {
  position: absolute;
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
div.searching-box h4 {
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
p.fatal, h3.error {
  font-weight: bold;
  margin: 0;
  color: var(--color-error);
  transition: opacity .5s ease .25s;
  opacity: 1;
  visibility: visible;
}
h3.error.invisible {
  opacity:0;
  visibility: hidden;
}
.search-panel {
  margin: 0 auto 0 auto;
  text-align: center;
  max-width: 800px;
  padding: 10px 2vw 30px 2vw;
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
</style>
