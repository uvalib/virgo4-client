<template>
   <div v-if="queryStore.searchSources != 'all'" class="expand-search">
      <div>You are currently searching {{scopeLabel}}. There may be more results if you search everything.</div>
      <div><VirgoButton text @click="widenSearch">Click to broaden your search to Everything.</VirgoButton></div>
   </div>
</template>

<script setup>
import { computed } from 'vue'
import { useQueryStore } from "@/stores/query"
import { useRouter, useRoute } from 'vue-router'
import { routeutils } from '@/routeutils'

const queryStore = useQueryStore()
const router = useRouter()
const route = useRoute()

const scopeLabel = computed(()=>{
   if ( queryStore.searchSources == 'articles') return "Articles only"
   if ( queryStore.searchSources == 'images') return "Images only"
   if ( queryStore.searchSources == 'uva_library') return "Catalog only"
   return "Everything"
})

function widenSearch() {
   queryStore.widenSearch()
   routeutils.scopeChanged(router, route.query)
}
</script>
<style lang="scss" scoped>
   div.expand-search {
      padding: 15px;
      background: white;
      button {
         margin-top: 5px;
      }
   }
</style>
