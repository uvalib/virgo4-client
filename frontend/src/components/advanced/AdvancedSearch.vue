<template>
   <div class="advanced-panel" :class="{narrow: resultStore.hasResults}">
      <AdvancedFacets />
      <div class="advanced-wrap">
         <FormKit type="form" id="advanced-search" :actions="false" @submit="doAdvancedSearch">
            <div v-for="(term,idx) in advancedTerms" :key="idx" class="search-term">
               <div class="controls-wrapper">
                  <div class="options">
                     <FormKit v-if="idx > 0" type="select" label="" v-model="term.op" :options="['AND', 'OR', 'NOT']" outer-class="$reset op" />
                     <FormKit type="select" label="" v-model="term.field" :options="queryStore.advancedFields" outer-class="$reset full-width"/>
                     <FormKit v-if="getTermType(term) == 'date'" type="select" label="" v-model="term.comparison"
                        :options="['EQUAL', 'AFTER', 'BEFORE', 'BETWEEN']" outer-class="$reset"/>
                  </div>
                  <div class="query">
                     <div class="date-criteria" v-if="getTermType(term) == 'date'">
                        <FormKit label="" type="text" v-model="term.value"  outer-class="$reset full-width"
                           :validation-messages="{matches: 'Invalid date'}" :validation="dateValidator"
                        />
                        <template v-if="term.comparison == 'BETWEEN'" >
                           <span v-if="term.comparison == 'BETWEEN'">and</span>
                           <FormKit label="" type="text" v-model="term.endVal"  outer-class="$reset full-width"
                              :validation-messages="{matches: 'Invalid date'}" :validation="dateValidator"
                           />
                        </template>
                     </div>
                     <FormKit v-else label="" type="text" v-model="term.value"  outer-class="$reset full-width"/>
                     <p class="date-hint" v-if="getTermType(term) == 'date'">
                        Dates must match one of the accepted formats: YYYY, YYYY-MM, or YYYY-MM-DD <br/>
                        where YYYY represents a 4 digit year, MM represents a two digit month (01-12), and DD represents a two digit day (01-31).
                     </p>
                  </div>
               </div>
               <FormKit v-if="canDeleteCriteria" type="button" @click="removeCriteria(idx)" input-class='icon'><i class="remove fas fa-times-circle"></i></FormKit>
            </div>
            <div class="form-acts">
               <FormKit type="button" @click="addClicked">Add criteria</FormKit>
               <FormKit v-if="resultStore.hasResults==false && resultStore.searching == false" type="button" @click="saveSearchForm">Save form</FormKit>
               <SourceSelector v-else :help="false"/>
            </div>
            <PreSearchFilters v-if="resultStore.hasResults==false"/>
            <div class="controls" v-if="resultStore.hasResults==false && resultStore.searching == false">
               <FormKit v-if="resultStore.hasResults==false && resultStore.searching == false" type="select" label="Sort by" v-model="sortStore.preSearchSort"
                  outer-class="$reset sort" inner-class="$reset sort"
                  :options="sortOptions" @change="sortChanged()" />
               <SourceSelector v-if="resultStore.hasResults==false"  :help="false"/>
            </div>
            <V4FormActions :hasCancel="false" submitLabel="Search" submitID="do-advanced-request" />
         </FormKit>
      </div>
   </div>
</template>

<script setup>
import AdvancedFacets from "@/components/advanced/AdvancedFacets.vue"
import SourceSelector from "@/components/SourceSelector.vue"
import PreSearchFilters from "@/components/advanced/PreSearchFilters.vue"
import { useAnnouncer } from '@vue-a11y/announcer'
import analytics from '@/analytics'
import { nextTick, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { usePoolStore } from "@/stores/pool"
import { useSortStore } from "@/stores/sort"
import { useFilterStore } from "@/stores/filter"
import { usePreferencesStore } from "@/stores/preferences"

const router = useRouter()
const route = useRoute()
const queryStore = useQueryStore()
const resultStore = useResultStore()
const systemStore = useSystemStore()
const userStore = useUserStore()
const poolStore = usePoolStore()
const sortStore = useSortStore()
const filters = useFilterStore()
const preferences = usePreferencesStore()
const { assertive } = useAnnouncer()

const dateValidator = [ ['matches', /^\d{4}$|^\d{4}-(0[1-9]|1[012])$|^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/] ]

const canDeleteCriteria = computed(()=>{
   return queryStore.advanced.length > 1
})
const advancedTerms = computed(()=>{
   return queryStore.advanced.filter( t => t.field != "filter")
})
const sortOptions = computed(()=>{
   let out = []
   poolStore.sortOptions("uva_library").forEach( s => {
      out.push( {label: s.name, value: s.id} )
   })
   return out
})

function sortChanged() {
   analytics.trigger('AdvancedSearch', 'SORT_CHANGED', sortStore.preSearchSort)
}

function saveSearchForm() {
   analytics.trigger('AdvancedSearch', 'FORM_SAVE_CLICKED', "")
   preferences.saveAdvancedSearchTemplate(queryStore.advancedSearchTemplate)
   systemStore.setMessage("This search setup has been saved and will be used as the default for future advanced searches.<br/>You can change this at any time by saving a new setup.")
}

function getTermType( term ) {
   let tgtField = queryStore.advancedFields.find( af=> af.value == term.field)
   if (tgtField) {
      return tgtField.type
   }
   return "text"
}

async function doAdvancedSearch() {
   queryStore.fixDateSearches()
   let fields = queryStore.advanced.filter( f=>f.value != "")
   if ( fields.length == 1 && fields[0].op == "NOT") {
      systemStore.setSearchError( {message:"The NOT operator requires more than one search critera"} )
      return
   }

   if ( userStore.isSignedIn ) {
      analytics.trigger('Search', 'ADVANCED_SEARCH', "SIGNED_IN")
   } else {
      analytics.trigger('Search', 'ADVANCED_SEARCH', "SIGNED_OUT")
   }

   let coll = filters.preSearchFilters.find( psf => psf.id == "FilterCollection")
   if (coll) {
      let uvad = coll.buckets.find(b => b.value == "UVA Library Digital Repository")
      if (uvad && uvad.selected) {
         analytics.trigger('Search', 'DIGITAL_COLLECTION_SELECTED')
      }
   }

   let newQ = Object.assign({}, route.query)
   newQ.q = queryStore.string
   if ( resultStore.hasResults == false && filters.preSearchFilterApplied ) {
      filters.promotePreSearchFilters()
      newQ.filter = filters.asQueryParam('presearch')
   }
   sortStore.promotePreSearchSort( poolStore.list )
   queryStore.userSearched = true
   await router.replace({query: newQ})
}

function addClicked() {
   analytics.trigger('AdvancedSearch', 'ADD_CRITERIA', sortStore.preSearchSort)
   queryStore.addCriteria()
   nextTick( () => {
      let out = document.querySelectorAll(".field:last-of-type")
      if (out.length > 0) {
         out[out.length-1].focus()
      }
   })
}

function removeCriteria(idx) {
   let criteria = queryStore.advanced[idx]
   let data = JSON.stringify(criteria)
   analytics.trigger('AdvancedSearch', 'REMOVE_CRITERIA', data)
   queryStore.removeCriteria(idx)
}

onMounted(()=>{
   assertive(`virgo advanced search has loaded`)
})
</script>

<style lang="scss" scoped>
:deep(.full-width) {
   flex-grow: 1;
}
.advanced-panel.narrow {
   margin: 0;
   padding: 0 3vw 0 3vw;
}
.advanced-panel {
   margin: 0 auto 0 auto;
   text-align: center;
   padding: 10px 5px;
   display: flex;
   flex-flow: row wrap;
   justify-content: space-between;
   .advanced-wrap {
      flex: 1 1 70%;
      margin: 0;
      :deep(form) {
         display: flex;
         flex-direction: column;
         gap: 15px;
      }
   }

   .search-term {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: flex-start;
      gap: 10px;
      padding: 15px;
      margin: 0;
      background: var(--uvalib-grey-lightest);
      border: 1px solid var(--uvalib-grey-light);
      width: 100%;
      box-sizing: border-box;
      border-radius: 5px;

      :deep(button.v4-form-input.icon) {
         border: none;
         padding: 0;
         margin: 0;
         background: none;
         .remove {
            font-size: 1.5em;
            color: var(--uvalib-red-emergency);
            margin: 0;
            padding: 0;
            &:hover {
               color: var(--uvalib-red);
            }
         }
      }

      .controls-wrapper {
         flex-grow: 1;
         display: flex;
         flex-direction: column;
         gap: 10px;
      }
   }
   .controls {
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-items: center;
   }
}

.form-acts {
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
}

div.options {
   display: flex;
   flex-flow: row wrap;
   align-items: flex-start;
   justify-content: flex-start;
   gap: 10px;
}

div.query {
   .date-criteria {
      display: flex;
      flex: 1 1 auto;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: 10px;
      margin-right: 0;
      flex-grow: 1;
   }
    .date-hint {
      text-align: left;
   }
}
</style>
