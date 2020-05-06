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
               <V4Button v-if="canDeleteCriteria" mode="icon" class="remove" @click="removeCriteria(idx)">
                  <i class="fas fa-times-circle"></i>
               </V4Button>
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
      }),
      ...mapMultiRowFields("query", ["advanced"]),
      canDeleteCriteria() {
         return this.advanced.length > 1
      }
   },
   methods: {
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
