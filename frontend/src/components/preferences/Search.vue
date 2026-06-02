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
               <input id="collapse-pref" @change="collapseGroupsClicked" class="choice" :checked="preferencesStore.collapseGroups" type="checkbox"
                  aria-label="toggle barcode group collapse functionality"/>Collapse Grouped Results
            </label>
            <Message variant="simple" severity="success" v-if="saved=='groups'" :life="2000" >Saved</Message>
         </div>
      </div>
      <div class="grouping">
         <p>
            By default, lengthy item details are truncated and can be viewed in full by clicking a more button or link.
            Check the box below to show full details.
         </p>
         <div class="check">
            <label>
               <input id="full-detail-pref" @change="fullDetailClicked" class="choice" :checked="preferencesStore.expandDetails" type="checkbox"
                  aria-label="toggle display of full item details"/>Expand Item Details
            </label>
            <Message variant="simple" severity="success" v-if="saved=='expand'" :life="2000" >Saved</Message>
         </div>
      </div>
       <div class="grouping">
         <h4>Exclude from search</h4>
         <div v-for="p in pools.canExcludeList" class="check">
            <label>
               <input id="full-detail-pref" @change="toggleSearchExclude(p.id)" class="choice" :checked="preferencesStore.isPoolExcluded(p.id)" type="checkbox"
                  aria-label="toggle display of full item details"/>{{ p.name }}
            </label>
         </div>
         <Message  v-if="saved =='exclude'" :life="2000" variant="simple" severity="success">Saved</Message>
       </div>
   </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePreferencesStore } from "@/stores/preferences"
import { usePoolStore } from "@/stores/pool"
import { useQueryStore } from "@/stores/query"
import Message from 'primevue/message'

const preferencesStore = usePreferencesStore()
const pools = usePoolStore()
const queryStore = useQueryStore()
const saved = ref("")

const collapseGroupsClicked = (() => {
   preferencesStore.toggleCollapseGroups()
   saved.value = "groups"
   setTimeout( ()=>{ saved.value = "" }, 2100)
})

const toggleSearchExclude = (( poolID) => {
   preferencesStore.toggleSearchExclusion(poolID)
   saved.value = "exclude"
   setTimeout( ()=>{ saved.value = "" }, 2100)
   queryStore.searchSources  = "all"
})

const fullDetailClicked = (() => {
   preferencesStore.toggleExpandDetails()
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