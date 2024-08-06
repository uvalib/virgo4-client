<template>
   <div v-if="results.suggestions.length >0" class="suggestions">
      <h2>Suggestions</h2>
      <div class="wrapper">
         <span class="note">Authors related to your search</span>
         <div class="searches">
            <template v-for="(s,idx) in results.suggestions.slice(0,2)"  :key="`sugest${idx}`">
               <span class="sep" v-if="idx > 0">|</span>
               <router-link @mousedown="suggestionClick(s.value)"
                  class="suggestion"
                  :aria-label="linkLabel(s)"
                  :to="getRelatedLink(s)"
               >
                  {{s.value}}
               </router-link>
            </template>
            <template v-if="results.suggestions.length > 2 && moreVisible == false">
               <span class="sep">|</span>
               <VirgoButton link @click="moreClicked" class="more">Show More...</VirgoButton>
            </template>
            <template  v-if="results.suggestions.length > 2 && moreVisible == true">
               <template v-for="(s,idx) in results.suggestions.slice(2)"  :key="`sugest${idx+2}`">
                  <span class="sep">|</span>
                  <router-link  @mousedown="suggestionClick(s.value)"
                     class="suggestion" :aria-label="linkLabel(s)"
                     :to="getRelatedLink(s)"
                  >
                     {{s.value}}
                  </router-link>
               </template>
               <span class="sep">|</span>
               <VirgoButton link @click="lessClicked" class="more">Show Fewer...</VirgoButton>
            </template>
         </div>
      </div>
   </div>
</template>

<script setup>
import analytics from '@/analytics'
import { ref } from 'vue'
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"

const queryStore  = useQueryStore()
const results = useResultStore()
const moreVisible = ref(false)

const suggestionClick = ((val) => {
   queryStore.userSearched = true
   analytics.trigger('Results', 'AUTHOR_SUGGEST_CLICKED', val)
})

const linkLabel = ((sug) => {
   return `${sug.value}, suggested author related to your search`
})

const getRelatedLink = ((sug) => {
   let qp = `${sug.type}: {"${encodeURIComponent(sug.value)}"}`
   let url = `/search?mode=advanced&q=${qp}`
   return url
})

const moreClicked =(() => {
   moreVisible.value = true
})

const lessClicked= (() => {
   moreVisible.value = false
})
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
   box-shadow:  var(--uvalib-box-shadow);
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
   display: flex;
   flex-flow: row wrap;
   justify-content: flex-start;
   align-items: center;
   gap: 10px;
}
button.more {
   font-style: italic;
   font-weight: 100;
   padding: 2px 0 !important;
   font-size:0.99em;
}
</style>
