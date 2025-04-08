<template>
      <fieldset class="src-targets">
         <legend>search for</legend>
         <label for="search-all">
            <input @click="sourcesClicked('all')" id="search-all" type="radio"
               v-model="queryStore.searchSources" value="all" name="sources"
            >
            <span>Everything</span>
         </label>
         <label for="search-catalog" :class="{curr_scope: queryStore.searchSources=='uva_library'}" >
            <input  @click="sourcesClicked('uva_library')" id="search-catalog" type="radio"
               v-model="queryStore.searchSources" value="uva_library"  name="sources"
            >
            <span>Catalog Only</span>
         </label>
         <label for="search-articles">
            <input @click="sourcesClicked('articles')" id="search-articles" type="radio"
               v-model="queryStore.searchSources" value="articles" name="sources"
            >
            <span>Articles Only</span>
         </label>
         <label for="search-images" :class="{'no-pad': props.help==false}">
            <input @click="sourcesClicked('images')" id="search-images" type="radio"
               v-model="queryStore.searchSources" value="images" name="sources"
            >
            <span>Images Only</span>
         </label>
      </fieldset>
</template>

<script setup>
import { useQueryStore } from "@/stores/query"
import { useRouter, useRoute } from 'vue-router'
import analytics from '@/analytics'
import { useRouteUtils } from '@/composables/routeutils'

const props = defineProps({
   help: {
      type: Boolean,
      default: true
   },
})

const queryStore = useQueryStore()
const router = useRouter()
const route = useRoute()
const routeUtils = useRouteUtils(router, route)

const sourcesClicked = (( setting ) => {
   if ( queryStore.searchSources  != setting ) {
      analytics.trigger('Search', 'SCOPE_CHANGED', `${queryStore.mode}|${setting}`)
      queryStore.searchSources = setting
      if (queryStore.queryEntered || route.query.filter ) {
         routeUtils.scopeChanged()
      }
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
   label.no-pad {
      margin-right: 0;
   }
   input {
      cursor: pointer;
      margin: 0 8px 0 0;
      display: inline-block;
      width: 15px;
      height: 15px;
      padding:0;
   }
   label.curr_scope {
      cursor: default;
      &:hover {
         text-decoration: none;
      }
      input {
         cursor: default;
      }
   }
}

</style>
