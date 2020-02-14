import axios from 'axios'
import Vue from 'vue'
import router from '../../router'
import { getField, updateField } from 'vuex-map-fields'

const preferences = {
   namespaced: true,
   state: {
      targetPoolURL: "",
      excludePoolURLs: [],
      trackingOptOut: false,
      pickupLibrary: "",
   },

   getters: {
     getField,
      isTargetPool: state => poolURL => {
         return state.targetPoolURL == poolURL
      },
      isPoolExcluded: state => pooURL => {
         let excluded = false
         state.excludePoolURLs.forEach(function (url) {
            if (url == pooURL) {
               excluded = true
            }
         })
         return excluded
      },
   },

   mutations: {
      updateField,
      setPickupLibrary(state, lib){
         state.pickupLibrary = lib
      },
      toggleOptOut(state) {
         state.trackingOptOut = !state.trackingOptOut
         if ( state.trackingOptOut ) {
            let data = {v4_opt_out: true}
            Vue.$cookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
         } else {
            Vue.$cookies.remove("v4_optout")
         }
         router.go()
      },
      setPreferences(state, prefsStr) {
         state.targetPoolURL = ""
         state.excludePoolURLs = []
         let json = ""
         try {
            json = JSON.parse(prefsStr)
            if (json.targetPoolURL ) {
               state.targetPoolURL = json.targetPoolURL
            }
            if (json.excludePoolURLs ) {
               state.excludePoolURLs = json.excludePoolURLs
            }
            if ( json.trackingOptOut) {
               state.trackingOptOut  = json.trackingOptOut
               let optOutCookie = Vue.$cookies.get('v4_optout')
               if ( state.trackingOptOut && !optOutCookie) {
                  let data = {v4_opt_out: true}
                  Vue.$cookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
               }
            }
            if (json.pickupLibrary ) {
               state.pickupLibrary = json.pickupLibrary
            }
         } catch(e) {
            // NOOP; just leave preferences unset
         }
      },
      clear(state) {
         state.trackingOptOut = false
         state.targetPoolURL = ""
         state.excludePoolURLs.splice(0, state.excludePoolURLs.length)
      },
      toggleExcludePool(state, poolURL) {
         let idx = state.excludePoolURLs.indexOf(poolURL)
         if (idx > -1) {
            state.excludePoolURLs.splice(idx, 1)
         } else {
            state.excludePoolURLs.push(poolURL)
            if (state.targetPoolURL == poolURL ) {
               state.targetPoolURL = ""
            }
         }
      },
      toggleTargetPool(state, poolURL) {
         if (state.targetPoolURL == poolURL) {
            state.targetPoolURL = ""
         } else {
            state.targetPoolURL = poolURL
         }
      },
   },

   actions: {
      toggleTargetPool(ctx, tgtURL) {
         ctx.commit("toggleTargetPool", tgtURL)
         ctx.dispatch("savePreferences")
      },
      toggleExcludePool(ctx, tgtURL) {
         ctx.commit("toggleExcludePool", tgtURL)
         ctx.dispatch("savePreferences")
      },
      toggleOptOut(ctx) {
         ctx.commit("toggleOptOut")
         ctx.dispatch("savePreferences")
      },
      savePreferences(ctx) {
         let url = `/api/users/${ctx.rootState.user.signedInUser}/preferences`
         let data = {targetPoolURL: ctx.state.targetPoolURL,
            excludePoolURLs: ctx.state.excludePoolURLs,
            trackingOptOut: ctx.state.trackingOptOut,
            pickupLibrary: ctx.state.pickupLibrary,
         }
         axios.post(url, data)
      }
   }
}

export default preferences