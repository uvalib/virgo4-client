<template>
      <div class="src-targets">
         <label class="screen-reader-text">search mode:</label>
         <label for="search-all">
            <input id="search-all" type="radio" v-model="searchSources" value="all" name="sources">
            <span>Everything</span>
         </label>
         <label for="search-catalog">
            <input id="search-catalog" type="radio" v-model="searchSources" value="uva_library" name="sources">
            <span>Catalog Only</span>
         </label>
         <label for="search-articles">
            <input id="search-articles" type="radio" v-model="searchSources" value="articles" name="sources">
            <span>Articles Only</span>
         </label>
         <label for="search-images">
            <input id="search-images" type="radio" v-model="searchSources" value="images" name="sources">
            <span>Images Only</span>
         </label>
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
   },
   watch: {
      searchSources() {
         localStorage.setItem("v4SearchSources", this.searchSources)
         let query = Object.assign({}, this.$route.query)
         if (query.pool) {
            delete query.page
            delete query.pool
            if ( this.searchSources != "all") {
               query.pool = this.searchSources
            }
            this.userSearched = true
            this.$router.push({ query })
         }
      },
   },
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
}

</style>
