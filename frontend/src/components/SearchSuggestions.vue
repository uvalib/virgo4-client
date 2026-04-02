<template>
   <div v-if="results.searchingSuggestions" class="suggestions">
      <h2>Suggestions</h2>
      <div class="wrapper">
         <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span class="note ml-10">Finding related authors...</span>
         </div>
      </div>
   </div>
   <div v-if="!results.searchingSuggestions && results.suggestions.length >0" class="suggestions">
      <h2>Suggestions</h2>
      <div class="wrapper">
         <span class="note">Authors related to your search</span>
         <div class="searches">
            <template v-for="(s,idx) in results.suggestions"  :key="`sugest${idx}`">
               <span class="sep" v-if="idx > 0">|</span>
               <div class="suggestion-item">
                  <router-link @mousedown="suggestionClick(s.value)"
                     class="suggestion"
                     :aria-label="linkLabel(s)"
                     :to="getRelatedLink(s)"
                  >
                     {{s.value}}
                  </router-link>
                  <i v-if="s.reason" tabindex="0" :aria-label="s.reason" class="fas fa-info-circle reason-icon" v-tooltip="s.reason" @focus="onFocus" @blur="onBlur" @keydown.esc="handleEsc"></i>
               </div>
            </template>
         </div>
      </div>
   </div>
</template>

<script setup>
import analytics from '@/analytics'
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"

const queryStore  = useQueryStore()
const results = useResultStore()

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

const handleEsc = ((event) => {
   event.target.blur()
})

const onFocus = ((event) => {
   event.target.dispatchEvent(new MouseEvent('mouseenter'))
})

const onBlur = ((event) => {
   event.target.dispatchEvent(new MouseEvent('mouseleave'))
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
   border: 1px solid $uva-grey-100;
   border-radius: 0.3rem;
}
.note  {
   font-weight: 100;
   font-size: 0.9em;
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
   gap: 5px 12px;
}

.suggestion-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.reason-icon {
    font-size: 0.8em;
    color: #6c757d; // neutral grey
    cursor: help;
    opacity: 0.6;
    transition: opacity 0.2s;
    
    &:hover {
        opacity: 1;
        color: #232D4B;
    }
}
button.more {
   font-style: italic;
}
</style>
