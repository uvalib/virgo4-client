<template>
   <div class="advanced-panel" :class="{narrow: hasResults}">
      <div class="advanced-controls">
         <AdvancedFacets />
         <div class="advanced-wrap">
            <div class="criteria">
               <div v-for="(term,idx) in advancedTerms" :key="idx" class="search-term">
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
                           <p class="date-hint">Dates must match one of the accepted formats: YYYY, YYYY-MM, or YYYY-MM-DD <br/>
                               where YYYY represents a 4 digit year, MM represents a two digit month (01-12), and DD represents a two digit day (01-31).
                               </p>
                        </div>
                     </template>
                     <template v-else>
                        <input @keyup.enter="doAdvancedSearch" v-model="term.value" type="text" class="term"
                           :aria-label="`query string for search criteria number ${idx+1}`"/>
                     </template>
                  </div>
               </div>
            </div>
            <div class="controls-wrapper">
               <SourceSelector mode="advanced"/>
               <div class="form-acts">
                  <V4Button mode="icon" id="add-criteria" @click="addClicked">
                     <i class="fas fa-plus-circle"></i>
                     <span class="btn-label">Add criteria</span>
                  </V4Button>
                  <Confirm  v-if="isSignedIn" title="Save Search Form" v-on:confirmed="saveSearchForm"
                     id="savesearch" buttonLabel="Save Form" buttonMode="tertiary"
                  >
                     <div>
                        Save the current advanced search form to your account?<br/>
                        Once saved, it will be used as the default setup for future advanced searches.<br/>
                        This can be changed at any time.
                     </div>
                  </Confirm>

               </div>
               <PreSearchFilters v-if="hasResults==false"/>
               <div class="controls">
                  <V4Button mode="primary" @click="doAdvancedSearch">Search</V4Button>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapMultiRowFields, mapFields } from "vuex-map-fields"
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import AdvancedFacets from "@/components/advanced/AdvancedFacets"
import SourceSelector from "@/components/SourceSelector"
import PreSearchFilters from "@/components/advanced/PreSearchFilters"

export default {
   components: {
      AdvancedFacets, SourceSelector, PreSearchFilters
   },
   computed: {
      ...mapState({
         advancedFields: state => state.query.advancedFields,
         pools: state => state.pools.list,
         searchTemplate: state=>state.preferences.searchTemplate,
         signedInUser: state => state.user.signedInUser
      }),
      ...mapGetters({
         advancedSearchTemplate: 'query/advancedSearchTemplate',
         queryURLParams: 'query/queryURLParams',
         queryEntered: "query/queryEntered",
         isSignedIn: 'user/isSignedIn',
         hasSearchTemplate: 'preferences/hasSearchTemplate',
         hasResults: 'hasResults',
         preSearchFilterApplied: 'filters/preSearchFilterApplied',
         filterQueryString: 'filters/asQueryParam',
         preSearchFilters: 'filters/preSearchFilters',
         rawQueryString: 'query/string'
      }),
      ...mapFields({
        userSearched: 'query.userSearched',
      }),
      ...mapMultiRowFields("query", ["advanced"]),
      canDeleteCriteria() {
         return this.advanced.length > 1
      },
      advancedTerms() {
         return this.advanced.filter( t => t.field != "filter")
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

      async doAdvancedSearch() {
         this.$store.commit("query/fixDateSearches")
         let fields = this.advanced.filter( f=>f.value != "")
         if ( fields.length == 1 && fields[0].op == "NOT") {
            this.$store.commit(
               "system/setSearchError",
               {message:"The NOT operator requires more than one search critera"}
            )
            return
         }

         let badDate = false
         this.advanced.filter( f=>f.field == "date" && f.value != "").some( df => {
            let dateStr = df.value
            let parts = dateStr.split("-")
            if (parts.length > 3) {
               badDate = true
            } else {
               parts.forEach( (p,idx) => {
                  switch (idx) {
                  case 0:
                     if ( p.match(/^\d{4}$/) == null ) {
                        badDate = true
                     }
                     break
                  case 1:
                     // Month
                     if ( p.match(/^(0[1-9]|(1[0-2]))$/) == null ) {
                           badDate = true
                     }
                     break
                  case 2:
                     // Day
                    if ( p.match(/^(0[1-9])|([12])([0-9])|(3[01])$/) == null ) {
                           badDate = true
                     }
                     break
                  default:
                     badDate = true
                     break
                  }
               })
            }
            return badDate == true
         })
         if ( badDate ) {
            this.$store.commit(
               "system/setSearchError",
               {message:"Dates must match one of the accepted formats: YYYY, YYYY-MM, or YYYY-MM-DD <br/> \
               where YYYY represents a 4 digit year, <br/> \
               MM represents a two digit month (01-12), and<br/> \
               DD represents a two digit day (01-31)."}
            )
            return
         }

         if ( this.isSignedIn ) {
            this.$analytics.trigger('Search', 'ADVANCED_SEARCH', "SIGNED_IN")
         } else {
            this.$analytics.trigger('Search', 'ADVANCED_SEARCH', "SIGNED_OUT")
         }

         let coll = this.preSearchFilters.find( psf => psf.id == "FilterCollection")
         if (coll) {
            let uvad = coll.buckets.find(b => b.value == "UVA Library Digital Repository")
            if (uvad && uvad.selected) {
               this.$analytics.trigger('Search', 'DIGITAL_COLLECTION_SELECTED')
            }
         }

         let newQ = Object.assign({}, this.$route.query)
         newQ.q = this.rawQueryString
         if ( this.hasResults == false && this.preSearchFilterApplied ) {
            this.$store.dispatch("filters/promotePreSearchFilters")
            newQ.filter = this.filterQueryString('presearch')
         }
         this.userSearched = true
         await this.$router.replace({query: newQ})
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
   },
   created() {
      if ( this.hasSearchTemplate ) {
         this.$store.commit("query/setTemplate", this.searchTemplate)
      }
   },
   mounted() {
      this.$announcer.set(`virgo advanced search has loaded`, 'assertive')
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
.advanced-panel {
   margin: 0 auto 0 auto;
   text-align: center;
   padding: 10px 5px;
   font-size: .95em;
}
.advanced-panel.narrow {
   max-width: 800px;
}
.advanced-controls {
   display: flex;
   flex-flow: row wrap;
   justify-content: space-between;
   .advanced-wrap {
      flex: 1 1 70%;
      margin: 0;
   }
}
.sep {
   margin: 0 5px;
}

.form-acts {
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
   padding-bottom: 20px;
   margin-bottom: 15px;
   border-bottom: 1px solid var(--uvalib-grey-light);
   #add-criteria {
      color: var(--uvalib-blue-alt);
      font-size: 1.6em;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      align-self: center;
      .btn-label {
         margin-left: 5px;
         font-size: 0.7em;
         color: var(--uvalib-text);
      }
   }
}

:deep(.form-acts button.v4-button.pure-button) {
   margin: 0 !important;
}

div.criteria {
   text-align: left;
   position: relative;
}

div.options {
   display: flex;
   flex-flow: row wrap;
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
      margin-top: 10px;
      display: block;
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
   margin: 0 0 10px 0;
   background: var(--uvalib-grey-lightest);
   outline: 1px solid var(--uvalib-grey-light);
   width: 100%;
   box-sizing: border-box;
   .v4-button.remove {
      font-size: 1.6em;
      color: var(--uvalib-red-emergency);
      margin-left: auto;
   }
}

div.search-term .date-criteria > * {
   margin: 5px 5px 0 0;
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
