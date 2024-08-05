<template>
   <div class="pool-options">
      <h2>Search Preferences</h2>
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
         </div>
      </div>
      <div class="grouping pad-bottom">
         <p>
            By default, lengthy item details are truncated and can be viewed in full by clicking a more button or link.
            Check the box below to show full details.
         </p>
         <div class="check">
            <label>
               <input id="full-detail-pref" @change="fullDetailClicked" class="choice" :checked="preferencesStore.expandDetails" type="checkbox"
                  aria-label="toggle display of full item details"/>Expand Item Details
            </label>
         </div>
      </div>
   </div>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences"
const preferencesStore = usePreferencesStore()

const collapseGroupsClicked = (() => {
   preferencesStore.toggleCollapseGroups()
})

const fullDetailClicked = (() => {
   preferencesStore.toggleExpandDetails()
})

</script>

<style lang="scss" scoped>
h2 {
   margin: 0;
   padding: 10px 15px;
   background: var(--uvalib-grey-lightest);
   border-bottom: 1px solid var(--uvalib-grey-light);
   font-size: 1.2em;
}
.grouping {
   padding: 5px 20px 5px 20px;
   .choice {
      margin: 5px 10px;
      width: 15px;
      height: 15px;
   }
}
.pad-bottom {
   margin-bottom: 25px;
}
div.check {
   display: flex;
   flex-flow: row nowrap;
   justify-content: flex-start;
   align-items: center;
   label, input {
      cursor: pointer;
   }
}
</style>