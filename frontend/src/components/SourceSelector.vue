<template>
      <div class="src-targets">
         <label class="screen-reader-text">search mode:</label>
         <label for="search-all">
            <input @click="sourcesClicked('all')" id="search-all" type="radio"
               v-model="searchSources" value="all" name="sources"
            >
            <span>Everything</span>
         </label>
         <label for="search-catalog" name="sources" :class="{curr_scope: searchSources=='uva_library'}" >
            <input  @click="sourcesClicked('uva_library')" id="search-catalog" type="radio"
               v-model="searchSources" value="uva_library"
            >
            <span>Catalog Only</span>
         </label>
         <label for="search-articles">
            <input @click="sourcesClicked('articles')" id="search-articles" type="radio"
               v-model="searchSources" value="articles" name="sources"
            >
            <span>Articles Only</span>
         </label>
         <label for="search-images">
            <input @click="sourcesClicked('images')" id="search-images" type="radio"
               v-model="searchSources" value="images" name="sources"
            >
            <span>Images Only</span>
         </label>
         <SearchTips />
      </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'
import { mapGetters } from "vuex"
import SearchTips from "@/components/disclosures/SearchTips"
export default {
    components: {
     SearchTips
   },
   props: {
      mode: {
         type: String,
         default: "basic"
      },
   },
   computed: {
      ...mapGetters({
         rawQueryString: 'query/string',
         queryEntered: 'query/queryEntered'
      }),
      ...mapFields({
        searchSources: 'query.searchSources',
        userSearched: 'query.userSearched',
      }),
   },
   methods: {
      sourcesClicked( setting ) {
         if ( this.searchSources  != setting ) {
            this.searchSources = setting
            if (this.queryEntered || this.$route.query.filter ) {
               let query = Object.assign({}, this.$route.query)
               delete query.page
               query.q = this.rawQueryString
               query.pool = setting
               this.userSearched = true
               this.$router.push({ query })
            }
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
