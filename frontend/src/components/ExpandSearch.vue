<template>
   <div v-if="searchSources != 'all'" class="expand-search">
      <div>You are currently searching {{scopeLabel}}. There may be more results if you search everything.</div>
      <div><V4Button mode="text" aria-label="broaden search" @click="widenSearch">Click to broaden your search to Everything.</V4Button></div>
   </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'
export default {
   computed: {
      ...mapFields({
        searchSources: 'query.searchSources',
        userSearched: 'query.userSearched',
      }),
      scopeLabel() {
         if ( this.searchSources == 'articles') return "Articles only"
         if ( this.searchSources == 'images') return "Images only"
         if ( this.searchSources == 'uva_library') return "Catalog only"
         return "Everything"
      }
   },
   methods: {
      widenSearch() {
         this.searchSources = "all"
         let query = Object.assign({}, this.$route.query)
         if (query.q) {
            delete query.page
            delete query.pool
            this.userSearched = true
            this.$router.push({ query })
         }
      },
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
