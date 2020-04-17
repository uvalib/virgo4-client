<template>
   <div v-if="suggestions.length >0" class="suggestions">
      <h2>Suggestions</h2>
      <div class="wrapper">
         <span class="note">Authors releated to your last search</span>
         <div class="searches">
            <template v-for="(s,idx) in suggestions.slice(0,2)">
               <span class="sep" v-if="idx > 0" :key="`sep${idx}`">|</span>
               <router-link  :key="`s${idx}`" :to="getRelatedLink(s)">{{s.value}}</router-link>
            </template>
            <template v-if="suggestions.length > 2 && moreVisible == false">
               <span class="sep">|</span>
               <span @click="moreClicked" class="more text-button">Show More...</span>
            </template>
            <template  v-if="suggestions.length > 2 && moreVisible == true">
               <template v-for="(s,idx) in suggestions.slice(2)">
                  <span class="sep" :key="`sep${idx+2}`">|</span>
                  <router-link  :key="`s${idx+2}`" :to="getRelatedLink(s)">{{s.value}}</router-link>
               </template>
               <span class="sep">|</span>
               <span @click="lessClicked" class="more text-button">Show Less</span>
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
   data: function() {
      return {
         moreVisible: false
      }
   },
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
      },
      moreClicked() {
         this.moreVisible = true
      },
      lessClicked() {
         this.moreVisible = false
      }
   }
}
</script>

<style scoped>
.suggestions {
   padding: 15px 0;
   text-align: left;
   margin: 0;
}
h2 {
   margin: 0 0 15px 0;
   padding: 0;
   font-size: 1.17em;
}
.wrapper {
   padding: 10px;
   background-color: white;
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.12);
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
span.more.text-button {
   font-style: italic;
   font-weight: 100;
}
</style>
