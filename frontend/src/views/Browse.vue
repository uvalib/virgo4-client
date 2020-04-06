<template>
   <div class="browse">
      <h1>Browse <span class="browse-type">{{type}}</span></h1>
      <V4Spinner  v-if="searching" message="Searching..." v-bind:overlay="true" v-bind:dots="true" />
      <div class="browse-content">
         <div class="target"><h2>{{this.$route.query.q}}</h2></div>
         <SearchResults v-if="hasResults" v-bind:showSummary="false"/>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchResults from "@/components/SearchResults"
import V4Spinner from "@/components/V4Spinner"
export default {
   name: "browse",
   props: {
      type: String
   },
   components: {
     SearchResults, V4Spinner
   },
   computed: {
      ...mapState({
         searching: state => state.searching,
      }),
      ...mapGetters({
        hasResults: 'hasResults',
        selectedResults: 'selectedResults',
        rawQueryString: 'query/string',
      }),
   },
   created: function() {
      this.browseCreated()
   },
   methods: {
      async browseCreated() {
         await this.$store.dispatch("system/getConfig")
         await this.$store.dispatch('pools/getPools')

         let prior = this.rawQueryString
         let targetQ = this.$route.query.q
         let browseType = this.$route.params.type


         // Update query to be a subject search matching the param.
         // Do the search only if the new query is different from prior
         if (browseType == "subjects") {
            this.$store.commit("query/browseSubjects", targetQ)
         } else if (browseType == "author") {
            this.$store.commit("query/browseAuthors", targetQ)
         }
         let newQ = this.rawQueryString
         if ( newQ != prior ) {
            this.$store.commit('resetSearchResults')
            this.$store.commit('filters/reset')
            this.$store.dispatch("searchAllPools")
         }
      },
   }
};
</script>

<style scoped>
@media only screen and (min-width: 768px) {
}
@media only screen and (max-width: 768px) {
}
.browse-type {
   text-transform: capitalize;
}
.browse {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
div.target {
   padding: 0 1rem;
   margin-bottom: 1rem;
}
</style>
