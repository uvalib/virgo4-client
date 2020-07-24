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
      targetPool: "",
      excludePools: [],
      optInPools: [],
      trackingOptOut: false,
      pickupLibrary: {id: "", name: ""},
      enableBarcodeScan: false,
   },

   getters: {
     getField,
      isTargetPool: state => pool => {
         return state.targetPool == pool.id
      },

      excludedPools: (state, _getters, rootState) => {
         let out = new Set()
         rootState.pools.list.forEach( p => {
            // all external pools that are not opted in go in the exclude list
            if ( isPoolExternal(p) && !state.optInPools.includes(p.id)) {   
               out.add(p.id)
            }
         })

         state.excludePools.forEach( pool => {
            out.add(pool)
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
         state.excludePools.some( pid => {
            if (pid == pool.id) {
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
      setPreferences(state, prefsObj) {
         state.targetPool = ""
         state.excludePools.splice(0, state.excludePools.length)

         if (prefsObj.targetPool ) {
            state.targetPool = prefsObj.targetPool
         }
         if (prefsObj.excludePools ) {
            state.excludePools = prefsObj.excludePools
         }
         if (prefsObj.optInPools ) {
            state.optInPools = prefsObj.optInPools
         }
         if ( prefsObj.trackingOptOut) {
            state.trackingOptOut  = prefsObj.trackingOptOut
            let optOutCookie = Vue.$cookies.get('v4_optout')
            if ( state.trackingOptOut && !optOutCookie) {
               let data = {v4_opt_out: true}
               Vue.$cookies.set("v4_optout", JSON.stringify(data), new Date(2099,12,31).toUTCString())
            } else {
               Vue.$cookies.remove("v4_optout")
            }
         }
         if (prefsObj.pickupLibrary ) {
            state.pickupLibrary = prefsObj.pickupLibrary
         }
         if (prefsObj.enableBarcodeScan ) {
            state.enableBarcodeScan = prefsObj.enableBarcodeScan
         }
      },
      clear(state) {
         state.trackingOptOut = false
         state.targetPool = ""
         state.enableBarcodeScan = false
         state.excludePools.splice(0, state.excludePools.length)
         state.optInPools.splice(0, state.optInPools.length)
      },
      toggleExcludePool(state, pool) {
         if ( isPoolExternal(pool) && !state.optInPools.includes(pool.id) ) {
            // if togglining an excluded pool that is not in opt in, this is
            // the first attempt to use it. Move it to opt in
            state.optInPools.push(pool.id)
         } else {
            let idx = state.excludePools.indexOf(pool.id)
            if (idx > -1) {
               state.excludePools.splice(idx, 1)
            } else {
               state.excludePools.push(pool.id)
               if (state.targetPool == pool.id ) {
                  state.targetPool = ""
               }
            }
         }
      },
      toggleTargetPool(state, pool) {
         if (state.targetPool == pool.id) {
            state.targetPool = ""
         } else {
            state.targetPool = pool.id
         }
      },
   },

   actions: {
      toggleTargetPool(ctx, pool) {
         ctx.commit("toggleTargetPool", pool)
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
         let data = {targetPool: ctx.state.targetPool,
            excludePools: ctx.state.excludePools,
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