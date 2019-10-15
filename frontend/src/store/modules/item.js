import axios from 'axios'
import * as utils from './utils'

const item = {
   namespaced: true,
   state: {
      details: {source: "", identifier:"", basicFields:[], detailFields:[]},
      availability: {titleId: '', columns: [], holdings: []}
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
         console.log(state.details)
      },
      clearDetails(state) {
         state.details = {source: "", identifier:"", basicFields:[], detailFields:[]}
      },
      setAvailability(state, {titleId, response}) {
        state.availability.titleId = titleId
        state.availability.columns = response.columns
        state.availability.holdings = response.holdings
      }
   },

   actions: {
      async getDetails(ctx, { source, identifier }) {
         if (ctx.getters.hasDetails(identifier)) {
            return
         } else {
            ctx.commit('clearDetails')
         }
         ctx.commit('setSearching', true, { root: true })

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
            ctx.commit('setSearching', false, { root: true })
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setSearching', false, { root: true })
         })
      },

      async getAvailability(ctx, titleId ) {
        axios.defaults.headers.common['Authorization'] = "Bearer " + ctx.rootState.user.authToken
        axios.get("/api/availability/" + titleId).then((response) => {
          ctx.commit('setSearching', false, { root: true })
          ctx.commit("setAvailability", {titleId: titleId, response: response.data.availability})
        }).catch((error) => {
          ctx.commit('system/setError', error, { root: true })
          ctx.commit('setSearching', false, { root: true })
        })
      }
   }
}

export default item
