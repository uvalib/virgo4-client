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
            if (query.string) {
               results.fetchSuggestions(query.string, prefs.aiPrompt)
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

         // Add data
         this.suggestionCache.data[q] = {
            suggestions: results.suggestions,
            didYouMean: results.did_you_mean,
            metadata: results.metadata,
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
      },

      clearSuggestionCache() {
         this.suggestionCache = { queries: [], data: {} }
         localStorage.removeItem('v4_suggestion_cache')
      }
   },
})
