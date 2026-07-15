import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import axios from 'axios'
import { useCookies } from "vue3-cookies"

export const usePreferencesStore = defineStore('preferences', {
	state: () => ({
      trackingOptOut: false,
      pickupLibrary: {id: "", name: ""},
      searchExclusions: [],
      collapseGroups: false,
      collapseDetails: false,
      aiDebug: false,
      aiFeatures: [],
      aiModel: "default",
      aiCacheDisabled: false,
      aiKBOnly: false,
      aiAuthorThreshold: 0.3,
      aiImageThreshold: 0.1,
      aiBookThreshold: 0.1,
      searchTemplate: {
         fields: [],
      }
   }),

   getters: {
      hasSearchTemplate: state => {
         return state.searchTemplate && state.searchTemplate.fields.length > 0
      },
      isPoolExcluded: state => {
         return (poolID) => {
           return state.searchExclusions.includes(poolID)
         }
      },
      expandDetails: state => {
         return !state.collapseDetails
      }
   },

   actions: {
      setPreferences(prefsObj) {
         if (prefsObj.collapseGroups ) {
            this.collapseGroups = prefsObj.collapseGroups
         }
         if (prefsObj.collapseDetails ) {
            this.collapseDetails = prefsObj.collapseDetails
         }
         if ( prefsObj.trackingOptOut) {
            const { cookies } = useCookies()
            this.trackingOptOut  = prefsObj.trackingOptOut
            let optOutCookie = cookies.get('v4_optout')
            if ( this.trackingOptOut && !optOutCookie) {
               let data = {v4_opt_out: true}
               cookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
            } else {
               cookies.remove("v4_optout")
            }
         }
         if (prefsObj.pickupLibrary ) {
            const system = useSystemStore()
            if (!system.pickupLibraries.some((lib) => lib.id == prefsObj.pickupLibrary.id) ){
               // Clear the pickup Library if not in the currently available list
               this.pickupLibrary = {id: "", name: ""}
            } else {
               this.pickupLibrary = prefsObj.pickupLibrary
            }
         } else {
            this.pickupLibrary = {id: "", name: ""}
         }
         if (prefsObj.searchTemplate ) {
            this.searchTemplate = prefsObj.searchTemplate
         }

         this.searchExclusions = prefsObj.searchExclusions || []

         this.aiDebug = prefsObj.aiDebug || false
         this.aiFeatures = prefsObj.aiFeatures || []
         this.aiModel = prefsObj.aiModel || "default"
         this.aiCacheDisabled = prefsObj.aiCacheDisabled || false
         this.aiKBOnly = prefsObj.aiKBOnly || false
         this.aiAuthorThreshold = prefsObj.aiAuthorThreshold || 0.3
         this.aiImageThreshold = prefsObj.aiImageThreshold || 0.1
         this.aiBookThreshold = prefsObj.aiBookThreshold || 0.1
      },
      clear() {
         this.$reset()
      },
      setGuestPoolExclusions() {
         // by default, guest users cannot search certain pools. Add them to the searchExclusions
         this.searchExclusions = ["worldcat", "jmrl"]
      },
      async saveAdvancedSearchTemplate( template ) {
         this.searchTemplate = template
         await this.save()
      },
      async toggleOptOut() {
         const { cookies } = useCookies()
         this.trackingOptOut = !this.trackingOptOut
         if ( this.trackingOptOut ) {
            let data = {v4_opt_out: true}
            cookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
         } else {
            cookies.remove("v4_optout")
         }
         await this.save()
         window.location.reload()
      },
      async removeSearchExclusions() {
         this.searchExclusions = []
         await this.save()
      },
      async toggleSearchExclusion( poolID ) {
         if (this.searchExclusions.includes(poolID)) {
            this.searchExclusions = this.searchExclusions.filter( pID => pID != poolID)
         } else {
            this.searchExclusions.push(poolID)
         }
         await this.save()
      },
      async toggleCollapseGroups() {
         this.collapseGroups = !this.collapseGroups
         await this.save()
      },
      async toggleCollapseDetails() {
         this.collapseDetails = !this.collapseDetails
         await this.save()
      },
      async updatePickupLibrary( pl ) {
         this.pickupLibrary = pl
         await this.save()
      },
      async pickupLibraryDeleted(id) {
         if (this.pickupLibrary.id == id) {
            this.pickupLibrary = {id: "", name: ""}
            await this.save()
         }
      },
      async load() { // TODO CHECK THOS
         const userStore = useUserStore()
         let url = `/api/users/${userStore.signedInUser}/preferences`
         await axios.get(url).then((response) => {
            this.setPreferences(JSON.parse(response.data))
         }).catch((error) => {
            const system = useSystemStore()
            system.setError(error)
        })
      },
      async save() {
         const userStore = useUserStore()
         let url = `/api/users/${userStore.signedInUser}/preferences`
         let data = {
            trackingOptOut: this.trackingOptOut,
            pickupLibrary: this.pickupLibrary,
            collapseGroups: this.collapseGroups,
            collapseDetails: this.collapseDetails,
            searchTemplate: this.searchTemplate,
            searchExclusions: this.searchExclusions,
            aiDebug: this.aiDebug,
            aiFeatures: this.aiFeatures,
            aiModel: this.aiModel,
            aiCacheDisabled: this.aiCacheDisabled,
            aiKBOnly: this.aiKBOnly,
            aiAuthorThreshold: this.aiAuthorThreshold,
            aiImageThreshold: this.aiImageThreshold,
            aiBookThreshold: this.aiBookThreshold,
         }
         await axios.post(url, data).then( () => {
            console.log("preferences saved")
         }).catch( (error) => {
            const system = useSystemStore()
            system.setError(error)   
         })
      },
   }
})