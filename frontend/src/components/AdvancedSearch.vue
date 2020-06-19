<template>
   <div class="advanced-panel">
      <h1>
         <span>Advanced Search</span>
      </h1>
      <div class="criteria">
         <h2>
            <span>Search Criteria</span>
         </h2>
         <div v-for="(term,idx) in advanced" :key="idx" class="search-term">
            <div class="options">
               <template v-if="idx > 0">
                  <select class="search-term-op" v-model="term.op" :aria-label="`boolean operator for search criteria number ${idx+1}`">
                     <option value="AND">AND</option>
                     <option value="OR">OR</option>
                     <option value="NOT">NOT</option>
                  </select>
               </template>
               <select class="field" v-model="term.field" :aria-label="` field name for search criteria number ${idx+1}`">
                  <option
                     v-for="fieldObj in advancedFields"
                     :key="fieldObj.value"
                     :value="fieldObj.value"
                  >{{fieldObj.label}}</option>
               </select>
               <template v-if="getTermType(term) == 'date'">
                  <select class="date-range-type" v-model="term.comparison" :aria-label="`date comparision mode for search criteria ${idx+1}`">
                     <option value="EQUAL">EQUALS</option>
                     <option value="AFTER">AFTER</option>
                     <option value="BEFORE">BEFORE</option>
                     <option value="BETWEEN">BETWEEN</option>
                  </select>
               </template>
               <V4Button v-if="canDeleteCriteria" mode="icon" class="remove" @click="removeCriteria(idx)" 
                  :aria-label="`delete search criteria number ${idx+1}`">
                  <i class="fas fa-times-circle"></i>
               </V4Button>
            </div>

            <div class="query">
               <template v-if="getTermType(term) == 'date'">
                   <div class="date-criteria">
                     <input @keyup.enter="doAdvancedSearch" type="text" v-model="term.value"
                         :aria-label="`date for search criteria number ${idx+1}`"/>
                     <span v-if="term.comparison == 'BETWEEN'" class="date-sep">and</span>
                     <input
                        v-if="term.comparison == 'BETWEEN'"
                        type="text"
                        @keyup.enter="doAdvancedSearch"
                        v-model="term.endVal"
                        :aria-label="`end date for search criteria ${idx+1}`"
                     />
                  </div>
                  <div class="date-hint">Accepted formats: YYYY, YYYY-MM, YYYY-MM-DD</div>
               </template>
               <template v-else-if="getTermType(term) == 'select'">
                  <div class="select-criteria">
                     <select class="term" :aria-label="`select ${getTermLabel(term)} for criteria number ${idx+1}`" v-model="term.value">
                        <option value="" disabled selected>Select a {{getTermLabel(term)}}</option>
                        <option v-for="opt in getTermChoices(term)" :key="`${opt}`" :value="opt">{{opt}}</option>
                     </select>
                  </div>
               </template>
               <template v-else>
                   <input @keyup.enter="doAdvancedSearch" v-model="term.value" type="text" class="term" 
                     :aria-label="`query string for search criteria number ${idx+1}`"/>
               </template>
            </div>
         </div>
         <div class="criteria-control">
            <V4Button mode="primary" @click="addClicked">Add Criteria</V4Button>
         </div>
      </div>
      <div class="pools-wrapper">
         <h2>
            <span>Resource Types</span>
            <span>
               <V4Button mode="text" class="clear" @click="clearPoolsClicked">clear all</V4Button>
               <span class="sep">|</span>
               <V4Button mode="text" class="clear" @click="allPoolsClicked">select all</V4Button>
            </span>
         </h2>
         <div class="pools">
            <V4Checkbox v-for="src in sources" :key="src.id" class="pool"
               :aria-label="`toggle inclusion of ${src.name} in search results`"
               :checked="!isPoolExcluded(src.url)"  
               @click="poolClicked(src.url)">
               {{src.name}}
            </V4Checkbox>
         </div>
      </div>
      <div class="controls">
         <V4Button mode="text" class="clear" @click="clearSearch">clear search</V4Button>
         <span class="sep">|</span>
         <V4Button mode="primary" @click="doAdvancedSearch">Search</V4Button>
      </div>
      <div class="basic">
         <router-link :to="basicSearchURL">
            Basic Search&nbsp;
            <i class="fas fa-undo-alt"></i>
         </router-link>
      </div>
      <div class="basic">
         <V4BarcodeScanner @scanned="barcodeScanned"/>
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
      basicSearchURL() {
         let url = "/search"
         let bq = this.rawQueryString 
         if (bq.length > 0) {
            url += `?q=${encodeURI(bq)}`
         }
         return url
      },
      ...mapState({
         advancedFields: state => state.query.advancedFields,
      }),
      ...mapGetters({
         queryURLParams: 'query/queryURLParams',
         queryEntered: "query/queryEntered",
         sources: "pools/sortedList",
         isPoolExcluded: "preferences/isPoolExcluded",
         rawQueryString: 'query/string',
         isSignedIn: 'user/isSignedIn',
      }),
      ...mapMultiRowFields("query", ["advanced"]),
      canDeleteCriteria() {
         return this.advanced.length > 1
      }
   },
   methods: {
      getTermType( term ) {
         let tgtField = this.advancedFields.find( af=> af.value == term.field)
         return tgtField.type
      },
      getTermLabel( term ) {
         let tgtField = this.advancedFields.find( af=> af.value == term.field)
         return tgtField.label
      },
      getTermChoices( term ) {
         let tgtField = this.advancedFields.find( af=> af.value == term.field)
         return tgtField.choices
      },
      clearPoolsClicked() {
         let urls = [] 
         this.sources.forEach( p => {
            urls.push(p.url)
         })
         this.$store.commit("preferences/excludeAll", urls)
      },
      allPoolsClicked() {
         this.$store.commit("preferences/clearExcluded")
      },
      poolClicked(url) {
        // commit instead of dispatch. Treatign changes here as override.
        // to save, go to preferences
        this.$store.commit("preferences/toggleExcludePool", url)
      },
      doAdvancedSearch() {
         if (this.queryEntered) {
            let qs = this.queryURLParams 
            this.$router.push(`/search?${qs}`)
            this.$store.commit('resetSearchResults')
            this.$store.commit('filters/reset')
            this.$store.dispatch("searchAllPools")
            this.$store.dispatch("searches/updateHistory")
            let s = "SIGNED_OUT"
            if ( this.isSignedIn ) {
               s = "SIGNED_IN"
            }
            if ( decodeURI(qs).includes("UVA Library Digital Repository") ) {
               this.$analytics.trigger('Search', 'DIGITAL_COLLECTION_SELECTED')   
            }
            this.$analytics.trigger('Search', 'ADVANCED_SEARCH', s)
         } else {
            this.$store.commit(
               "system/setError",
               "Please enter a search query"
            );
         }
      },
      clearSearch() {
         if (this.queryEntered) {
            this.$store.commit('query/clear')
            this.$store.commit('resetSearchResults')
            this.$store.commit('filters/reset')
            this.$router.push('/search?mode=advanced')
         }
      },
      addClicked() {
         this.$store.commit("query/addCriteria")
         setTimeout( () => {
            let out = document.querySelectorAll(".field:last-of-type")
            if (out.length > 0) {
               out[out.length-1].focus()
            }
         }, 100)
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
      setTimeout( () => {
         let out = document.querySelectorAll(".field:last-of-type")
         if (out.length > 0) {
            out[out.length-1].focus()
         }
      }, 250)
   }
};
</script>

<style lang="scss" scoped>
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
.sep {
   margin: 0 5px;
}
div.pools-wrapper {
   border-top: 2px solid var(--uvalib-grey-light);
   border-bottom: 2px solid var(--uvalib-grey-light);
   margin: 15px 0 10px 0;
   padding: 10px 0;
}
div.pools {
   text-align: left;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: flex-start;
   margin: 0;
}
.v4-checkbox.pool {
   margin: 5px 10px;
   cursor: pointer;
}
.v4-checkbox.pool >>> label {
   margin:0;
}
div.criteria-control {
   text-align: right;
}
div.criteria {
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
   &:focus {
      @include be-accessible();
   } 
}
div.search-term select {
   height: auto !important;
   &:focus {
      @include be-accessible();
   } 
}
.v4-button.remove {
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
   text-align: right;
}
.controls .v4-button.clear {
   margin-right: 5px;
}
div.search-term {
   border: 1px solid #ccc;
   padding: 10px;
   margin: 10px 0 10px 0;
   border-radius: 3px;
   background-color: #f5f5f5;
   font-size: 0.9em;
}
.date-hint {
   font-size:0.95em;
   font-weight: 100;
   font-style: italic;
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
</style>
