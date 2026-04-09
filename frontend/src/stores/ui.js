import { defineStore } from 'pinia'
import { useResultStore } from "@/stores/result"
import { useQueryStore } from "@/stores/query"
import { usePreferencesStore } from "@/stores/preferences"

export const useUIStore = defineStore('ui', {
   state: () => ({
      suggestionsOpen: localStorage.getItem('v4_suggestions_open') === 'true',
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
   },
})
