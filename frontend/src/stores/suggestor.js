import { defineStore } from 'pinia'
import { useResultStore } from "@/stores/result"
import { useQueryStore } from "@/stores/query"
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import { usePreferencesStore } from "@/stores/preferences"
import axios from 'axios'

export const useSuggestorStore = defineStore('suggestor', {
   state: () => ({
      suggestions: [],
      searchingSuggestions: false,
      activeSuggestionsCount: 0,
      didYouMean: "",
      suggestionMetadata: null,
      requestedFeatures: [],
      completedFeatures: [],
      open: localStorage.getItem('v4_suggestions_open') === 'true',
      cache: JSON.parse(localStorage.getItem('v4_suggestion_cache') || '{"queries": [], "data": {}}'),
   }),

   actions: {
      toggle() {
         this.open = !this.open
         localStorage.setItem('v4_suggestions_open', this.open)
         
         if (this.open && this.suggestions.length == 0 && this.searchingSuggestions == false) {
            const query = useQueryStore()
            if (query.string) {
               this.fetch( query.string )
            }
         }
      },

      close() {
         this.open = !this.open
         localStorage.setItem('v4_suggestions_open', this.open)   
      },

      clearSuggestions() {
         this.suggestions = []
         this.didYouMean = ""
         this.suggestionMetadata = null
         this.requestedFeatures = []
         this.completedFeatures = []
         this.activeSuggestionsCount = 0
         this.searchingSuggestions = false
      },

      fetch(queryStr) {
         const prefs = usePreferencesStore()
         const user = useUserStore()
         const system = useSystemStore()

         this.clearSuggestions()

         if ( this.open == false ) return 
         if ( system.useSuggestor == false ) return
         if ( user.isSignedIn == false || user.isExperimental == false  ) return false 
         if ( useQueryStore().isKeywordSearch == false ) return false

         // always get author suggestions; try other suggestions if preferences configured
         this.doFetch(queryStr, ['author'])
         if (prefs.aiFeatures.includes('didyoumean')) {
            this.doFetch(queryStr, ['didyoumean'])
         }
         if (prefs.aiFeatures.includes('images')) {
            this.doFetch(queryStr, ['images'])
         }
         if (prefs.aiFeatures.includes('book')) {
            this.doFetch(queryStr, ['book'])
         }
      },

      async doFetch(queryStr, featuresOverride = null, attempt = 1) {
         const system = useSystemStore()
         const prefs = usePreferencesStore()
   
         let requestFeatures = featuresOverride || [...prefs.aiFeatures]
         if (prefs.aiModel && prefs.aiModel != "default") {
            if (!requestFeatures.some(f => f.startsWith("llm:"))) {
               requestFeatures.push(`llm:${prefs.aiModel}`)
            }
         }

         if (prefs.aiKBOnly) {
            if (!requestFeatures.includes('kb-only')) {
               requestFeatures.push('kb-only')
            }
         }

         if (featuresOverride) {
            this.requestedFeatures = Array.from(new Set([...this.requestedFeatures, ...featuresOverride]))
         } else {
            this.requestedFeatures = [...requestFeatures]
         }
         
         if (attempt == 1) {
            if (requestFeatures.includes('author') || requestFeatures.length == 0) {
               this.suggestions = this.suggestions.filter(s => s.type != 'author' && s.type != "")
            }
            if (requestFeatures.includes('didyoumean')) {
               this.didYouMean = ""
            }
            this.completedFeatures = this.completedFeatures.filter( f => !requestFeatures.includes(f))
            if (attempt == 1 && (requestFeatures.includes('didyoumean') || requestFeatures.includes('images') || !this.suggestionMetadata)) {
               this.suggestionMetadata = null
            }

            // Increment before cache check to maintain global loading state
            this.activeSuggestionsCount++
            this.searchingSuggestions = true

            const cached = this.getFromCache(queryStr)
            if (cached && !prefs.aiCacheDisabled) {
               const hasAuthors = cached.suggestions && cached.suggestions.some(s => s.type == 'author' || s.type == "" || !s.type)
               const hasDym = !!cached.didYouMean
               const hasImages = cached.suggestions && cached.suggestions.some(s => s.type == 'image')
               const hasBooks = cached.suggestions && cached.suggestions.some(s => s.type == 'book')
               
               const needsAuthors = requestFeatures.includes('author') || requestFeatures.length == 0
               const needsDym = requestFeatures.includes('didyoumean')
               const needsImages = requestFeatures.includes('images')
               const needsBooks = requestFeatures.includes('book')

               if ((!needsAuthors || hasAuthors) && (!needsDym || hasDym) && (!needsImages || hasImages) && (!needsBooks || hasBooks)) {
                  this.suggestions = cached.suggestions
                  this.didYouMean = cached.didYouMean
                  this.suggestionMetadata = cached.metadata
                  
                  requestFeatures.forEach( f => {
                     if (!this.completedFeatures.includes(f)) this.completedFeatures.push(f)
                  })

                  this.activeSuggestionsCount--
                  if (this.activeSuggestionsCount <= 0) {
                     this.activeSuggestionsCount = 0
                     this.searchingSuggestions = false
                  }
                  return
               }
            }
         }

         let url = `${system.suggestionsAPI}/api/suggest`
         let req = {
            query: queryStr,
            debug: prefs.aiDebug,
            features: requestFeatures,
            authorThreshold: prefs.aiAuthorThreshold,
            imageThreshold: prefs.aiImageThreshold,
            bookThreshold: prefs.aiBookThreshold
         }

         try {
             const response = await axios.post(url, req)
             if (response.data) {
                if (prefs.aiDebug) console.log("SUGGESTIONS API RESPONSE:", response.data)
                if (response.data.did_you_mean && requestFeatures.includes('didyoumean')) {
                  this.didYouMean = response.data.did_you_mean
               }
                if (response.data.suggestions && response.data.suggestions.length > 0) {
                   if (requestFeatures.includes('author') || requestFeatures.length == 0) {
                      this.setSuggestions(response.data.suggestions.filter(s => s.type != 'image' && s.type != 'book'))
                   }
                   if (requestFeatures.includes('images')) {
                      // Append image suggestions to the existing list. Use iiif_id for uniqueness 
                      // to allow multiple images from the same catalog item.
                      response.data.suggestions.filter(s => s.type == 'image').forEach( img => {
                         const imgKey = img.iiif_id || img.facet || img.value;
                         if (!this.suggestions.some( s => (s.iiif_id || s.facet || s.value) === imgKey)) {
                            this.suggestions.push(img)
                         }
                      })
                   }
                   if (requestFeatures.includes('book')) {
                      // Append book suggestions to the existing list. Use ID for uniqueness.
                      response.data.suggestions.filter(s => s.type == 'book').forEach( book => {
                         if (!this.suggestions.some( s => s.type == 'book' && s.id === book.id)) {
                            this.suggestions.push(book)
                         }
                      })
                   }
                }
               
               if (response.data.metadata) {
                  if (!this.suggestionMetadata) {
                     this.suggestionMetadata = response.data.metadata
                  } else {
                     // Merge feature-specific metadata
                     Object.keys(response.data.metadata).forEach(feature => {
                        if (!this.suggestionMetadata[feature]) {
                           this.suggestionMetadata[feature] = response.data.metadata[feature]
                        } else {
                           this.suggestionMetadata[feature].input_tokens += response.data.metadata[feature].input_tokens
                           this.suggestionMetadata[feature].output_tokens += response.data.metadata[feature].output_tokens
                           if (response.data.metadata[feature].cost_per_1k) {
                              this.suggestionMetadata[feature].cost_per_1k = (this.suggestionMetadata[feature].cost_per_1k || 0) + response.data.metadata[feature].cost_per_1k
                           }
                           this.suggestionMetadata[feature].cycle1_time_ms = Math.max(this.suggestionMetadata[feature].cycle1_time_ms || 0, response.data.metadata[feature].cycle1_time_ms || 0)
                           this.suggestionMetadata[feature].cycle2_time_ms = Math.max(this.suggestionMetadata[feature].cycle2_time_ms || 0, response.data.metadata[feature].cycle2_time_ms || 0)
                           this.suggestionMetadata[feature].cycle3_time_ms = Math.max(this.suggestionMetadata[feature].cycle3_time_ms || 0, response.data.metadata[feature].cycle3_time_ms || 0)
                           this.suggestionMetadata[feature].total_time_ms = Math.max(this.suggestionMetadata[feature].total_time_ms || 0, response.data.metadata[feature].total_time_ms || 0)
                        }
                     })
                  }
               }
               this.updateCache(queryStr, response.data)
            }
         } catch (error) {
            console.error("SUGGESTIONS FAILED: " + error)
            if (attempt < 2) {
               await new Promise(resolve => setTimeout(resolve, 500))
               await this.doFetch(queryStr, featuresOverride, attempt + 1)
               return
            }
         } finally {
            if (attempt == 1) {
               requestFeatures.forEach( f => {
                  if (!this.completedFeatures.includes(f)) this.completedFeatures.push(f)
               })
               this.activeSuggestionsCount--
               if (this.activeSuggestionsCount <= 0) {
                  this.activeSuggestionsCount = 0
                  this.searchingSuggestions = false
               }
            }
         }
      },

      setSuggestions(data) {
         // Keep non-author suggestions (like images)
         this.suggestions = this.suggestions.filter(s => s.type != 'author' && s.type != "")
         data.forEach(d => {
            this.suggestions.push(d)
         })
      },

      clearCache() {
         localStorage.removeItem('v4_suggestion_cache')
         this.cache = {
            "queries": [],
            "data": {}
         }
      },

      updateCache(query, results) {
         const q = query.trim().toLowerCase()
         if (!q) return

         // Update order (FIFO)
         const idx = this.cache.queries.indexOf(q)
         if (idx > -1) {
            // Move to end (most recent)
            this.cache.queries.splice(idx, 1)
         }
         this.cache.queries.push(q)

         // Initialize or merge data
         if (!this.cache.data[q]) {
            this.cache.data[q] = {
               suggestions: [],
               didYouMean: ""
            }
         }

         const entry = this.cache.data[q]

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
         if (this.cache.queries.length > 20) {
            const oldest = this.cache.queries.shift()
            delete this.cache.data[oldest]
         }

         localStorage.setItem('v4_suggestion_cache', JSON.stringify(this.cache))
      },

      getFromCache(query) {
         const q = query.trim().toLowerCase()
         return this.cache.data[q]
      }
   },
})
