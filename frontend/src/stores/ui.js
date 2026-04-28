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
               if (prefs.aiFeatures.includes('images')) {
                  results.fetchSuggestions(query.string, prefs.aiPrompt, ['images'])
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
               didYouMean: ""
            }
         }

         const entry = this.suggestionCache.data[q]

         // Merge suggestions with deduplication
         if (results.suggestions && results.suggestions.length > 0) {
            results.suggestions.forEach( s => {
               const existingIdx = entry.suggestions.findIndex( es => {
                  if (s.type == 'image' && es.type == 'image') {
                     // Images are unique by facet (catalog ID) and optionally iiif_id
                     return s.facet == es.facet && (s.iiif_id == es.iiif_id)
                  }
                  // Authors/others are unique by value and type
                  return s.value == es.value && s.type == es.type
               })

               if (existingIdx == -1) {
                  entry.suggestions.push(s)
               } else {
                  // Update existing item with any new data (like scores or reasons)
                  entry.suggestions[existingIdx] = { ...entry.suggestions[existingIdx], ...s }
               }
            })
         }

         if (results.did_you_mean) {
            entry.didYouMean = results.did_you_mean
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
