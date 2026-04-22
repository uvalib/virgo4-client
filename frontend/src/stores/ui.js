import { defineStore } from 'pinia'
import { useResultStore } from "@/stores/result"
import { useQueryStore } from "@/stores/query"
import { usePreferencesStore } from "@/stores/preferences"

export const useUIStore = defineStore('ui', {
   state: () => ({
      suggestionsOpen: localStorage.getItem('v4_suggestions_open') === 'true',
      suggestionCache: JSON.parse(localStorage.getItem('v4_suggestion_cache') || '{"queries": [], "data": {}}'),
   }),

   actions: {
      toggleSuggestions() {
         this.suggestionsOpen = !this.suggestionsOpen
         localStorage.setItem('v4_suggestions_open', this.suggestionsOpen)
         
         const results = useResultStore()
         if (this.suggestionsOpen && results.suggestions.length == 0 && results.searchingSuggestions == false) {
            const query = useQueryStore()
            const prefs = usePreferencesStore()
            results.clearSuggestions()
            if (query.string) {
               results.fetchSuggestions(query.string, prefs.aiPrompt, ['author'])
               if (prefs.aiFeatures.includes('didyoumean')) {
                  results.fetchSuggestions(query.string, prefs.aiPrompt, ['didyoumean'])
               }
            }
         }
      },

      addToSuggestionCache(query, results) {
         const q = query.trim().toLowerCase()
         if (!q) return

         // Update order (FIFO)
         const idx = this.suggestionCache.queries.indexOf(q)
         if (idx > -1) {
            // Move to end (most recent)
            this.suggestionCache.queries.splice(idx, 1)
         }
         this.suggestionCache.queries.push(q)

         // Initialize or merge data
         if (!this.suggestionCache.data[q]) {
            this.suggestionCache.data[q] = {
               suggestions: [],
               didYouMean: "",
               metadata: null
            }
         }

         const entry = this.suggestionCache.data[q]
         if (results.suggestions && results.suggestions.length > 0) {
            entry.suggestions = results.suggestions
         }
         if (results.did_you_mean) {
            entry.didYouMean = results.did_you_mean
         }
         
         // Merge metadata
         if (results.metadata) {
            if (!entry.metadata) {
               entry.metadata = results.metadata
            } else {
               // Sum tokens and use the most comprehensive model info
               entry.metadata.input_tokens += results.metadata.input_tokens
               entry.metadata.output_tokens += results.metadata.output_tokens
               entry.metadata.cycle2_time_ms = Math.max(entry.metadata.cycle2_time_ms, results.metadata.cycle2_time_ms)
               entry.metadata.total_time_ms = Math.max(entry.metadata.total_time_ms, results.metadata.total_time_ms)
            }
         }

         // Enforce 20 item limit
         if (this.suggestionCache.queries.length > 20) {
            const oldest = this.suggestionCache.queries.shift()
            delete this.suggestionCache.data[oldest]
         }

         localStorage.setItem('v4_suggestion_cache', JSON.stringify(this.suggestionCache))
      },

      getSuggestionsFromCache(query) {
         const q = query.trim().toLowerCase()
         return this.suggestionCache.data[q]
      }
   },
})
