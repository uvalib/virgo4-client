import axios from 'axios'
import * as utils from './utils'
import router from '../../router'

const item = {
   namespaced: true,
   state: {
      details: {searching: true, source: "", identifier:"", basicFields:[], detailFields:[], related:[]},
      availability: {searching: true, titleId: '', columns: [], items: []}
   },

   getters: {
      hasDetails: state => (identifier) => {
         return state.identifier == identifier
      },
      availability: state => {
        if ( state.availability == null ) return []
        return state.availability
      }
   },

   mutations: {
      setDetails(state, {source, details}) {
         utils.preProcessHitFields( [details] )
         details.source = source
         state.details = details
         state.details.searching = false
      },
      clearDetails(state) {
         state.details = {searching: true, source: "", identifier:"", basicFields:[], detailFields:[], related:[]}
      },
      setAvailability(state, {titleId, response}) {
        state.availability.titleId = titleId
        state.availability.columns = response.columns
        state.availability.items = response.items
        state.availability.searching = false
      },
      clearAvailability(state) {
        state.availability = {searching: true, titleId: '', columns: [], items: []}
      },
      clearSearching(state){
        state.details.searching = false
        state.availability.searching = false
      },

      setCatalogKeyDetails(state, data) {
         // no match or multiple matches
         // no match or multiple matches
         if (data.total_hits == 0 || data.total_hits > 1) {
            state.details.searching = false
            state.availability.searching = false
            return
         }
         let found = false
         data.pool_results.some( pr => {
            if (pr.group_list && pr.group_list.length == 1) {
               let obj = pr.group_list[0].record_list[0]
               if (obj) {
                  let source = pr.pool_id
                  utils.preProcessHitFields( [obj] )
                  obj.source = source
                  state.details = obj
                  found = true
               }
            }
            return found == true
         })
      }
   },

   actions: {
      async getDetails(ctx, { source, identifier }) {
         if (ctx.getters.hasDetails(identifier)) {
            return
         } else {
            ctx.commit('clearDetails')
         }

         // get source from poolID
         let baseURL = ""
         let pool = null
         let pools = ctx.rootState.pools.list
         if (pools.length == 0) {
            if (ctx.rootState.system.searchAPI == "") {
               await ctx.dispatch("system/getConfig", null, {root:true})
            }
            await ctx.dispatch("pools/getPools", null, {root:true})
            pools = ctx.rootState.pools.list
            pool = pools.find( p => p.id == source)
            baseURL = pool.url
         } else {
            pool = pools.find( p => p.id == source)
            baseURL = pool.url
         }

         let url = baseURL + "/api/resource/" + identifier
         axios.get(url).then((response) => {
            let details = response.data
            ctx.commit("setDetails", {source:source, details: details})
         }).catch((error) => {
           ctx.commit('clearSearching')
           ctx.commit('system/setError', error, { root: true })
         })
      },

      async getAvailability(ctx, titleId ) {
        ctx.commit('clearAvailability')
        axios.get("/api/availability/" + titleId).then((response) => {
          ctx.commit("setAvailability", {titleId: titleId, response: response.data.availability})
          ctx.commit("requests/setRequestOptions", response.data.availability.request_options, {root: true})
        }).catch((error) => {
          ctx.commit('clearSearching')
          if (error.response.status != 404){
            ctx.commit('system/setError', error, {root: true})
          }
        })
      },

      // This is used to lookup a catalog key without a source. end result of this action is a redirect
      async lookupCatalogKeyDetail(ctx, catalogKey) {
         if (ctx.getters.hasDetails(catalogKey)) {
            return
         } else {
            ctx.commit('clearDetails')
         }
         if (ctx.rootState.system.searchAPI == "") {
            await ctx.dispatch("system/getConfig", null, {root:true})
         }
         await ctx.dispatch("pools/getPools", null, {root:true})

         let req = {
            query: `identifier: {${catalogKey}}`,
            pagination: { start: 0, rows: 1 },
            preferences: {
              target_pool: "",
              exclude_pool: [],
            }
         }
         let url = ctx.rootState.system.searchAPI + "/api/search?intuit=1&debug=1"
         return axios.post(url, req).then((response) => {
            if (response.data.total_hits == 0 ) {
               ctx.commit('clearSearching')
               router.push("/not_found")
            } else if (response.data.total_hits == 1 ) {
               ctx.commit('setCatalogKeyDetails', response.data)
               let redirect = `/sources/${ctx.state.details.source}/items/${catalogKey}`
               router.replace(redirect)
            } else {
               router.push(`/search?mode=advanced&q=identifier:{${catalogKey}}`)
            }
         }).catch((_error) => {
            ctx.commit('clearSearching')
            router.push("/not_found")
         })
      }
   }
}

export default item
