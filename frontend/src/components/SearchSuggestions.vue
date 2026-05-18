<template>
   <div v-if="suggestor.open" >
      <div class="header">
         <span>Suggestions</span>
         <VirgoButton icon="fas fa-times" aria-label="close suggestions" rounded @click="suggestor.close" size="small" variant="text"/>
      </div>
      <div class="wrapper">
         <!-- Did You Mean Block: Show immediately if available -->
         <div v-if="suggestor.didYouMean && suggestor.requestedFeatures.includes('didyoumean')" class="section">
            <b>Did you mean</b>: <VirgoButton variant="link" :label="suggestor.didYouMean" @click="didYouMeanClick" />?
         </div>

         <!-- Working or Empty State (only when finished and nothing found AT ALL) -->
         <div v-if="!suggestor.searchingSuggestions && suggestor.suggestions.length == 0 && !suggestor.didYouMean && suggestor.completedFeatures.length >= suggestor.requestedFeatures.length" class="no-suggestions note">
            No suggestions found for this query.
         </div>
         <div v-else-if="suggestor.searchingSuggestions" class="loading">
            <i class="fas fa-spinner fa-spin"></i><span class="note">Finding suggestions...</span>
         </div>

         <!-- popover for viewing reason -->
         <Popover ref="po">
            <div style="max-width: 275px;">{{ reasonTxt }}</div>
         </Popover>

         <!-- Author Section -->
         <div v-if="suggestor.suggestions.some( s => s.type == 'author')" class="section">
            <div class="section-label">
               <i class="fas fa-user-friends"></i> Authors related to your search
            </div>
            <div class="searches">
               <template v-for="(s, idx) in sortedAuthors" :key="`sugest${idx}`">
                  <span class="sep" v-if="idx > 0">|</span>
                  <div class="suggestion-item">
                     <VirgoButton asChild v-slot="slotProps" variant="link">
                        <RouterLink  @click="suggestionClick('author', s.value)" :to="getRelatedLink(s)" :class="slotProps.class"> {{ s.value }}</RouterLink>
                     </VirgoButton>
                     <VirgoButton size="small" icon="fas fa-info-circle" class="reason" rounded variant="text" @click="displayReason($event, s.reason)"/>
                     <span v-if="userStore.isAdmin && preferences.aiDebug && s.source" class="source-badge" :class="s.source">
                        {{ s.source == 'llm' ? 'llm' : 'kb' }}
                        <span v-if="s.score && s.source != 'llm'" class="score-val">({{ Math.round(s.score * 100) }}%)</span>
                     </span>
                  </div>
               </template>
            </div>
         </div>
         
         <!-- Books Section -->
         <div v-if="suggestor.suggestions.some( s => s.type == 'book')" class="section">
            <div class="section-label">
               <i class="fas fa-book"></i>Books related to your search
            </div>
            <div class="searches">
               <template v-for="(b,idx) in sortedBooks"  :key="`book${idx}`">
                  <span class="sep" v-if="idx > 0">|</span>
                  <div class="suggestion-item">
                     <VirgoButton asChild v-slot="slotProps" variant="link">
                        <RouterLink  @click="suggestionClick('book', b.value)" :to="getRelatedLink(b)" :class="slotProps.class"> {{ b.value }}</RouterLink>
                     </VirgoButton>
                     <VirgoButton size="small" icon="fas fa-info-circle" class="reason" rounded variant="text" @click="displayReason($event, b.reason)"/>
                     <span v-if="userStore.isAdmin && preferences.aiDebug && b.source" class="source-badge" :class="b.source">
                        {{ b.source == 'llm' ? 'llm' : 'kb' }}
                        <span v-if="b.score && b.source != 'llm'" class="score-val">({{ Math.round(b.score * 100) }}%)</span>
                     </span>
                  </div>
               </template>
            </div>
         </div>

         <!-- Images Section -->
         <div v-if="suggestor.suggestions.some( s => s.type == 'image')" class="section">
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

      </div>
   </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import analytics from '@/analytics'
import { useQueryStore } from "@/stores/query"
import { useUserStore } from "@/stores/user"
import { useSuggestorStore } from "@/stores/suggestor"
import { usePreferencesStore } from "@/stores/preferences"
import { useRouter } from 'vue-router'
import Popover from 'primevue/popover'

const queryStore  = useQueryStore()
const userStore = useUserStore()
const suggestor = useSuggestorStore()
const router = useRouter()
const preferences = usePreferencesStore()
const po = ref()
const reasonTxt = ref("")

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


const displayReason = (( event, reason) => {
   po.value.hide()
   if ( reasonTxt.value != reason) {
      reasonTxt.value = reason
      nextTick(() => {
         po.value.show(event)
      })
   } else {
      reasonTxt.value = ""   
   }
})
const suggestionClick = ((suggType, val) => {
   queryStore.userSearched = true
   if (suggType == 'author') {
      analytics.trigger('Results', 'AUTHOR_SUGGEST_CLICKED', val)
   } else if (suggType == 'book') {
      analytics.trigger('Results', 'BOOK_SUGGEST_CLICKED', val)
   } else if (suggType == 'image') {
      analytics.trigger('Results', 'IMAGE_SUGGEST_CLICKED', val)
   }
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
   padding: 1rem;
   background-color: white;
   border: 1px solid $uva-grey-100;
   border-radius: 0.3rem;
   display: flex;
   flex-direction: column;
   text-align: left;
   gap: 20px;
   transition: all 0.2s ease;
   .loading {
      display: flex;
      align-items: center;
      flex-flow: row nowrap;
      gap: 10px;
   }
   .section {
      text-align: left;
      .section-label {
         display: flex;
         align-items: baseline;
         gap: 8px;
         font-size: 0.8rem;
         font-weight: 700;
         text-transform: uppercase;
         color: $uva-brand-blue;
         margin-bottom: 10px;
         opacity: 0.8;
         i {
            color: $uva-blue-alt;
            font-size: 1.2em;
         }
      }
      .p-button-link {
         padding:0;
      }
      .searches {
         font-size: 0.9em;
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-start;
         align-items: center;
         gap: 8px;
         .p-button.reason {
            width: 18px;
            height: 18px;
            color: $uva-grey;
            &:hover {
               color: $uva-grey-B;    
            }
         }
         .suggestion-item {
            display: flex;
            flex-flow: row nowrap;
            align-items: baseline;
            gap: 5px;
            .p-button-link {
               font-size:1em;
            }
         }
      }
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

            img {
               width: 100%;
               aspect-ratio: 1 / 1;
               object-fit: cover;
               border-radius: 0.3rem;
               border: 1px solid $uva-grey-100;
               background-color: $uva-grey-200;
               transition: transform 0.2s ease;
               &:hover {
                  transform: scale(1.05);
                  border-color: $uva-blue-alt;
               }
            }
         }
      }
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

.ai-debug-info {
   font-family: monospace;
   font-size: 0.8em;
   color: #666;
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