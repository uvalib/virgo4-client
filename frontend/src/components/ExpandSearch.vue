<template>
   <div v-if="query.searchSources != 'all'" class="expand-search">
      <div>You are currently searching {{scopeLabel}}. There may be more results if you search everything.</div>
      <div><V4Button mode="text" aria-label="broaden search" @click="widenSearch">Click to broaden your search to Everything.</V4Button></div>
   </div>
</template>

<script setup>
import { computed } from 'vue'
import { useQueryStore } from "@/stores/query"
import { useRouter, useRoute } from 'vue-router'

const query = useQueryStore()
const router = useRouter()
const route = useRoute()

const scopeLabel = computed(()=>{
   if ( query.searchSources == 'articles') return "Articles only"
   if ( query.searchSources == 'images') return "Images only"
   if ( query.searchSources == 'uva_library') return "Catalog only"
   return "Everything"
})

function widenSearch() {
   query.searchSources = "all"
   let qp = Object.assign({}, route.query)
   if (qp.q) {
      delete qp.page
      delete qp.pool
      query.userSearched = true
      router.push({ qp })
   }
}
</script>
<style lang="scss" scoped>
   div.expand-search {
      padding: 15px;
      background: white;
      .v4-button {
         margin-top: 5px;
      }
   }
</style>
