<template>
   <div class="mode-wrapper">
      <label>
         Filter join mode:
         <select v-model="preferences.facetMode" @change="modeChanged">
            <option value="AND">AND</option>
            <option value="OR">OR</option>
         </select>
      </label>
   </div>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useUserStore } from "@/stores/user"

const user = useUserStore()
const filters = useFilterStore()
const resultStore = useResultStore()
const preferences = usePreferencesStore()

const modeChanged = (async () => {
   console.log(preferences.facetMode)
   if ( user.isSignedIn ) {
      preferences.updateFacetJoinMode()
   }
   if (resultStore.hasResults) {
      filters.setDirty()
      await resultStore.searchAllPools()
      filters.getSelectedResultFacets(true)
   }
})
</script>

<style lang="scss" scoped>
.mode-wrapper {
   font-size: 0.9em;
   display: flex;
   flex-flow: row nowrap;
   select {
      margin-left: 3px;
      padding:5px;
   }
}
</style>