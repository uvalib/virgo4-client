import axios from 'axios'
import Vue from 'vue'
import router from '../../router'
import { getField, updateField } from 'vuex-map-fields'


function isPoolExternal(pool) {
   let ext = pool.attributes.find( a => a.name=='external_hold')
   return ( ext && ext.supported )
}

const preferences = {
   namespaced: true,
   state: {
      targetPoolURL: "",
      excludePoolURLs: [],
      optInPools: [],
      trackingOptOut: false,
      pickupLibrary: {id: "", name: ""},
      enableBarcodeScan: false,
   },

   getters: {
     getField,
      isTargetPool: state => poolURL => {
         return state.targetPoolURL == poolURL
      },

      excludedPoolURLs: (state, _getters, rootState) => {
         let out = new Set()
         rootState.pools.list.forEach( p => {
            // all external pools that are not opted in go in the exclude list
            if ( isPoolExternal(p) && !state.optInPools.includes(p.id)) {   
               out.add(p.url)
            }
         })

         state.excludePoolURLs.forEach( u => {
            out.add(u)
         })
         return [...out] 
      },

      isPoolExcluded: state => pool => {
         // external hold pools are excluded by default
         if ( isPoolExternal(pool) ) {
            // unless they are opted in...
            let optIn = state.optInPools.includes(pool.id)
            if ( !optIn ) {
               return true
            }
         }

         let excluded = false
         state.excludePoolURLs.some( url => {
            if (url == pool.url) {
               excluded = true
            }
            return excluded == true
         })

         return excluded
      },
   },

   mutations: {
      updateField,
      setPickupLibrary(state, lib){
         state.pickupLibrary = lib
      },
      toggleBarcodeScan(state) {
         state.enableBarcodeScan = !state.enableBarcodeScan
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
            if (json.optInPools ) {
               state.optInPools = json.optInPools
            }
            if ( json.trackingOptOut) {
               state.trackingOptOut  = json.trackingOptOut
               let optOutCookie = Vue.$cookies.get('v4_optout')
               if ( state.trackingOptOut && !optOutCookie) {
                  let data = {v4_opt_out: true}
                  Vue.$cookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
               } else {
                  Vue.$cookies.remove("v4_optout")
               }
            }
            if (json.pickupLibrary ) {
               state.pickupLibrary = json.pickupLibrary
            }
            if (json.enableBarcodeScan ) {
               state.enableBarcodeScan = json.enableBarcodeScan
            }
         } catch(e) {
            // NOOP; just leave preferences unset
         }
      },
      clear(state) {
         state.trackingOptOut = false
         state.targetPoolURL = ""
         state.enableBarcodeScan = false
         state.excludePoolURLs.splice(0, state.excludePoolURLs.length)
         state.optInPools.splice(0, state.optInPools.length)
      },
      toggleExcludePool(state, pool) {
         if ( isPoolExternal(pool) && !state.optInPools.includes(pool.id) ) {
            // if togglining an excluded pool that is not in opt in, this is
            // the first attempt to use it. Move it to opt in
            state.optInPools.push(pool.id)
         } else {
            let idx = state.excludePoolURLs.indexOf(pool.url)
            if (idx > -1) {
               state.excludePoolURLs.splice(idx, 1)
            } else {
               state.excludePoolURLs.push(pool.url)
               if (state.targetPoolURL == pool.url ) {
                  state.targetPoolURL = ""
               }
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
      clearExcluded( state ) {
         state.excludePoolURLs.splice(0, state.excludePoolURLs.length)
      },
      excludeAll( state, poolURLs ) {
         poolURLs.forEach( u => {
            if (!state.excludePoolURLs.includes(u)) {
               state.excludePoolURLs.push(u)
            }
         })
      }
   },

   actions: {
      toggleTargetPool(ctx, tgtURL) {
         ctx.commit("toggleTargetPool", tgtURL)
         ctx.dispatch("savePreferences")
      },
      toggleExcludePool(ctx, pool) {
         ctx.commit("toggleExcludePool", pool)
         ctx.dispatch("savePreferences")
      },
      toggleOptOut(ctx) {
         ctx.commit("toggleOptOut")
         ctx.dispatch("savePreferences")
      },
      toggleBarcodeScan(ctx) {
         ctx.commit("toggleBarcodeScan")
         ctx.dispatch("savePreferences")
      },
      savePreferences(ctx) {
         let url = `/api/users/${ctx.rootState.user.signedInUser}/preferences`
         let data = {targetPoolURL: ctx.state.targetPoolURL,
            excludePoolURLs: ctx.state.excludePoolURLs,
            trackingOptOut: ctx.state.trackingOptOut,
            pickupLibrary: ctx.state.pickupLibrary,
            enableBarcodeScan: ctx.state.enableBarcodeScan,
            optInPools: ctx.state.optInPools
         }
         axios.post(url, data)
      }
   }
}

export default preferences