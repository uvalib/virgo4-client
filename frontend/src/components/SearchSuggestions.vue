<template>
   <div v-if="suggestor.open" >
      <div class="header">
         <span>Suggestions</span>
         <VirgoButton icon="fas fa-times" aria-label="close suggestions" rounded @click="suggestor.close" size="small" variant="text"/>
      </div>
      <div class="wrapper">
         <!-- Did You Mean Block: Show immediately if available -->
         <div v-if="suggestor.didYouMean && suggestor.requestedFeatures.includes('didyoumean')" class="did-you-mean">
            Did you mean: <a href="#" @click.stop.prevent="didYouMeanClick">{{suggestor.didYouMean}}</a>?
         </div>

         <!-- Author Section: Results or local spinner -->
         <div class="author-section" :class="{'mt-10': suggestor.didYouMean && (suggestor.searchingSuggestions || suggestor.suggestions.length > 0)}">
            <template v-if="suggestor.suggestions.length > 0">
            <div class="section-label">
               <i class="fas fa-user-friends"></i> Authors related to your search
            </div>
               <div class="searches">
                  <template v-for="(s,idx) in sortedAuthors"  :key="`sugest${idx}`">
                     <span class="sep" v-if="idx > 0">|</span>
                     <div class="suggestion-item">
                        <router-link @mousedown="suggestionClick(s.value)"
                           class="suggestion"
                           :aria-label="linkLabel(s)"
                           :to="getRelatedLink(s)"
                        >
                           {{s.value}}
                        </router-link>
                        <button v-if="s.reason" :aria-label="s.reason" class="reason-icon" v-tooltip="s.reason" @keydown.esc="handleEsc">
                           <i class="fas fa-info-circle"></i>
                        </button>
                        <span v-if="userStore.isAdmin && preferences.aiDebug && s.source" class="source-badge" :class="s.source">
                           {{ s.source == 'llm' ? 'llm' : 'kb' }}
                           <span v-if="s.score && s.source != 'llm'" class="score-val">({{ Math.round(s.score * 100) }}%)</span>
                        </span>
                     </div>
                  </template>
               </div>
            </template>

            <!-- Spinner: Always show if searchingSuggestions is true, anchored to this section -->
            <div v-if="suggestor.searchingSuggestions" class="loading" :class="{'mt-10': suggestor.suggestions.length > 0}">
               <i class="fas fa-spinner fa-spin"></i>
               <span class="note ml-10">Finding suggestions...</span>
            </div>
         </div>
         
         <!-- Books Section -->
         <div v-if="suggestor.suggestions.some( s => s.type == 'book')" class="book-section">
            <div class="section-label">
               <i class="fas fa-book"></i> Books related to your search
            </div>
            <div class="searches">
               <template v-for="(b,idx) in sortedBooks"  :key="`book${idx}`">
                  <span class="sep" v-if="idx > 0">|</span>
                  <div class="suggestion-item">
                     <router-link
                        class="suggestion"
                        :aria-label="bookLinkLabel(b)"
                        :to="getRelatedLink(b)"
                     >
                        {{b.value}}
                     </router-link>
                     <button v-if="b.reason" :aria-label="b.reason" class="reason-icon" v-tooltip="b.reason" @keydown.esc="handleEsc">
                        <i class="fas fa-info-circle"></i>
                     </button>
                     <span v-if="userStore.isAdmin && preferences.aiDebug && b.source" class="source-badge" :class="b.source">
                        {{ b.source == 'llm' ? 'llm' : 'kb' }}
                        <span v-if="b.score && b.source != 'llm'" class="score-val">({{ Math.round(b.score * 100) }}%)</span>
                     </span>
                  </div>
               </template>
            </div>
         </div>

         <!-- Images Section -->
         <div v-if="suggestor.suggestions.some( s => s.type == 'image')" class="image-section">
            <div class="section-label">
               <i class="fas fa-images"></i> Images related to your search
            </div>
            <div class="image-grid">
               <div v-for="(img, idx) in sortedImages" :key="`img${idx}`" class="suggested-image">
                  <router-link :to="`/sources/images/items/${img.facet}`" :title="img.value">
                     <img :src="`https://iiif.lib.virginia.edu/iiif/${img.iiif_id || img.facet}/square/150,150/0/default.jpg`" :alt="img.value" />
                  </router-link>
                  <span v-if="userStore.isAdmin && preferences.aiDebug && img.source" class="source-badge floating" :class="img.source">
                     {{ img.source == 'llm' ? 'llm' : 'kb' }}
                     <span v-if="img.score && img.source != 'llm'" class="score-val">({{ Math.round(img.score * 100) }}%)</span>
                  </span>
               </div>
            </div>
         </div>

         <!-- Debug Info: Show if we have any data to debug -->
         <div v-if="userStore.isAdmin && suggestor.suggestionMetadata && (suggestor.suggestions.length > 0 || suggestor.didYouMean)" class="ai-debug-info">
            <hr/>
            <div class="debug-details">
               <span class="label">AI Debug:</span>
               <span class="metric">Model: {{suggestor.suggestionMetadata.model}}</span>
               <span class="sep">|</span>
               <span class="metric">Total: {{suggestor.suggestionMetadata.total_time_ms}}ms</span>
               <span class="sep">|</span>
               <span class="metric">Cycles: {{suggestor.suggestionMetadata.cycle1_time_ms}} / {{suggestor.suggestionMetadata.cycle2_time_ms}} / {{suggestor.suggestionMetadata.cycle3_time_ms}} ms</span>
               <span class="sep">|</span>
               <span class="metric">Tokens: {{suggestor.suggestionMetadata.input_tokens}} in / {{suggestor.suggestionMetadata.output_tokens}} out</span>
               <template v-if="suggestor.suggestionMetadata.cost_per_1k">
                  <span class="sep">|</span>
                  <span class="metric">Cost/1k requests: ${{suggestor.suggestionMetadata.cost_per_1k.toFixed(4)}}</span>
               </template>
            </div>
            <div class="debug-toggles">
               <button v-if="suggestor.suggestionMetadata.input_prompt" class="toggle-link" @click="showPrompt = !showPrompt">
                  {{ showPrompt ? 'Hide' : 'View' }} Prompt
               </button>
               <button v-if="suggestor.suggestionMetadata.raw_output" class="toggle-link" @click="showRaw = !showRaw">
                  {{ showRaw ? 'Hide' : 'View' }} Raw LLM
               </button>
               <button v-if="suggestor.suggestionMetadata.reasoning" class="toggle-link" @click="showReasoning = !showReasoning">
                  {{ showReasoning ? 'Hide' : 'View' }} Reasoning
               </button>
               <div class="cache-toggle">
                  <input type="checkbox" id="ai-cache-disable" v-model="preferences.aiCacheDisabled" @change="preferences.savePreferences" />
                  <label for="ai-cache-disable">Disable Cache</label>
               </div>
            </div>
            <div v-if="showPrompt" class="debug-pane">
               <h5>Input Prompt</h5>
               <pre>{{suggestor.suggestionMetadata.input_prompt}}</pre>
            </div>
            <div v-if="showRaw" class="debug-pane">
               <h5>Raw LLM Output</h5>
               <pre>{{suggestor.suggestionMetadata.raw_output}}</pre>
            </div>
            <div v-if="showReasoning" class="debug-pane">
               <h5>Model Reasoning</h5>
               <pre>{{suggestor.suggestionMetadata.reasoning}}</pre>
            </div>
         </div>

         <!-- Empty State: Only when finished and nothing found AT ALL -->
         <div v-if="!suggestor.searchingSuggestions && suggestor.suggestions.length == 0 && !suggestor.didYouMean && suggestor.completedFeatures.length >= suggestor.requestedFeatures.length" class="no-suggestions note">
            No suggestions found for this query.
         </div>
      </div>
   </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import analytics from '@/analytics'
import { useQueryStore } from "@/stores/query"
import { useUserStore } from "@/stores/user"
import { useSuggestorStore } from "@/stores/suggestor"
import { usePreferencesStore } from "@/stores/preferences"
import { useRouter } from 'vue-router'

const queryStore  = useQueryStore()
const userStore = useUserStore()
const suggestor = useSuggestorStore()
const router = useRouter()
const preferences = usePreferencesStore()

// Diagnostics toggles
const showPrompt = ref(false)
const showRaw = ref(false)
const showReasoning = ref(false)

const sortedImages = computed( () => {
   return suggestor.suggestions.filter( s => s.type == 'image').sort( (a,b) => {
      return (b.score || 0) - (a.score || 0)
   }).slice(0, 10)
})

const sortedAuthors = computed( () => {
   return suggestor.suggestions.filter( s => s.type == 'author' || s.type == "" || !s.type)
})

const sortedBooks = computed( () => {
   return suggestor.suggestions.filter( s => s.type == 'book')
})

const suggestionClick = ((val) => {
   queryStore.userSearched = true
   analytics.trigger('Results', 'AUTHOR_SUGGEST_CLICKED', val)
})

const didYouMeanClick = (() => {
   analytics.trigger('Results', 'DID_YOU_MEAN_CLICKED', suggestor.didYouMean)
   queryStore.basic = suggestor.didYouMean
   router.push("/search?q="+encodeURIComponent(suggestor.didYouMean))
})

const linkLabel = ((sug) => {
   return `${sug.value}, suggested author related to your search`
})

const bookLinkLabel = ((sug) => {
   return `${sug.value}, suggested book related to your search`
})

const getRelatedLink = ((sug) => {
   if (sug.type == 'book' && sug.id) {
      return `/sources/uva_library/items/${sug.id}`
   }
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
   suggestor.fetch( queryStore.string )
})
</script>

<style lang="scss" scoped>
.header {
   display: flex;
   justify-content: space-between;
   align-items: baseline;
   padding: 5px 10px;
   background-color: $uva-brand-blue;
   color: white;
   border-radius: 0.3rem 0.3rem 0 0;
   .p-button {
      color: white;
      font-weight: bold;
      &:hover {
         background: white;
         color: $uva-grey-B;
      }
   };
}
.wrapper {
   padding: 10px;
   background-color: white;
   border: 1px solid $uva-grey-100;
   border-radius: 0.3rem;
   display: flex;
   flex-direction: column;
   text-align: left;
   gap: 5px;
   transition: all 0.2s ease;
}

.note  {
   font-weight: 100;
   font-size: 0.9em;
   display: inline-block;
}
.section-label {
   display: flex;
   align-items: center;
   gap: 8px;
   font-size: 0.75rem;
   font-weight: 700;
   text-transform: uppercase;
   letter-spacing: 0.05em;
   color: $uva-brand-blue;
   margin-bottom: 10px;
   opacity: 0.8;
   
   i {
      color: $uva-blue-alt;
      font-size: 1.2em;
   }
}
.image-section {
   margin-top: 25px;
   padding-top: 20px;
   border-top: 1px solid #f0f0f0;

   .image-grid {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      gap: 10px;
      margin-top: 10px;

      .suggested-image {
         position: relative;
         // Mobile: 5 per row
         width: calc(20% - 8px);

         // Desktop: 10 across in one row
         @media (min-width: 768px) {
            width: calc(10% - 9px);
         }

         a {
            display: block;
            text-decoration: none;
         }
         img {
            width: 100%;
            aspect-ratio: 1 / 1;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid $uva-grey-100;
            background-color: #f8f9fa;
            transition: transform 0.2s ease;
            &:hover {
               transform: scale(1.05);
               border-color: $uva-blue-alt;
            }
         }
      }
   }
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
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    
    &:hover, &:focus-visible {
        opacity: 1;
        color: #232D4B;
        outline: none;
    }

    @media (max-width: 768px) {
       font-size: 1.1em;
       padding: 5px; // Larger tap target
       margin-left: 2px;
    }
}
.source-badge {
    font-size: 0.7em;
    font-weight: bold;
    text-transform: uppercase;
    padding: 1px 4px;
    border-radius: 3px;
    line-height: 1;
    display: inline-block;
    vertical-align: middle;
    margin-left: 2px;
    opacity: 0.8;
    user-select: none;

    &.llm {
        background-color: #e3f2fd;
        color: #1976d2;
        border: 1px solid #bbdefb;
    }
    &.kb {
        background-color: #f1f8e9;
        color: #388e3c;
        border: 1px solid #dcedc8;
    }

    &.floating {
        position: absolute;
        top: 2px;
        right: 2px;
        z-index: 5;
        background-color: rgba(241, 248, 233, 0.9); // Slight transparency for images
        pointer-events: none;
    }

    .score-val {
       margin-left: 2px;
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
      .cache-toggle {
         display: flex;
         align-items: center;
         gap: 5px;
         font-size: 0.9em;
         font-weight: bold;
         color: $uva-text-color-dark;
         background-color: #f1f3f5;
         padding: 2px 8px;
         border-radius: 4px;
         border: 1px solid #dee2e6;
         input {
            cursor: pointer;
            width: 13px;
            height: 13px;
         }
         label {
            cursor: pointer;
            white-space: nowrap;
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
.loading {
   display: flex;
   align-items: center;
   &.mt-10 {
      margin-top: 10px;
   }
}


</style>
