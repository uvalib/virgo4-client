import axios from 'axios'
import * as utils from './utils'

const item = {
   namespaced: true,
   state: {
      details: {searching: true, source: "", identifier:"", basicFields:[], detailFields:[]},
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
      setDetails(state, {source, fields}) {
         utils.preProcessHitFields( [fields] )
         fields.source = source
         state.details = fields
         state.details.searching = false
      },
      clearDetails(state) {
         state.details = {searching: true, source: "", identifier:"", basicFields:[], detailFields:[]}
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
         if (data.total_hits == 0) return
         if (data.total_hits > 1) return
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
            pool = utils.findPool(pools, source)
            baseURL = pool.url
         } else {
            pool = utils.findPool(pools, source)
            baseURL = pool.url
         }

         let url = baseURL + "/api/resource/" + identifier
         axios.defaults.headers.common['Authorization'] = "Bearer " + ctx.rootState.user.authToken
         axios.get(url).then((response) => {
            ctx.commit("setDetails", {source:source, fields: response.data})
         }).catch((error) => {
           ctx.commit('clearSearching')
           ctx.commit('system/setError', error, { root: true })
         })
      },

      async getAvailability(ctx, titleId ) {
        ctx.commit('clearAvailability')
        axios.defaults.headers.common['Authorization'] = "Bearer " + ctx.rootState.user.authToken
        axios.get("/api/availability/" + titleId).then((response) => {
          ctx.commit("setAvailability", {titleId: titleId, response: response.data.availability})
        }).catch((error) => {
          ctx.commit('clearSearching')
          if (error.response.status != 404){
            ctx.commit('system/setError', error, {root: true})
          }
        })
      },

      async lookupCatalogKeyDetail(ctx, catalogKey) {
         if (ctx.getters.hasDetails(catalogKey)) {
            return
         } else {
            ctx.commit('clearDetails')
         }
         ctx.commit('setSearching', true, { root: true })
         if (ctx.rootState.system.searchAPI == "") {
            await ctx.dispatch("system/getConfig", null, {root:true})
         }

         let req = {
            query: `identifier: {${catalogKey}}`,
            pagination: { start: 0, rows: 1 },
            preferences: {
              target_pool: "",
              exclude_pool: [],
            }
          }
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         let url = ctx.rootState.system.searchAPI + "/api/search?intuit=1&debug=1"
         return axios.post(url, req).then((response) => {
            ctx.commit('setCatalogKeyDetails', response.data)
         }).catch((error) => {
            ctx.commit('clearSearching')
            alert(error)
         })
      }
   }
}

export default item
