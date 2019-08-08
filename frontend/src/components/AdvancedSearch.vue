<template>
   <div class="advanced-panel">
      <h1>
        <span>Advanced Search</span>
        <SearchTips/>
      </h1>
      <div class="criteria">
        <div v-for="(term,idx) in advanced" :key="idx" class="search-term">
          <template v-if="idx > 0" >
            <select class="search-term-op" v-model="term.op">
              <option value="AND">AND</option>
              <option value="OR">OR</option>
              <option value="NOT">NOT</option>
            </select>
          </template>
          <select class="field" v-model="term.field">
            <option value="keyword">Keyword</option>
            <option value="identifier">Identifier</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="subject">Subject</option>
            <option value="date">Date</option>
          </select>
          <template v-if="term.field != 'date'">
            <input @keyup.enter="searchClicked" v-model="term.value" type="text" class="term"/>
          </template>
          <template v-else>
            <div class="date-criteria">
              <select class="date-range-type"  v-model="term.type">
                <option value="EQUAL">EQUALS</option>
                <option value="AFTER">AFTER</option>
                <option value="BEFORE">BEFORE</option>
                <option value="BETWEEN">BETWEEN</option>
              </select>
              <input @keyup.enter="searchClicked" type="text" v-model="term.value" >
              <span v-if="term.type=='BETWEEN'" class="date-sep">and</span>
              <input v-if="term.type=='BETWEEN'" type="text" @keyup.enter="searchClicked" v-model="term.endVal">
            </div>
          </template>
          <span class="remove">
            <i @click="removeCriteria(idx)" class="remove fas fa-trash-alt"></i>
          </span>
        </div>
      </div>
      <div class="controls">
        <span @click="addClicked" class="pure-button pure-button-secondary">Add Criteria</span>
        <PoolSetup/>
        <span @click="basicClicked" class="pure-button pure-button-secondary">Basic Search</span>
        <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
      </div>
   </div>
</template>

<script>
import PoolSetup from "@/components/popovers/PoolSetup"
import SearchTips from "@/components/popovers/SearchTips"
import { mapMultiRowFields } from 'vuex-map-fields'
export default {
   components: {
     PoolSetup, SearchTips
   },
   computed: {
      ...mapMultiRowFields('query',['advanced']),
   },
   methods: {
      searchClicked() {
        this.$store.dispatch("searchAllPools")
      },
      basicClicked() {
        this.$store.commit("query/clear")
        this.$store.commit("query/setBasicSearch")
      },
      addClicked() {
        this.$store.commit("query/addCriteria")
      },
      removeCriteria(idx) {
        this.$store.commit("query/removeCriteria", idx)
      }
    }
};
</script>

<style scoped>
.pure-button.pure-button-cancel {
  background: rgb(202, 60, 60);
  color: white;
}
div.criteria {
  font-size: 0.9em;
}
.controls {
  font-size: 0.85em;
  font-weight: bold;
  text-align: right;
  padding: 10px 0;
  position: relative;
}

span.remove {
  margin-left: 10px;
  display: inline-block;
}
i.remove {
  opacity: .6;
  cursor: pointer;
  font-size: 1.5em;
  position: relative;
  top: 4px;
}
i.remove:hover {
  opacity: 1;
}
div.search-term {
   display: flex;
   flex-wrap: nowrap;
   margin: 4px 0;
}
.search-term-op {
   display: inline-block;
   margin-right: 10px;
}
input[type=text] {
   padding: 6px !important;
   flex: 1 1 auto;
   margin-right: 10px;
}
.date-range-type {
   margin-right: 10px;
   flex: 1 1 auto;
}
.date-sep {
   font-weight: 100;
   margin-right: 10px;
}
.date-criteria {
   display: flex;
   flex: 1 1 auto;
   flex-wrap: wrap;
   justify-content: space-between;
}
select.field {
  margin-right: 10px;
}
</style>
