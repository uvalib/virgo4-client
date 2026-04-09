<template>
   <div v-if="userStore.isSignedIn && queryStore.isKeywordSearch" class="suggestions" :class="{ open: ui.suggestionsOpen }">
      <button v-if="!ui.suggestionsOpen" class="opt-in-pill" @click="ui.toggleSuggestions" title="Show related author suggestions">
         <i class="fas fa-lightbulb"></i>
         <span class="label">Search Suggestions</span>
      </button>
      <div v-else>
         <div class="header">
            <h2>Suggestions</h2>
            <button class="close-btn" @click="ui.toggleSuggestions" title="Hide suggestions">
               <i class="fas fa-times"></i> Hide
            </button>
         </div>
         <div class="wrapper">
            <div v-if="results.searchingSuggestions" class="loading">
               <i class="fas fa-spinner fa-spin"></i>
               <span class="note ml-10">Finding related authors...</span>
            </div>
            <template v-else-if="results.suggestions.length > 0 || results.didYouMean">
               <div v-if="results.didYouMean && results.requestedFeatures.includes('didyoumean')" class="did-you-mean">
                  Did you mean: <a href="#" @click.stop.prevent="didYouMeanClick">{{results.didYouMean}}</a>?
               </div>
               <span v-if="results.suggestions.length > 0" class="note">Authors related to your search</span>
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
               <div v-if="userStore.isAdmin && results.suggestionMetadata" class="ai-debug-info">
                  <hr/>
                  <div class="debug-details">
                     <span class="label">AI Debug:</span>
                     <span class="metric">Total: {{results.suggestionMetadata.total_time_ms}}ms</span>
                     <span class="sep">|</span>
                     <span class="metric">Cycles: {{results.suggestionMetadata.cycle1_time_ms}} / {{results.suggestionMetadata.cycle2_time_ms}} / {{results.suggestionMetadata.cycle3_time_ms}} ms</span>
                     <span class="sep">|</span>
                     <span class="metric">Tokens: {{results.suggestionMetadata.input_tokens}} in / {{results.suggestionMetadata.output_tokens}} out</span>
                     <template v-if="results.suggestionMetadata.cost_per_1k">
                        <span class="sep">|</span>
                        <span class="metric">Cost/1k requests: ${{results.suggestionMetadata.cost_per_1k.toFixed(4)}}</span>
                     </template>
                  </div>
                  <div class="debug-toggles">
                     <button v-if="results.suggestionMetadata.input_prompt" class="toggle-link" @click="showPrompt = !showPrompt">
                        {{ showPrompt ? 'Hide' : 'View' }} Prompt
                     </button>
                     <button v-if="results.suggestionMetadata.raw_output" class="toggle-link" @click="showRaw = !showRaw">
                        {{ showRaw ? 'Hide' : 'View' }} Raw LLM
                     </button>
                     <button v-if="results.suggestionMetadata.reasoning" class="toggle-link" @click="showReasoning = !showReasoning">
                        {{ showReasoning ? 'Hide' : 'View' }} Reasoning
                     </button>
                  </div>
                  <div v-if="showPrompt" class="debug-pane">
                     <h5>Input Prompt</h5>
                     <pre>{{results.suggestionMetadata.input_prompt}}</pre>
                  </div>
                  <div v-if="showRaw" class="debug-pane">
                     <h5>Raw LLM Output</h5>
                     <pre>{{results.suggestionMetadata.raw_output}}</pre>
                  </div>
                  <div v-if="showReasoning" class="debug-pane">
                     <h5>Model Reasoning</h5>
                     <pre>{{results.suggestionMetadata.reasoning}}</pre>
                  </div>
               </div>
            </template>
         </div>
      </div>
   </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import analytics from '@/analytics'
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useUserStore } from "@/stores/user"
import { useUIStore } from "@/stores/ui"
import { usePreferencesStore } from "@/stores/preferences"
import { useRouter } from 'vue-router'

const queryStore  = useQueryStore()
const results = useResultStore()
const userStore = useUserStore()
const ui = useUIStore()
const router = useRouter()

// Diagnostics toggles
const showPrompt = ref(false)
const showRaw = ref(false)
const showReasoning = ref(false)

const suggestionClick = ((val) => {
   queryStore.userSearched = true
   analytics.trigger('Results', 'AUTHOR_SUGGEST_CLICKED', val)
})

const didYouMeanClick = (() => {
   analytics.trigger('Results', 'DID_YOU_MEAN_CLICKED', results.didYouMean)
   queryStore.basic = results.didYouMean
   router.push("/search?q="+encodeURIComponent(results.didYouMean))
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

onMounted(() => {
   if (ui.suggestionsOpen && results.suggestions.length == 0 && !results.searchingSuggestions) {
      const prefs = usePreferencesStore()
      if (queryStore.string) {
         results.fetchSuggestions(queryStore.string, prefs.aiPrompt)
      }
   }
})
</script>

<style lang="scss" scoped>
.suggestions {
   text-align: left;
   margin: 0;
   position: relative;
   transition: all 0.2s ease;

   &.open {
      padding: 15px 0;
   }
}

.header {
   display: flex;
   justify-content: space-between;
   align-items: baseline;
   margin-bottom: 10px;
   h2 {
      margin: 0;
   }
}

.opt-in-pill {
   position: absolute;
   right: 0;
   top: -35px; // Move up to avoid overlap with buttons below
   z-index: 10;
   display: flex;
   align-items: center;
   gap: 8px;
   padding: 6px 14px;
   background-color: white;
   border: 1px solid $uva-grey-100;
   border-radius: 20px;
   cursor: pointer;
   box-shadow: 0 2px 4px rgba(0,0,0,0.05);
   transition: all 0.2s;
   font-size: 0.85em;
   font-family: inherit; // Required for button element

   &:hover {
      background-color: $uva-blue-alt-400;
      border-color: $uva-blue-alt;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.08);
   }

   &:focus-visible {
      outline: 2px solid $uva-blue-alt;
      outline-offset: 2px;
   }

   i {
      color: $uva-blue-alt;
   }

   .label {
      font-weight: 600;
      color: $uva-text-color-dark;
   }
}

.close-btn {
   background: none;
   border: none;
   color: #6c757d;
   font-size: 0.85em;
   cursor: pointer;
   display: flex;
   align-items: center;
   gap: 5px;
   padding: 4px 8px;
   border-radius: 4px;
   transition: background-color 0.2s;

   &:hover {
      background-color: #f8f9fa;
      color: $uva-blue-alt-200;
   }

   i {
      font-size: 0.9em;
   }
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
.did-you-mean {
    margin-bottom: 10px;
    font-size: 1em;
    font-weight: bold;
    a {
        color: #007bff;
        text-decoration: underline;
        &:hover {
            color: #0056b3;
        }
    }
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
.ai-debug-info {
   margin-top: 15px;
   font-family: monospace;
   font-size: 0.8em;
   color: #666;
   hr {
      border: 0;
      border-top: 1px solid #eee;
      margin-bottom: 10px;
   }
   .debug-details {
      display: flex;
      flex-flow: row wrap;
      gap: 10px;
      align-items: center;
      .label {
         font-weight: bold;
         color: $uva-text-color-dark;
      }
      .metric {
         background-color: #f8f9fa;
         padding: 2px 4px;
         border-radius: 3px;
         border: 1px solid #e9ecef;
      }
      .sep {
         color: #ccc;
      }
   }
   .debug-toggles {
      margin-top: 10px;
      display: flex;
      gap: 15px;
      .toggle-link {
         background: none;
         border: none;
         color: #007bff;
         cursor: pointer;
         padding: 0;
         font-size: 0.9em;
         text-decoration: underline;
         &:hover {
            color: #0056b3;
         }
      }
   }
   .debug-pane {
      margin-top: 10px;
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 10px;
      h5 {
         margin: 0 0 5px 0;
         font-size: 0.9em;
         color: #333;
         text-transform: uppercase;
      }
      pre {
         margin: 0;
         white-space: pre-wrap;
         word-wrap: break-word;
         max-height: 300px;
         overflow-y: auto;
         font-size: 0.9em;
         background: none;
         border: none;
         padding: 0;
      }
   }
}
</style>
