import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import axios from 'axios'
import VueCookies from 'vue-cookies'

export const usePreferencesStore = defineStore('preferences', {
	state: () => ({
      maxTabs: 4,
      trackingOptOut: false,
      pickupLibrary: {id: "", name: ""},
      enableBarcodeScan: false,
      collapseGroups: false,
      searchTemplate: {
         fields: [],
      }
   }),

   getters: {
      hasSearchTemplate: state => {
         return state.searchTemplate && state.searchTemplate.fields.length > 0
      },
   },

   actions: {
      setPreferences(prefsObj) {
         if (prefsObj.collapseGroups ) {
            this.collapseGroups = prefsObj.collapseGroups
         }
         if ( prefsObj.trackingOptOut) {
            this.trackingOptOut  = prefsObj.trackingOptOut
            let optOutCookie = VueCookies.get('v4_optout')
            if ( this.trackingOptOut && !optOutCookie) {
               let data = {v4_opt_out: true}
               VueCookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
            } else {
               VueCookies.remove("v4_optout")
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
         if (prefsObj.enableBarcodeScan ) {
            this.enableBarcodeScan = prefsObj.enableBarcodeScan
         }
         if (prefsObj.searchTemplate ) {
            this.searchTemplate = prefsObj.searchTemplate
         }
      },
      clear() {
         this.$reset()
      },
      async saveAdvancedSearchTemplate( template ) {
         this.searchTemplate.fields.splice(0, this.searchTemplate.fields.length)
         template.fields.forEach( f => {
            this.searchTemplate.fields.push(f)
         })
         this.savePreferences()
      },
      async toggleOptOut() {
         this.trackingOptOut = !this.trackingOptOut
         if ( this.trackingOptOut ) {
            let data = {v4_opt_out: true}
            VueCookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
         } else {
            VueCookies.remove("v4_optout")
         }
         await this.savePreferences()
         window.location.reload()
      },
      toggleBarcodeScan() {
         this.enableBarcodeScan = !this.enableBarcodeScan
         this.savePreferences()
      },
      toggleCollapseGroups() {
         this.collapseGroups = !this.collapseGroups
         this.savePreferences()
      },
      async loadPreferences() {
         const userStore = useUserStore()
         let url = `/api/users/${userStore.signedInUser}/preferences`
         return axios.get(url).then((response) => {
            this.setPreferences(JSON.parse(response.data))
         }).catch((error) => {
            const system = useSystemStore()
            system.setError(error)
        })
      },
      savePreferences() {
         const userStore = useUserStore()
         let url = `/api/users/${userStore.signedInUser}/preferences`
         let data = {
            trackingOptOut: this.trackingOptOut,
            pickupLibrary: this.pickupLibrary,
            enableBarcodeScan: this.enableBarcodeScan,
            collapseGroups: this.collapseGroups,
            searchTemplate: this.searchTemplate,
         }
         return axios.post(url, data)
      },
      pickupLibraryDeleted(id) {
         if (this.pickupLibrary.id == id) {
            this.pickupLibrary = {id: "", name: ""}
         }
      }
   }
})