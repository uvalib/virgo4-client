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
                     <div class="date-hint">Accepted formats: YYYY, YYYY-MM, YYYY-MM-DD</div>
                  </div>
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
            <V4Button mode="icon" id="add-criteria" @click="addClicked">
                <i class="fas fa-plus-circle"></i>
                <span class="btn-label">Add criteria</span>
            </V4Button>
         </div>
      </div>
      <div class="pools-wrapper">
         <h2>
            <span>{{sourceLabel}}s</span>
            <span>
               <V4Button mode="text" class="clear" @click="clearPoolsClicked">clear all</V4Button>
               <span class="sep">|</span>
               <V4Button mode="text" class="clear" @click="allPoolsClicked">select all</V4Button>
            </span>
         </h2>
         <div class="pools">
            <V4Checkbox v-for="src in filteredSources" :key="src.id" class="pool"
               :aria-label="`toggle inclusion of ${src.name} in search results`"
               :checked="!isPoolExcluded(src)"
               @click="poolClicked(src)">
               {{src.name}}
            </V4Checkbox>
         </div>
         <div class="what" v-if="!isKiosk">
            <a href="http://library.virginia.edu/virgo4/resource-types" target="_blank">
               What am I searching?
            </a>
            <span v-if="isSignedIn" style="text-align: left; padding-left: 10px;">
               You can manage this list in <router-link to="/preferences">your preferences</router-link>.
            </span>
         </div>
      </div>
      <div class="templates" v-if="isSignedIn">
         <Confirm title="Save Search Form" v-on:confirmed="saveSearchForm"
            id="savesearch" buttonLabel="Save Form" buttonMode="tertiary">
            <div>
               Save the current advanced search form to your account?<br/>
               Once saved, it will be used as the default setup for future advanced searches.<br/>
               This can be changed at any time.
            </div>
         </Confirm>
      </div>
      <div class="controls">
         <V4Button mode="text" class="clear" @click="clearSearchClicked">reset search</V4Button>
         <span class="sep">|</span>
         <V4Button mode="primary" @click="doAdvancedSearch">Search</V4Button>
      </div>
      <div class="basic">
         <router-link to="/search?mode=basic">
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
import { mapMultiRowFields, mapFields } from "vuex-map-fields"
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import V4BarcodeScanner from "@/components/V4BarcodeScanner"

export default {
   components: {
      V4BarcodeScanner
   },
   computed: {
      filteredSources() {
         return this.sources.filter( s => !this.excludedPoolPrefs.includes(s.id) )
      },
      ...mapState({
         advancedFields: state => state.query.advancedFields,
         excludedPools: state => state.query.excludedPools,
         pools: state => state.pools.list,
         searchTemplate: state=>state.preferences.searchTemplate,
         sourceLabel: state => state.preferences.sourceLabel,
         signedInUser: state => state.user.signedInUser
      }),
      ...mapGetters({
         advancedSearchTemplate: 'query/advancedSearchTemplate',
         queryURLParams: 'query/queryURLParams',
         queryEntered: "query/queryEntered",
         sources: "pools/sortedList",
         excludedPoolPrefs: "preferences/excludedPools",
         isPoolExcluded: "query/isPoolExcluded",
         rawQueryString: 'query/string',
         isSignedIn: 'user/isSignedIn',
         isKiosk: 'system/isKiosk',
         hasSearchTemplate: 'preferences/hasSearchTemplate'
      }),
      ...mapFields({
        userSearched: 'query.userSearched',
      }),
      ...mapMultiRowFields("query", ["advanced"]),
      canDeleteCriteria() {
         return this.advanced.length > 1
      }
   },
   methods: {
      saveSearchForm() {
         this.$store.dispatch("preferences/saveAdvancedSearchTemplate", this.advancedSearchTemplate)
      },
      getTermType( term ) {
         let tgtField = this.advancedFields.find( af=> af.value == term.field)
         if (tgtField) {
            return tgtField.type
         }
         return "text"
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
         this.$store.commit("query/excludeAll", this.sources)
      },
      allPoolsClicked() {
         this.$store.commit("query/clearExcluded")
      },
      poolClicked(pool) {
        this.$store.commit("query/toggleAdvancedPoolExclusion", pool)
      },
      doAdvancedSearch() {
         if ( this.excludedPools.length == this.pools.length) {
            this.$store.commit(
               "system/setSearchError",
               {message:`Please select at least one ${this.sourceLabel} before searching`}
            )
            return
         }
         if (this.queryEntered) {

            let fields = this.advanced.filter( f=>f.value != "")
            if ( fields.length == 1 && fields[0].op == "NOT") {
               this.$store.commit(
                  "system/setSearchError",
                  {message:"The NOT operator requires more than one search critera"}
               )
               return
            }

            let bad = this.advanced.filter( f=>f.comparison == "BETWEEN" && (f.value == "" || f.endVal == ""))
            if (bad.length > 0) {
               this.$store.commit(
                  "system/setSearchError",
                  {message:"The BETWEEN operator requires both a start and end date."}
               )
               return
            }

            // Refine search updates:
            // if pool, filter or sort were specified previously, preserve them in the URL.
            // a new search will always reset paging, so don't preserve that
            let priorQ = Object.assign({}, this.$route.query)
            let qp =  this.queryURLParams
            if (priorQ.pool) {
               qp += `&pool=${priorQ.pool}`
            }
            if (priorQ.filter) {
               qp += `&filter=${priorQ.filter}`
            }
            if (priorQ.sort) {
               qp += `&sort=${priorQ.sort}`
            }

            this.userSearched = true
            this.$router.push(`/search?${qp}`)

            let s = "SIGNED_OUT"
            if ( this.isSignedIn ) {
               s = "SIGNED_IN"
            }
            if ( decodeURI(qp).includes("UVA Library Digital Repository") ) {
               this.$analytics.trigger('Search', 'DIGITAL_COLLECTION_SELECTED')
            }
            this.$analytics.trigger('Search', 'ADVANCED_SEARCH', s)
         } else {
            this.$store.commit(
               "system/setSearchError",
               {message:"Please enter a search query"}
            )
         }
      },
      clearSearchClicked() {
         if (this.$router.currentRoute.fullPath != "/search?mode=advanced") {
            this.$store.dispatch('resetSearch')
            this.$router.push('/search?mode=advanced')
         } else {
            this.$store.commit('query/resetAdvanced')
            this.$store.commit("query/setExcludePreferences", this.excludedPoolPrefs)
            if ( this.hasSearchTemplate ) {
               this.$store.commit("query/restoreTemplate", this.searchTemplate)
            }
            this.focusFirstTerm(true)
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
         this.$store.dispatch('resetSearch')
         this.$store.commit("query/advancedBarcodeSearch", barcode)
         this.$store.dispatch("searchAllPools")
      },
      focusFirstTerm(scroll) {
         setTimeout( () => {
            let terms = document.getElementsByClassName("term")
            if (terms.length > 0) {
               terms[0].focus()
               if (scroll) {
                  this.$utils.scrollToItem(terms[0])
                  terms = document.getElementsByClassName("search-term")
                  if (terms.length > 0) {
                     this.$utils.scrollToItem(terms[0])
                  }
               }
            }
         }, 250)
      }
   },
   created() {
      this.focusFirstTerm(false)
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
   margin: 15px 0 10px 0;
   padding: 10px 0;
   border-bottom: 1px solid var(--uvalib-grey-light);
}
div.pools {
   text-align: left;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: flex-start;
   margin: 0;
}
.what {
   margin-top: 10px;
   text-align: left;
}
.v4-checkbox.pool {
   margin: 5px 10px;
   cursor: pointer;
}
.v4-checkbox.pool >>> label {
   margin:0;
}

div.criteria-control {
   display: flex;
   flex-flow: row;
   justify-content: center;
   border-bottom: 1px solid var(--uvalib-grey-light);
   padding-bottom: 10px;
   #add-criteria {
      color: var(--uvalib-blue-alt);
      font-size: 1.6em;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      .btn-label {
         margin-left: 5px;
         font-size: 0.7em;
         color: var(--uvalib-text);
      }
   }
}

div.criteria {
   text-align: left;
   position: relative;
}

div.options {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
}

.options select {
   margin: 0 5px 0 0;
   flex-basis: content;
}
div.search-term {
   select {
      height: auto !important;
   }
   input {
      margin-top: 5px;
      margin-bottom: 0 !important;
   }
}

div.query {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   align-content: center;

   .term {
      box-sizing: border-box;
   }

   input[type="text"], .select-criteria {
      flex: 1 1 auto;
   }

   .term {
      margin-bottom: 0;
   }

   select {
      width: 100%;
   }

   .date-criteria {
      display: flex;
      flex: 1 1 auto;
      flex-flow: row wrap;
      align-items: center;
      margin-right: 0;
   }
   .date-hint {
      font-size:0.95em;
      font-weight: 100;
      font-style: italic;
      width: 100%;
      box-sizing: border-box;
   }
   .date-sep {
      font-weight: 500;
   }
}
.controls {
   padding: 10px 0;
   text-align: right;
}
.controls .v4-button.clear {
   margin-right: 5px;
}
div.search-term {
   padding: 10px;
   margin: 10px 0;
   background: var(--uvalib-grey-lightest);
   outline: 1px solid var(--uvalib-grey-light);
   .v4-button.remove {
      font-size: 1.6em;
      color: var(--uvalib-red-emergency);
      margin-left: auto;
   }
}

div.search-term .date-criteria > * {
   margin: 0 5px 0 0;
}
div.search-term .date-criteria input:last-child {
   margin-right: 0;
}

div.basic {
   margin-top: 10px;
   font-size: 1em;
   text-align: right;
}
.templates {
   display: flex;
   flex-flow: row nowrap;
   justify-content: center;
   align-content: stretch;
   font-size: 0.9em;
   padding-bottom: 5px;
   border-bottom: 1px solid var(--uvalib-grey-light);

   .save-template {
      color: var(--uvalib-grey-dark);
      display: flex;
      flex-flow: row nowrap;
      align-items: flex-start;
      justify-content: flex-end;
      width: 100%;
      .name-wrap {
         flex: 1 1 auto;
         margin-right: 5px;
         input, p {
            width: 100%;
         }
         p.error {
            text-align: left;
            margin: 0;
         }
      }
      button.v4-button {
         margin-left: 5px !important;
      }
      label {
         font-weight: bold;
         margin-right: 10px;
      }
   }
}
</style>
