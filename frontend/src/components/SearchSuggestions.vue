<template>
   <div v-if="suggestions.length >0" class="suggestions">
      <h2>Suggestions</h2>
      <div class="wrapper">
         <span class="note">Releated to your last search:</span>
         <div class="searches">
            <template v-for="(s,idx) in suggestions">
               <span class="sep" v-if="idx > 0" :key="`sep${idx}`">|</span>
               <router-link  :key="`s${idx}`" :to="getRelatedLink(s)">
                  <b>{{s.type}}:</b>&nbsp;{{s.value}}
               </router-link>
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
         // PROBLEM: This works, but if you navigate BACK, the old search and related 
         // items are lost
         // REMINDER: lastSearch was removed.... did it break stuff???
         // :MAYBE: 
         // use lastSearch as a actual last search and restore it a back to search navigation is detected
         return `/browse/${sug.type}?q=${encodeURI(sug.value)}`
         /* DOES THIS HELP DETECT BACK AND RESTORE PRIOR SEARCH?
         // This listener will execute before router.beforeEach only if registered
// before vue-router is registered with Vue.use(VueRouter)

window.popStateDetected = false
window.addEventListener('popstate', () => {
  window.popStateDetected = true
})


router.beforeEach((to, from, next) => {
  const IsItABackButton = window.popStateDetected
  window.popStateDetected = false
  if (IsItABackButton && from.meta.someLogica) {
    next(false) 
    return ''
  }
  next()
})
*/
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
   padding: 5px 15px;
}
.note  {
   font-weight: 100;
   font-size:0.9;
   font-style: italic;
   display: inline-block;
}
.searches {
   margin-top: 5px;
}
.sep {
   margin: 0 10px;
}
</style>
