<template>
   <div class="home">
      <p class="fatal">{{fatal}}</p>
      <div v-show="searching" class="searching-overlay">
        <div class="search-box">
          <h4>Searching...</h4>
          <img src="../assets/spinner2.gif">
        </div>
      </div>
      <div class="search-panel pure-form">
        <template v-if="basicSearch">
          <input
              @keyup.enter="searchClicked"
              id="keyword"
              v-model="keyword"
              type="text"
              placeholder="Search for books, maps, DVDs and other catalog materials."
          >
          <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
          <span class="advanced" @click="advancedClicked">Advanced</span>
        </template>
        <div class="advanced-panel" v-else>
          <p>Advanced Search</p>
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
            <span @click="cancelClicked" class="pure-button pure-button-primary">Cancel</span>
            <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
          </div>
        </div>
      </div>
      <h4 class="error">{{ error }}</h4>
      <SearchResults v-if="hasResults"/>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex";
import { mapFields } from "vuex-map-fields"
import SearchResults from "@/components/SearchResults"
export default {
   name: "home",
   components: {
     SearchResults
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
      this.$store.dispatch("getConfig");
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
      }
   }
};
</script>

<style scoped>
.searching-overlay {
  position: absolute;
  left: 0;
  right: 0;
  top: 16%;
}
div.search-box {
  background: white;
  display: inline-block;
  padding: 20px 150px;
  border: 1px solid #ccc;
  box-shadow: 2px 2px 10px #ccc;
  border-radius: 5px;
}
.advanced-panel table td.label {
  font-weight: bold;
  text-align: right;
  padding-right: 10px;
  width: 80px;
}
.advanced-panel {
  width: 50%;
  margin: 0 auto;
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
span.pure-button.pure-button-primary {
  margin: 0 0 0 10px;
}
.controls {
  text-align: right;
  padding-top: 10px;
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
p.fatal, h4.error {
   font-weight: bold;
   color: firebrick;
}
.search-panel {
   margin: 5% auto 0 auto;
   text-align: center;
}
#keyword {
   margin: 0;
   width: 60%;
}
</style>
