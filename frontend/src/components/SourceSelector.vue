<template>
      <div class="src-targets">
         <label class="screen-reader-text">search mode:</label>
         <label for="search-all">
            <input @click="sourcesClicked('all')" id="search-all" type="radio"
               v-model="queryStore.searchSources" value="all" name="sources"
            >
            <span>Everything</span>
         </label>
         <label for="search-catalog" name="sources" :class="{curr_scope: queryStore.searchSources=='uva_library'}" >
            <input  @click="sourcesClicked('uva_library')" id="search-catalog" type="radio"
               v-model="queryStore.searchSources" value="uva_library"
            >
            <span>Catalog Only</span>
         </label>
         <label for="search-articles">
            <input @click="sourcesClicked('articles')" id="search-articles" type="radio"
               v-model="queryStore.searchSources" value="articles" name="sources"
            >
            <span>Articles Only</span>
         </label>
         <label for="search-images">
            <input @click="sourcesClicked('images')" id="search-images" type="radio"
               v-model="queryStore.searchSources" value="images" name="sources"
            >
            <span>Images Only</span>
         </label>
         <SearchTips />
      </div>
</template>

<script setup>
import SearchTips from "@/components/disclosures/SearchTips.vue"
import { useQueryStore } from "@/stores/query"
import { useRouter, useRoute } from 'vue-router'

const queryStore = useQueryStore()
const router = useRouter()
const route = useRoute()

function sourcesClicked( setting ) {
   if ( queryStore.searchSources  != setting ) {
      queryStore.searchSources = setting
      if (queryStore.queryEntered || route.query.filter ) {
         let query = Object.assign({}, this.$route.query)
         delete query.page
         query.q = queryStore.string
         query.pool = setting
         queryStore.userSearched = true
         router.push({ query })
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
   label {
      display: flex;
      flex-flow: row nowrap;
      align-content: center;
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
      margin-right: 8px;
      display: inline-block;
      width: 15px;
      height: 15px;
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
