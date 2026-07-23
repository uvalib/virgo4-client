<template>
   <div class="pool-options">
      <h3>Search Preferences</h3>
      <div class="grouping">
         <p>
            Related search results are grouped under a single search result. By default, these grouped results are
            all visible. Check the box below to collapse them by default.
         </p>
         <div class="check">
            <label>
               <input id="collapse-pref" @change="collapseGroupsClicked" class="choice" :checked="preferences.collapseGroups" type="checkbox"
                  aria-label="toggle barcode group collapse functionality"/>Collapse Grouped Results
            </label>
            <Message variant="simple" severity="success" v-if="saved=='groups'" :life="2000" >Saved</Message>
         </div>
      </div>
      <div class="grouping">
         <p>
            By default, lengthy item details are shown in full. Check the box below to collapse details into a smaller subset of data. 
            In this case, full details can be viewed by clicking the 'Show more details' button.
         </p>
         <div class="check">
            <label>
               <input id="full-detail-pref" @change="detailToggleClicke" class="choice" :checked="preferences.collapseDetails" type="checkbox"
                  aria-label="toggle display of full item details"/>Collapse Item Details
            </label>
            <Message variant="simple" severity="success" v-if="saved=='expand'" :life="2000" >Saved</Message>
         </div>
      </div>
       <div class="grouping">
         <h4>Exclude from search</h4>
         <div v-for="p in pools.canExcludeList" class="check">
            <label>
               <input id="full-detail-pref" @change="toggleSearchExclude(p.id)" class="choice" :checked="preferences.isPoolExcluded(p.id)" type="checkbox"
                  aria-label="toggle display of full item details"/>{{ p.name }}
            </label>
         </div>
         <Message  v-if="saved =='exclude'" :life="2000" variant="simple" severity="success">Saved</Message>
       </div>
       <div class="grouping">
         <h4>Catalog Filters</h4>
         <p>
            The catalog allows results to be filtered by numerious categories, some of which may not be useful for you. 
            Use the list below to disable unwanted filters.
         </p>
         <div><b>Disabled Filters</b></div>
         <div v-for="pf in pools.filters('uva_library')" class="check">
            <label>
               <input @change="toggleFilter(pf.id)" class="choice" :checked="preferences.isFilterExcluded(pf.id)" type="checkbox"
                  :aria-label="`toggle availablity of filter ${pf.name }`"/>
               {{ pf.name }}
            </label>
         </div>
       </div>
       <Message  v-if="saved =='filter'" :life="2000" variant="simple" severity="success">Saved</Message>
   </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePreferencesStore } from "@/stores/preferences"
import { usePoolStore } from "@/stores/pool"
import { useQueryStore } from "@/stores/query"
import Message from 'primevue/message'
import analytics from '@/analytics'

const preferences = usePreferencesStore()
const pools = usePoolStore()
const queryStore = useQueryStore()
const saved = ref("")

const collapseGroupsClicked = ( async () => {
   await preferences.toggleCollapseGroups()
   saved.value = "groups"
   setTimeout( ()=>{ saved.value = "" }, 2100)
})

const toggleSearchExclude = ( async (poolID) => {
   await preferences.toggleSearchExclusion(poolID)
   saved.value = "exclude"
   setTimeout( ()=>{ saved.value = "" }, 2100)
   queryStore.searchSources  = "all"
   if (preferences.isPoolExcluded(poolID)) {
      analytics.trigger('Preferences', 'ADD_POOL_EXCLUSION', poolID)
   } else {
      analytics.trigger('Preferences', 'REMOVE_POOL_EXCLUSION', poolID)   
   }
})

const toggleFilter = ( async (filterID) => {
   await preferences.toggleFilterExclusion(filterID)
   saved.value = "filter"
   setTimeout( ()=>{ saved.value = "" }, 2100)
})

const detailToggleClicke = ( async () => {
   await preferences.toggleCollapseDetails()
   saved.value = "expand"
   setTimeout( ()=>{ saved.value = "" }, 2100)
})

</script>

<style lang="scss" scoped>
.pool-options {
   padding: 0 0 10px 0;
   h3 {
      margin: 0;
      padding: 10px 15px;
      background: $uva-grey-200;
      border-bottom: 1px solid $uva-grey-100;
      font-size: 1.2em;
   }
   h4 {
      margin: 20px 0 15px 0;
   }
   .grouping {
      padding: 5px 20px 5px 20px;
      .choice {
         margin: 5px 10px;
         width: 15px;
         height: 15px;
      }
   }
   div.check {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: 10px;
      label, input {
         cursor: pointer;
      }
   }
}
</style>