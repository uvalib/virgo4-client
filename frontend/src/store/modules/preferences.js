import axios from 'axios'
import VueCookies from 'vue-cookies'
import { getField, updateField } from 'vuex-map-fields'

const preferences = {
   namespaced: true,
   state: {
      maxTabs: 4,
      trackingOptOut: false,
      pickupLibrary: {id: "", name: ""},
      enableBarcodeScan: false,
      collapseGroups: false,
      searchTemplate: {
         fields: [],
      }
   },

   getters: {
      getField,
      hasSearchTemplate: state => {
         return state.searchTemplate && state.searchTemplate.fields.length > 0
      },
   },

   mutations: {
      updateField,
      clearPickupLibrary(state){
         state.pickupLibrary = {id: "", name: ""}
      },
      toggleBarcodeScan(state) {
         state.enableBarcodeScan = !state.enableBarcodeScan
      },
      toggleCollapseGroups(state) {
         state.collapseGroups = !state.collapseGroups
      },
      toggleOptOut(state) {
         state.trackingOptOut = !state.trackingOptOut
         if ( state.trackingOptOut ) {
            let data = {v4_opt_out: true}
            VueCookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
         } else {
            VueCookies.remove("v4_optout")
         }
      },
      setPreferences(state, prefsObj) {
         if (prefsObj.collapseGroups ) {
            state.collapseGroups = prefsObj.collapseGroups
         }
         if ( prefsObj.trackingOptOut) {
            state.trackingOptOut  = prefsObj.trackingOptOut
            let optOutCookie = VueCookies.get('v4_optout')
            if ( state.trackingOptOut && !optOutCookie) {
               let data = {v4_opt_out: true}
               VueCookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
            } else {
               VueCookies.remove("v4_optout")
            }
         }
         if (prefsObj.pickupLibrary ) {

            if (!this.getters["user/libraries"].some((lib) => lib.id == prefsObj.pickupLibrary.id) ){
               // Clear the pickup Library if not in the currently available list
               this.commit("preferences/clearPickupLibrary");
            } else {
               state.pickupLibrary = prefsObj.pickupLibrary
            }
         }
         if (prefsObj.enableBarcodeScan ) {
            state.enableBarcodeScan = prefsObj.enableBarcodeScan
         }
         if (prefsObj.searchTemplate ) {
            state.searchTemplate = prefsObj.searchTemplate
         }
      },
      clear(state) {
         state.maxTabs = 4
         state.trackingOptOut = false
         state.collapseGroups = false
         state.enableBarcodeScan = false
         state.searchTemplate.fields.splice(0, state.searchTemplate.fields.length)
      },
      setSearchTemplate(state, tpl) {
         state.searchTemplate.fields.splice(0, state.searchTemplate.fields.length)
         tpl.fields.forEach( f => {
            state.searchTemplate.fields.push(f)
         })
      }
   },

   actions: {
      async saveAdvancedSearchTemplate( ctx, template) {
         ctx.commit("setSearchTemplate", template)
         ctx.dispatch("savePreferences")
      },
      toggleOptOut(ctx) {
         ctx.commit("toggleOptOut")
         ctx.dispatch("savePreferences")
         window.location.reload()
      },
      toggleBarcodeScan(ctx) {
         ctx.commit("toggleBarcodeScan")
         ctx.dispatch("savePreferences")
      },
      toggleCollapseGroups(ctx) {
         ctx.commit("toggleCollapseGroups")
         ctx.dispatch("savePreferences")
      },
      savePreferences(ctx) {
         let url = `/api/users/${ctx.rootState.user.signedInUser}/preferences`
         let data = {
            trackingOptOut: ctx.state.trackingOptOut,
            pickupLibrary: ctx.state.pickupLibrary,
            enableBarcodeScan: ctx.state.enableBarcodeScan,
            collapseGroups: ctx.state.collapseGroups,
            searchTemplate: ctx.state.searchTemplate,
         }
         return axios.post(url, data)
      }
   }
}

export default preferences