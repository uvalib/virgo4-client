<template>
   <div class="advanced-panel">
      <h1>
         <span>Advanced Search</span>
      </h1>
      <div class="pools-wrapper">
         <h2>Resource Types</h2>
         <div class="pools">
            <div tabindex="0" @click="poolClicked(src.url)" class="pool" v-for="src in sources" :key="src.id">
               <i v-if="isPoolExcluded(src.url)" class="far fa-square"></i>
               <i v-else class="far fa-check-square"></i>
               {{src.name}}
            </div>
         </div>
      </div>
      <div class="criteria">
         <h2>Search Criteria<i @click="addClicked" class="add fas fa-plus-circle"></i></h2>
         <div v-for="(term,idx) in advanced" :key="idx" class="search-term">
            <div class="options">
               <template v-if="idx > 0">
                  <select class="search-term-op" v-model="term.op">
                     <option value="AND">AND</option>
                     <option value="OR">OR</option>
                     <option value="NOT">NOT</option>
                  </select>
               </template>
               <select class="field" v-model="term.field">
                  <option
                     v-for="fieldObj in advancedFields"
                     :key="fieldObj.value"
                     :value="fieldObj.value"
                  >{{fieldObj.label}}</option>
               </select>
               <template v-if="term.field == 'date'">
                  <select class="date-range-type" v-model="term.type">
                     <option value="EQUAL">EQUALS</option>
                     <option value="AFTER">AFTER</option>
                     <option value="BEFORE">BEFORE</option>
                     <option value="BETWEEN">BETWEEN</option>
                  </select>
               </template>
               <i @click="removeCriteria(idx)" class="remove fas fa-times-circle"></i>
            </div>

            <div class="query">
               <template v-if="term.field != 'date'">
                  <input @keyup.enter="doAdvancedSearch" v-model="term.value" type="text" class="term" />
               </template>
               <template v-else>
                  <div class="date-criteria">
                     <input @keyup.enter="doAdvancedSearch" type="text" v-model="term.value" />
                     <span v-if="term.type=='BETWEEN'" class="date-sep">and</span>
                     <input
                        v-if="term.type=='BETWEEN'"
                        type="text"
                        @keyup.enter="doAdvancedSearch"
                        v-model="term.endVal"
                     />
                  </div>
               </template>
            </div>
         </div>
      </div>
      <div class="controls">
         <span @click="doAdvancedSearch" class="pure-button pure-button-primary">Search</span>
      </div>
      <div class="basic">
         <span class="text-button basic-link" @click="basicClicked">
            Basic Search&nbsp;
            <i class="fas fa-undo-alt"></i>
         </span>
      </div>
      <div class="basic">
         <V4BarcodeScanner @scanned="barcodeScanned"/>
      </div>
      <div class="basic">
         <router-link to="/journals">
            Browse Journals&nbsp;<i class="far fa-newspaper"></i>
         </router-link>
      </div>
   </div>
</template>

<script>
import { mapMultiRowFields } from "vuex-map-fields"
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import V4BarcodeScanner from "@/components/V4BarcodeScanner"

export default {
   data: function() {
      return {
         dropdownSources: true,
      } 
   },
   components: {
      V4BarcodeScanner
   },
   computed: {
      ...mapState({
         advancedFields: state => state.query.advancedFields,
      }),
      ...mapGetters({
         queryEntered: "query/queryEntered",
         sources: "pools/sortedList",
         isPoolExcluded: "preferences/isPoolExcluded",
         rawQueryString: 'query/string',
      }),
      ...mapMultiRowFields("query", ["advanced"])
   },
   methods: {
      poolClicked(url) {
        // commit instead of dispatch. Treatign changes here as override.
        // to save, go to preferences
        this.$store.commit("preferences/toggleExcludePool", url)
      },
      doAdvancedSearch() {
         if (this.queryEntered) {
            // this is a new search, reset everything
            this.$store.commit('resetSearchResults')
            this.$store.commit('filters/reset')
            this.$store.dispatch("searchAllPools")
         } else {
            this.$store.commit(
               "system/setError",
               "Please enter a search query"
            );
         }
      },
      basicClicked() {
         let cr = this.$router.currentRoute
         if ( cr.path != "/" ) {
            this.$router.push("/")
         }
         this.$store.commit("query/setBasicSearch")
      },
      addClicked() {
         this.$store.commit("query/addCriteria");
      },
      removeCriteria(idx) {
         this.$store.commit("query/removeCriteria", idx);
      },
      barcodeScanned(barcode) {
         this.$store.commit('resetSearchResults')
         this.$store.commit('filters/reset')
         this.$store.commit("query/advancedBarcodeSearch", barcode)
         this.$store.dispatch("searchAllPools")
      }
   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
   }
};
</script>

<style scoped>
h2 {
   text-align: left;
   font-size: 1em;
   color: #444;
   margin: 5px 0;
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between; 
   align-items: center;
}
i.add {
   font-size: 1.75em;
   color: var(--uvalib-brand-blue-light);
   cursor: pointer;
}
div.pools-wrapper {
   border-bottom: 3px solid var(--color-brand-blue);
   margin-bottom: 25px;
   padding-bottom: 10px;
}
div.pools {
   text-align: left;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: flex-start;
   margin: 0;
}
div.pool{
   margin: 5px 10px;
   cursor: pointer;
}
div.criteria {
   font-size: 0.9em;
   text-align: left;
}
div.options {
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
}
.options select {
   margin: 0 0.8em 0 0;
   flex-basis: content;
}
i.remove {
   cursor: pointer;
   font-size: 1.75em;
   color: var(--uvalib-red-emergency);
   float: right;
}

div.query {
   flex-flow: row nowrap;
   align-items: flex-start;
   justify-content: space-between;
   width: 100%;
   
}
.controls {
  padding: 10px 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: flex-start;
}
.controls .pure-button.pure-button-primary {
   margin-left: auto;
}
.controls  > * {
  flex: 0 1 auto;
}

div.search-term {
   border: 1px solid #ccc;
   padding: 10px;
   margin: 10px 0 10px 0;
   border-radius: 5px;
   background-color: #f5f5f5;
}
input[type="text"] {
   flex: 1 1 auto;
}
.date-sep {
   font-weight: 500;
}
div.search-term .date-criteria {
   display: flex;
   flex: 1 1 auto;
   flex-flow: row wrap;
   align-items: center;
   margin-right: 0;
}
div.query .term {
   box-sizing: border-box;
   width: 100%;
}
div.search-term .date-criteria > * {
   margin: 0 0.8em 0 0;
}
div.search-term .date-criteria input:last-child {
   margin-right: 0;
}

div.basic {
   margin-top: 10px;
  font-size: 1em;
  text-align: right;
}
.text-button.basic-link:hover {
   text-decoration: underline;
}
</style>
