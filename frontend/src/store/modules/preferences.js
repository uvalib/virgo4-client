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
      sourceSet: "default",
      maxTabs: 3,
      sourceLabel: "Resource Type",
      excludePools: [],
      optInPools: [],
      trackingOptOut: false,
      pickupLibrary: {id: "", name: ""},
      enableBarcodeScan: false,
      collapseGroups: false,
      searchTemplate: {
         fields: [],
         excluded: [],
      }
   },

   getters: {
      getField,
      hasSearchTemplate: state => {
         return state.searchTemplate && state.searchTemplate.fields.length > 0
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
      toggleCollapseGroups(state) {
         state.collapseGroups = !state.collapseGroups
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
         state.excludePools.splice(0, state.excludePools.length)
         if (prefsObj.excludePools ) {
            state.excludePools = prefsObj.excludePools
         }
         if (prefsObj.collapseGroups ) {
            state.collapseGroups = prefsObj.collapseGroups
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
         if (prefsObj.searchTemplate ) {
            state.searchTemplate = prefsObj.searchTemplate
         }
         if (prefsObj.sourceSet ) {
            state.sourceSet = prefsObj.sourceSet
            if ( state.sourceSet == 'default') {
               state.maxTabs = 3
               state.sourceLabel = "Resource Type"
            } else {
               state.maxTabs = 4
               state.sourceLabel = "Source"
            }
         }
      },
      clear(state) {
         state.sourceSet = "default"
         state.maxTabs = 3
         state.sourceLabel = "Resource Type"
         state.trackingOptOut = false
         state.collapseGroups = false
         state.enableBarcodeScan = false
         state.excludePools.splice(0, state.excludePools.length)
         state.optInPools.splice(0, state.optInPools.length)
         state.searchTemplate.fields.splice(0, state.searchTemplate.fields.length)
         state.searchTemplate.excluded.splice(0, state.searchTemplate.excluded.length)
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
            }
         }
      },
      toggleAltSources(state) {
         if ( state.sourceSet == 'default') {
            state.sourceSet = 'alt'
            state.maxTabs = 4
            state.sourceLabel = "Source"
         } else {
            state.sourceSet = 'default'
            state.maxTabs = 3
            state.sourceLabel = "Resource Type"
         }
      },
      setSearchTemplate(state, tpl) {
         state.searchTemplate.fields.splice(0, state.searchTemplate.fields.length)
         tpl.fields.forEach( f => {
            state.searchTemplate.fields.push(f)
         })
         state.searchTemplate.excluded.splice(0, state.searchTemplate.excluded.length)
         tpl.excluded.forEach( e => {
            state.searchTemplate.excluded.push(e)
         })
      }
   },

   actions: {
      async saveAdvancedSearchTemplate( ctx, template) {
         ctx.commit("setSearchTemplate", template)
         ctx.dispatch("savePreferences")
      },
      async toggleAltSources(ctx) {
         ctx.commit("toggleAltSources")
         await ctx.dispatch("savePreferences")
         await ctx.dispatch("pools/getPools", null, {root:true})
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
      toggleCollapseGroups(ctx) {
         ctx.commit("toggleCollapseGroups")
         ctx.dispatch("savePreferences")
      },
      savePreferences(ctx) {
         let url = `/api/users/${ctx.rootState.user.signedInUser}/preferences`
         let data = {
            excludePools: ctx.state.excludePools,
            trackingOptOut: ctx.state.trackingOptOut,
            pickupLibrary: ctx.state.pickupLibrary,
            enableBarcodeScan: ctx.state.enableBarcodeScan,
            collapseGroups: ctx.state.collapseGroups,
            optInPools: ctx.state.optInPools,
            searchTemplate: ctx.state.searchTemplate,
            sourceSet: ctx.state.sourceSet
         }
         return axios.post(url, data)
      }
   }
}

export default preferences