<template>
   <div class="home">
      <p class="fatal">{{fatal}}</p>
      <div v-if="searching" class="search-panel">
         <h4>Searching...</h4>
         <img src="../assets/spinner2.gif">
      </div>
      <div v-else class="search-panel pure-form">
         <input
            @keyup.enter="searchClicked"
            id="keyword"
            v-model="keyword"
            type="text"
            placeholder="Search for books, maps, DVDs and other catalog materials."
         >
         <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
      </div>
      <h4 class="error">{{ error }}</h4>
   </div>
</template>

<script>
import { mapState } from "vuex";
import { mapFields } from "vuex-map-fields";
export default {
   name: "home",
   components: {},
   data: function() {
      return {};
   },
   computed: {
      ...mapState({
         searchAPI: state => state.searchAPI,
         fatal: state => state.fatal,
         error: state => state.error,
         searching: state => state.searching
      }),
      ...mapFields(["query.keyword"])
   },
   created: function() {
      this.$store.dispatch("getConfig");
   },
   methods: {
      searchClicked() {
         this.$store.dispatch("doSearch");
      }
   }
};
</script>

<style scoped>
.home {
   min-height: 600px;
}
p.fatal, h4.error {
   font-weight: bold;
   color: firebrick;
}
.search-panel {
   margin: 5% auto 0 auto;
   text-align: center;
}
#keyword {
   margin-right: 5px;
   width: 60%;
}
</style>
