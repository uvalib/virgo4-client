<template>
   <div class="home">
      <p class="fatal">{{fatal}}</p>
      <div v-show="searching" class="searching-overlay">
        <div class="search-box">
          <h4>Searching...</h4>
          <img src="../assets/spinner2.gif">
        </div>
      </div>
      <PoolsList v-if="showPools"/>
      <div class="search-panel pure-form">
        <template v-if="basicSearch">
          <input
              @keyup.enter="searchClicked"
              id="keyword"
              v-model="keyword"
              type="text"
              placeholder="Search for books, maps, DVDs and other catalog materials."
          >
          <div class="controls">
            <span class="pure-button pure-button-secondary" @click="advancedClicked">Advanced</span>
            <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
          </div>
        </template>
        <div class="advanced-panel" v-else>
          <h4>Advanced Search</h4>
          <table>
            <tr>
              <td class="label">Author</td><td><input v-model="author" type="text"></td>
            </tr>
            <tr>
              <td class="label">Title</td><td><input v-model="title" type="text"></td>
            </tr>
            <tr>
              <td class="label">Subject</td><td><input v-model="subject" type="text"></td>
            </tr>
            <tr>
              <td class="label">Keyword</td><td><input v-model="keyword" type="text"></td>
            </tr>
          </table>
          <div class="controls">
            <span @click="poolsClicked" class="pools pure-button pure-button-secondary">Pool Information</span>
            <span @click="cancelClicked" class="pure-button pure-button-cancel">Cancel</span>
            <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
          </div>
        </div>
      </div>
      <h3 class="error">{{ error }}</h3>
      <SearchResults v-if="hasResults"/>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex";
import { mapFields } from "vuex-map-fields"
import SearchResults from "@/components/SearchResults"
import PoolsList from "@/components/PoolsList"
export default {
   name: "home",
   components: {
     SearchResults, PoolsList
   },
   data: function() {
      return {
        mode: "basic"
      };
   },
   computed: {
      basicSearch() {
        return this.mode == "basic"
      },
      ...mapState({
         searchAPI: state => state.searchAPI,
         fatal: state => state.fatal,
         error: state => state.error,
         showPools: state => state.showPools,
         searching: state => state.searching
      }),
      ...mapGetters({
        hasResults: 'hasResults',
      }),
      ...mapFields([
        'query.keyword',
        'query.author',
        'query.title',
        'query.subject',
      ])
   },
   created: function() {
      this.$store.dispatch("getConfig")
   },
   methods: {
      searchClicked() {
        this.$store.commit("resetSearchResults");
        this.$store.dispatch("doSearch");
      },
      advancedClicked() {
        this.mode = "advanced"
      },
      cancelClicked() {
        this.$store.commit("clearAdvancedSearch");
        this.mode = "basic"
      },
      poolsClicked() {
        this.$store.commit("showPoolsOverlay", true);
      }
   }
};
</script>

<style scoped>
h4 {
  color: #eb5f0c;
  margin: 10px 0;
  border-bottom: 1px dashed;
  padding-bottom: 5px;
}
.pure-button.pure-button-secondary {
  background: rgb(66, 184, 221); 
  color: white;
}
.pure-button.pure-button-cancel {
  background: rgb(202, 60, 60);
  color: white;
}
.searching-overlay {
  position: absolute;
  left: 0;
  right: 0;
  top: 16%;
  z-index: 1000;
}
div.search-box {
  background: white;
  display: inline-block;
  padding: 20px 150px;
  border: 1px solid #ccc;
  box-shadow: 2px 2px 10px #ccc;
  border-radius: 5px;
  z-index: 1005;
}
.advanced-panel table td.label {
  font-weight: 500;
  text-align: right;
  padding-right: 10px;
  width: 80px;
  color: #666;
}
.advanced-panel {
  margin: 0 auto;
  padding: 0 0.75em;
  max-width: 600px;
}
.advanced-panel table {
  width: 100%;
}
.advanced-panel table input {
  width: 100%;
}
.advanced-panel table td {
  padding: 5px 0;
}
span.pure-button {
  margin: 0 0 0 10px;
  border-radius: 5px;
  opacity: 0.8;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}
span.pure-button:hover {
  opacity: 1;
}
.controls {
  font-size: 0.85em;
  font-weight: bold;
  text-align: right;
  padding-top: 10px;
  position: relative;
}
.advanced {
  margin-left: 5px;
  font-size: 0.9em;
  font-weight: bold;
  color:cornflowerblue
}
.advanced:hover {
  text-decoration: underline;
  cursor: pointer;
}
.home {
   min-height: 400px;
}
p.fatal, h3.error {
   font-weight: bold;
   color: firebrick;
}
.search-panel {
  margin: 5% auto 0 auto;
  text-align: center;
  max-width: 800px;
  padding: 0.75em;
}
#keyword {
   margin: 0;
   width: 100%;
}
</style>
