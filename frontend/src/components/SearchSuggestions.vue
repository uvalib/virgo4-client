<template>
   <div v-if="suggestions.length >0" class="suggestions">
      <h2>Suggestions</h2>
      <div class="wrapper">
         <span class="note">Authors related to your search</span>
         <div class="searches">
            <template v-for="(s,idx) in suggestions.slice(0,2)"  :key="`sugest${idx}`">
               <span class="sep" v-if="idx > 0">|</span>
               <router-link @mousedown="suggestionClick(s.value)"
                  class="suggestion"
                  :aria-label="linkLabel(s)"
                  :to="getRelatedLink(s)"
               >
                  {{s.value}}
               </router-link>
            </template>
            <template v-if="suggestions.length > 2 && moreVisible == false">
               <span class="sep">|</span>
               <V4Button mode="text" @click="moreClicked" class="more">Show More...</V4Button>
            </template>
            <template  v-if="suggestions.length > 2 && moreVisible == true">
               <template v-for="(s,idx) in suggestions.slice(2)"  :key="`sugest${idx+2}`">
                  <span class="sep">|</span>
                  <router-link  @mousedown="suggestionClick(s.value)"
                     class="suggestion" :aria-label="linkLabel(s)"
                     :to="getRelatedLink(s)"
                  >
                     {{s.value}}
                  </router-link>
               </template>
               <span class="sep">|</span>
               <V4Button mode="text" @click="lessClicked" class="more">Show Fewer...</V4Button>
            </template>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
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
      }),
      ...mapFields({
        userSearched: 'query.userSearched',
      }),
   },
   methods: {
      suggestionClick(val) {
         this.userSearched = true
         this.$analytics.trigger('Results', 'AUTHOR_SUGGEST_CLICKED', val)
      },
      linkLabel(sug) {
         return `${sug.value}, suggested author related to your search`
      },
      getRelatedLink( sug ) {
         let qp = `${sug.type}: {"${encodeURIComponent(sug.value)}"}`
         let url = `/search?mode=advanced&q=${qp}`
         return url
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

<style lang="scss" scoped>
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
   box-shadow:  $v4-box-shadow-light;
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
.more.v4-button {
   font-style: italic;
   font-weight: 100;
}
</style>
