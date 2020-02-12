import axios from 'axios'

const pools = {
   namespaced: true,
   state: {
      list: [],
      lookingUp: false,
   },

   getters: {
      sortedList: state => {
         return state.list.sort( (a,b) => {
            if (a.name < b.name) return -1 
            if (a.name > b.name) return 1 
            return 0
         })
      },
      facetSupport: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return false
         if (!pool.attributes) return true
         let attr = pool.attributes.find( a=> a.name=='facets')
         if (!attr) return true
         return attr.supported
      },
      logo: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return ""
         if (!pool.attributes) return ""
         let attr = pool.attributes.find( a=> a.name=='logo_url')
         if (!attr) return ""
         if (attr.supported == false) return "" 
         return attr.value
      },
      externalURL: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return ""
         if (!pool.attributes) return ""
         let attr = pool.attributes.find( a=> a.name=='external_url')
         if (!attr) return ""
         if (attr.supported == false) return "" 
         return attr.value
      },
      isUVA: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return false
         if (!pool.attributes) return true
         let attr = pool.attributes.find( a=> a.name=='uva_ils')
         if (!attr) return true
         return attr.supported
      },
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      setPools(state, data) {
         state.list = data
         if (state.list.length == 0) {
            state.system.fatal = "No search pools configured"
         }
      },
   },

   actions: {
      getPools(ctx) {
         ctx.commit("setLookingUp", true)
         let url = ctx.rootState.system.searchAPI + "/api/pools"
         return axios.get(url).then((response) => {
            ctx.commit('setPools', response.data)
            ctx.commit("setLookingUp", false)
         }).catch((error) => {
            ctx.commit('system/setFatal', "Unable to get pools: " + error.response.data, { root: true })
            ctx.commit("setLookingUp", false)
         })
      },
   }
}

export default pools