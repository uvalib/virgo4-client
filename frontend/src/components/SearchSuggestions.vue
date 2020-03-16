<template>
   <div v-if="suggestions.length >0" class="suggestions">
      <h2>Suggestions</h2>
      <div class="wrapper">
         <span class="note">Authors releated to your last search</span>
         <div class="searches">
            <template v-for="(s,idx) in suggestions">
               <span class="sep" v-if="idx > 0" :key="`sep${idx}`">|</span>
               <router-link  :key="`s${idx}`" :to="getRelatedLink(s)">{{s.value}}</router-link>
            </template>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   name: "SearchSuggestions",
   computed: {
      ...mapState({
         suggestions: state=>state.suggestions,
      }),
      ...mapGetters({
        rawQueryString: 'query/string',
      })
   },
   methods: {
      getRelatedLink( sug ) {
         return `/browse/${sug.type}?q=${encodeURI(sug.value)}`
      }   
   }
}
</script>

<style scoped>
.suggestions {
   padding: 10px 0;
   text-align: left;
   margin: 0;
   border-bottom: 2px solid var(--uvalib-grey-light);
}
h2 {
   margin: 0;
   padding: 0;
   font-size: 1.1em;
}
.wrapper {
   padding: 10px 0 0 15px;
}
.note  {
   font-weight: 100;
   font-size:0.9;
   display: inline-block;
}
.searches {
   margin-top: 5px;
   font-size: 0.9em;
   line-height: 1.5em;
}
.sep {
   margin: 0 5px;
}
</style>
