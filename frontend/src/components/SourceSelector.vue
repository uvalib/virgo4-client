<template>
      <div class="src-targets">
         <label class="screen-reader-text">search mode:</label>
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
         <SearchTips v-if="props.help"/>
      </div>
</template>

<script setup>
import SearchTips from "@/components/disclosures/SearchTips.vue"
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
   help: {
      type: Boolean,
      default: true
   },
})

const results = useResultStore()
const queryStore = useQueryStore()
const router = useRouter()
const route = useRoute()

function sourcesClicked( setting ) {
   if ( queryStore.searchSources  != setting ) {
      queryStore.searchSources = setting
      if (queryStore.queryEntered || route.query.filter ) {
         let query = Object.assign({}, route.query)
         delete query.page
         if (queryStore.searchSources == query.pool && queryStore.searchSources != "all") {
            results.dropOtherResults(queryStore.searchSources)
         } else {
            query.q = queryStore.string
            query.pool = setting
            queryStore.userSearched = true
            router.push({ query })
         }
      }
   }
}
</script>

<style lang="scss" scoped>

.src-targets {
   text-align: left;
   margin: 15px 0;
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
   align-items: center;
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
