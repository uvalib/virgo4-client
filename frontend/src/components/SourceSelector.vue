<template>
   <fieldset class="src-targets">
      <legend>search for</legend>
      <label for="search-all">
         <input id="search-all" type="radio" v-model="queryStore.searchScope" value="all" name="sources">
         <span>Everything</span>
      </label>
      <label for="search-catalog" >
         <input id="search-catalog" type="radio" v-model="queryStore.searchScope" value="uva_library" name="sources">
         <span>Catalog Only</span>
      </label>
      <label for="search-articles" v-if="preferences.isPoolExcluded('articles') == false">
         <input id="search-articles" type="radio" v-model="queryStore.searchScope" value="articles" name="sources">
         <span>Articles Only</span>
      </label>
      <label for="search-images">
         <input id="search-images" type="radio" v-model="queryStore.searchScope" value="images" name="sources">
         <span>Images Only</span>
      </label>
   </fieldset>
</template>

<script setup>
import { useQueryStore } from "@/stores/query"
import { useRouter, useRoute } from 'vue-router'
import { watch } from 'vue'
import analytics from '@/analytics'
import { useRouteUtils } from '@/composables/routeutils'
import { usePreferencesStore } from "@/stores/preferences"
import { useResultStore } from "@/stores/result"
import { storeToRefs } from "pinia"

const preferences = usePreferencesStore()
const resultsStore = useResultStore()

const queryStore = useQueryStore()
const router = useRouter()
const route = useRoute()
const routeUtils = useRouteUtils(router, route)

const { searchScope } = storeToRefs(queryStore)
watch( searchScope, () => {
   queryStore.targetPool = queryStore.searchScope
   analytics.trigger('Search', 'SCOPE_CHANGED', `${queryStore.mode}|${ queryStore.targetPool }`)

   if ( resultsStore.hasResults ) {
      let tgtPool = queryStore.searchScope
      if ( tgtPool == 'all') tgtPool = 'uva_library'
      let tgtIdx = resultsStore.results.findIndex( r => r.pool.id == tgtPool )
      resultsStore.selectPoolResults(tgtIdx)
      queryStore.targetPool = tgtPool
      routeUtils.poolChanged()
   }
})
</script>

<style lang="scss" scoped>

.src-targets {
   text-align: left;
   margin: 0;
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
   align-items: center;
   border: none;
   legend {
      display: none;
   }
   label {
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      margin: 0;
      padding: 0;
      margin-right: 25px;
      cursor: pointer;
      &:hover {
         text-decoration: underline;
      }
   }
   input {
      cursor: pointer;
      margin: 0 8px 0 0;
      display: inline-block;
      width: 15px;
      height: 15px;
      padding:0;
   }
}

</style>