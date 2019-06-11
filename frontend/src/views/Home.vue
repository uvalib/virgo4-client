<template>
   <div class="home">
      <DebugControls v-if="hasResults" />
      <div v-show="searching" class="searching-overlay">
        <div class="searching-box">
          <h4>Searching...</h4>
          <img src="../assets/spinner2.gif">
        </div>
      </div>
      <div class="search-panel pure-form">
        <template v-if="basicSearch">
           <h4>Basic Search</h4>
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
            <p class="tips"><SearchTips/></p>
          </div>
        </template>
        <div v-else class="advanced-panel">
          <h4>Advanced Search</h4>
          <table>
            <tr>
              <td class="label">Author</td>
              <td><input v-model="author" type="text"></td>
              <td class="op"><SearchOpPicker v-model="authorOp"/></td>
            </tr>
            <tr>
              <td class="label">Title</td>
              <td><input v-model="title" type="text"></td>
              <td class="op"><SearchOpPicker v-model="titleOp"/></td>
            </tr>
            <tr>
              <td class="label">Subject</td>
              <td><input v-model="subject" type="text"></td>
              <td class="op"><SearchOpPicker v-model="subjectOp"/></td>
            </tr>
            <tr>
              <td class="label">Keyword</td>
              <td><input v-model="keyword" type="text"></td>
              <td class="op"><SearchOpPicker v-model="keywordOp"/></td>
            </tr>
          </table>
          <div class="controls">
            <PoolsList/>
            <span @click="cancelClicked" class="pure-button pure-button-cancel">Cancel</span>
            <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
            <p class="tips"><SearchTips/></p>
          </div>
        </div>
      </div>
      <h3 v-if="error" class="error">{{ error }}</h3>
      <SearchResults v-if="hasResults"/>
      <DebugControls v-if="hasResults" />
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from "vuex-map-fields"
import SearchResults from "@/components/SearchResults"
import PoolsList from "@/components/PoolsList"
import SearchOpPicker from "@/components/SearchOpPicker"
import SearchTips from "@/components/SearchTips"
import DebugControls from "@/components/DebugControls"
export default {
   name: "home",
   components: {
     SearchResults, PoolsList, SearchOpPicker,
     SearchTips, DebugControls
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
         searching: state => state.searching,
         showDebug: state => state.showDebug,
         showWarn: state => state.showWarn,
      }),
      ...mapGetters({
        hasResults: 'hasResults',
        isDebugEnabled: 'isDebugEnabled',
        areWarningsEnabled: 'areWarningsEnabled'
      }),
      ...mapFields([
        'query.keyword',
        'query.author',
        'query.title',
        'query.subject',
        'query.keywordOp',
        'query.authorOp',
        'query.titleOp',
        'query.subjectOp',
      ]),
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
        this.mode = "advanced"
      },
      cancelClicked() {
        this.$store.commit("clearAdvancedSearch")
        this.mode = "basic"
      }
   }
};
</script>

<style scoped>
h4 {
  color: var(--color-primary-orange);
  margin: 8px 0;
  padding-bottom: 5px;
  font-weight: bold;
  font-size: 22px;
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
.advanced-panel table td.label {
  font-weight: 500;
  text-align: right;
  padding-right: 10px;
  width:1%;
  white-space:nowrap;
  color: #777;
}
.advanced-panel table td.op{
  width:1%;
  white-space:nowrap;
  padding: 0 0 0 10px;
  color: #777;
}
.advanced-panel table {
  width: 100%;
}
.advanced-panel table input {
  width: 100%;
}
.advanced-panel table td {
  padding: 0.75vw 0;
}
span.pure-button {
  margin: 0 0 0 10px;
  border-radius: 5px;
  opacity: 0.8;
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
  color: var(--color-link)
}
.advanced:hover {
  text-decoration: underline;
  cursor: pointer;
}
.home {
   min-height: 400px;
   position: relative;
}
p.fatal, h3.error {
   font-weight: bold;
   color: var(--color-error);
}
.search-panel {
  margin: 0 auto 0 auto;
  text-align: center;
  max-width: 800px;
  padding: 10px 2vw;
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
p.tips {
  font-weight: bold;
  color:var(--color-link);
  cursor:pointer;
  margin:20px 0;
  opacity: 0.8;
}
p.tips:hover {
  opacity:1;
}
.debug.pure-button.pure-button-primary {
  font-size: 0.75em;
  padding: 2px 12px;
}
</style>
