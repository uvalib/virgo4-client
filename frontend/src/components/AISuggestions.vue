<template>
   <div v-if="(suggestions.length > 0 || loading || disabled) && showComponent" class="ai-suggestions">
      <div v-if="loading && !disabled" class="loading-state">
         <span class="spinner"></span> Generating AI suggestions...
      </div>
      <div v-else-if="disabled" class="disabled-state">
          <button @click="toggleFeature" class="enable-bin" title="Enable AI Suggestions">
             Using AI Suggestions <span class="enable-link">Enable</span> 
          </button>
      </div>
      <div v-else-if="!loading && suggestions.length > 0" class="suggestions-content">
         <div class="header-row">
            <h2><span class="magic-icon">✨</span> AI Smart Suggestions</h2>
            <button @click="toggleFeature" class="disable-link">No thanks</button>
         </div>
         <div class="wrapper">
            <div v-if="didYouMean" class="did-you-mean">
                 Did you mean: 
                 <router-link :to="getLink(didYouMean)" @click="suggestionClick(didYouMean)" class="correction-link">
                     {{ didYouMean }}
                 </router-link>
                 ?
            </div>
            <span class="note">Try these refined searches:</span>
            <div class="searches">
               <template v-for="(s, idx) in suggestions" :key="`ai-suggest-${idx}`">
                  <span class="sep" v-if="idx > 0">|</span>
                  <router-link @click="suggestionClick(s)"
                     class="suggestion"
                     :to="getLink(s)"
                  >
                     {{s}}
                  </router-link>
               </template>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import axios from 'axios'
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useSystemStore } from "@/stores/system"
import { useCookies } from "vue3-cookies"
import analytics from '@/analytics'

const queryStore = useQueryStore()
const resultStore = useResultStore()
const systemStore = useSystemStore()
const { cookies } = useCookies()

const suggestions = ref([])
const didYouMean = ref("")
const loading = ref(false)
const disabled = ref(cookies.get("virgo4_ai_suggestions_disabled") === "true")

// Only show the component check logic
const showComponent = computed(() => {
   // Always show if there are suggestions or loading, OR if disabled (so user can re-enable)
   // We show it even if total=0 (for "Did you mean")
   return true 
})

onMounted(() => {
   if (!resultStore.searching && !disabled.value) {
      fetchSuggestions()
   }
})

const toggleFeature = () => {
   disabled.value = !disabled.value
   if (disabled.value) {
      cookies.set("virgo4_ai_suggestions_disabled", "true", "30d")
      suggestions.value = []
      didYouMean.value = ""
   } else {
      cookies.remove("virgo4_ai_suggestions_disabled")
      fetchSuggestions()
   }
}

// Watch for search completion
watch(() => resultStore.searching, async (newVal, oldVal) => {
   // If we just finished searching (true -> false)
   if (oldVal === true && newVal === false) {
      if (!disabled.value) {
         await fetchSuggestions()
      }
   }
})

const fetchSuggestions = async () => {
   loading.value = true
   suggestions.value = []
   didYouMean.value = ""

   try {
      // Gather context from the first pool (usually most relevant)
      // or find uva_library pool
      let contextItems = []
      
      if (resultStore.results && resultStore.results.length > 0) {
         let targetPool = resultStore.results.find(r => r.pool.id === 'uva_library') || resultStore.results[0]
         if (targetPool && targetPool.hits) {
             contextItems = targetPool.hits.slice(0, 5).map(hit => {
                 let title = "Unknown Title"
                 if (hit.header && hit.header.title) title = hit.header.title
                 else if (hit.fields) {
                     const titleField = hit.fields.find(f => f.name === 'title' || f.name === 'title_display')
                     if (titleField) title = titleField.value
                 }
        
                 let snippet = ""
                 if (hit.fields) {
                     const author = hit.fields.find(f => f.name === 'author')
                     if (author) snippet += `Author: ${author.value}. `
                     const abstract = hit.fields.find(f => f.name === 'abstract_summary')
                     if (abstract) snippet += abstract.value.substring(0, 150)
                 }
                 return { title, snippet }
             })
         }
      }

      const payload = {
         originalQuery: queryStore.string,
         contextItems: contextItems
      }

      const response = await axios.post('/api/suggestions', payload)
      if (response.data) {
          if (response.data.suggestions) {
             suggestions.value = response.data.suggestions
             didYouMean.value = response.data.didYouMean
          } else if (Array.isArray(response.data)) {
             suggestions.value = response.data
          }
      }
   } catch (error) {
      console.error("AI Suggestions Error:", error)
   } finally {
      loading.value = false
   }
}

const getLink = (term) => {
   return `/search?q=${encodeURIComponent(term)}`
}

const suggestionClick = (term) => {
    queryStore.userSearched = true
    analytics.trigger('Results', 'AI_SUGGEST_CLICKED', term)
}
</script>

<style lang="scss" scoped>
.ai-suggestions {
   padding: 0 0 15px 0;
   text-align: left;
   margin: 0;
}

.disabled-state {
    padding: 10px 0;
    text-align: right; 
    font-size: 0.9em;
}

.enable-bin {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.9em;
    cursor: pointer;
    color: $uva-grey-100;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    &:hover {
        color: $uva-brand-blue;
    }
}
.enable-link {
    text-decoration: underline;
    color: $uva-brand-blue;
}

.loading-state {
    font-style: italic;
    color: $uva-grey-100;
    font-size: 0.9em;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.spinner {
   display: inline-block;
   width: 12px;
   height: 12px;
   border: 2px solid rgba(0,0,0,0.1);
   border-radius: 50%;
   border-top-color: $uva-brand-blue;
   animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

h2 {
   margin: 0;
   padding: 0;
   font-size: 1.17em;
   display: flex;
   align-items: center;
   gap: 8px;
}

.disable-link {
    background: none;
    border: none;
    color: #232D4B; // Darker blue for better contrast
    font-size: 0.8em;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    &:hover {
        color: #cc0000;
    }
}

.magic-icon {
    font-size: 1.2em;
}

.wrapper {
   padding: 15px;
   background-color: #f0f7ff; 
   border: 1px solid #cce5ff;
   border-radius: 0.5rem;
   box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.did-you-mean {
    margin-bottom: 12px;
    font-size: 1.05em;
    color: #cc0000; 
    font-weight: bold;
}

.correction-link {
    font-style: italic;
    text-decoration: underline;
    color: #cc0000;
    cursor: pointer;
    margin-left: 5px;
    &:hover {
        color: #aa0000;
    }
}

.note {
   font-weight: 500;
   font-size: 0.9em;
   color: #333333;
   display: block;
   margin-bottom: 8px;
}

.searches {
   font-size: 0.95em;
   line-height: 1.6em;
   display: flex;
   flex-flow: row wrap;
   justify-content: flex-start;
   align-items: center;
   gap: 8px 12px;
}

.suggestion {
    color: #232D4B;
    text-decoration: none;
    &.router-link-active {
         text-decoration: underline;
    }
    &:hover {
        text-decoration: underline;
        color: #151A2C;
    }
}

.sep {
    color: $uva-grey-100;
}
</style>
