<template>
   <div class="advanced-panel">
      <h4>Advanced Search<SearchTips/></h4>
      <table>
         <tr>
            <td class="label">Identifier</td>
            <td><input @keyup.enter="searchClicked" v-model="identifier" type="text"></td>
            <td class="op"><SearchOpPicker v-model="identifierOp"/></td>
         </tr>
         <tr>
            <td class="label">Title</td>
            <td><input @keyup.enter="searchClicked" v-model="title" type="text"></td>
            <td class="op"><SearchOpPicker v-model="titleOp"/></td>
         </tr>
         <tr>
            <td class="label">Author</td>
            <td><input @keyup.enter="searchClicked" v-model="author" type="text"></td>
            <td class="op"><SearchOpPicker v-model="authorOp"/></td>
         </tr>
         <tr>
            <td class="label">Subject</td>
            <td><input @keyup.enter="searchClicked" v-model="subject" type="text"></td>
            <td class="op"><SearchOpPicker v-model="subjectOp"/></td>
         </tr>
         <tr>
            <td class="label">Keyword</td>
            <td><input @keyup.enter="searchClicked" v-model="keyword" type="text"></td>
            <td class="op"><SearchOpPicker v-model="keywordOp"/></td>
         </tr>
         <DateSearch/>
      </table>
      <div class="controls">
         <PoolSetup/>
         <span @click="cancelClicked" class="pure-button pure-button-cancel">Cancel</span>
         <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
      </div>
   </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'
import DateSearch from "@/components/DateSearch"
import SearchOpPicker from "@/components/SearchOpPicker"
import PoolSetup from "@/components/popovers/PoolSetup"
import SearchTips from "@/components/popovers/SearchTips"
export default {
   components: {
     SearchOpPicker, DateSearch, PoolSetup, SearchTips
   },
   computed: {
      ...mapFields('query',[
        'identifier',
        'keyword',
        'author',
        'title',
        'subject',
        'identifierOp',
        'keywordOp',
        'authorOp',
        'titleOp',
        'subjectOp',
      ]),
   },
   methods: {
      searchClicked() {
        this.$store.dispatch("searchAllPools")
      },
      cancelClicked() {
        this.$store.commit("query/clear")
        this.$store.commit("setBasicSearch")
      }
   }
};
</script>

<style scoped>
.pure-button.pure-button-cancel {
  background: rgb(202, 60, 60);
  color: white;
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
.advanced-panel table td {
  padding: 2px 5px !important;
}
.advanced-panel table td.label {
  font-weight: 500;
  text-align: right;
  width:1%;
  white-space:nowrap;
  color: #777;
}
.advanced-panel table td.op{
  width:1%;
  white-space:nowrap;
  color: #777;
}
.advanced-panel table {
  width: 100%;
  font-size: 0.9em;
}
.advanced-panel table input {
  width: 100%;
  box-sizing: border-box;
}
.advanced-panel table td {
  padding: 0.75vw 0;
}
.controls {
  font-size: 0.85em;
  font-weight: bold;
  text-align: right;
  padding-top: 10px;
  position: relative;
}
</style>
