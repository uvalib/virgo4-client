<template>
   <div class="mode-wrapper">
      <label>
         Filter join mode:
         <span class="mode" v-if="resultStore.selectedResults.pool.id == 'articles'">OR</span>
         <select v-else v-model="preferences.facetMode" @change="modeChanged" >
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
import analytics from '@/analytics'

const user = useUserStore()
const filters = useFilterStore()
const resultStore = useResultStore()
const preferences = usePreferencesStore()

const modeChanged = (async () => {
   if ( user.isSignedIn ) {
      preferences.updateFacetJoinMode()
   }
   analytics.trigger('Filters', 'FILTER_JOIN_CHANGED', preferences.facetMode)
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
   .mode {
      display: inline-block;
      margin-left: 5px;
      font-weight: bold;
   }
   select {
      margin-left: 3px;
      padding:5px;
   }
}
</style>