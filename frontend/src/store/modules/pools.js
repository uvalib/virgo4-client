import axios from 'axios'

const pools = {
   namespaced: true,
   state: {
      list: [],
      lookingUp: false,
   },

   getters: {
      poolDetails: state => id => {
         return state.list.find( p => p.id == id)
      },
      sortedList: state => {
         return state.list.sort( (a,b) => {
            if (a.name < b.name) return -1 
            if (a.name > b.name) return 1 
            return 0
         })
      },
      hasCoverImages: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return false
         if (!pool.attributes) return true
         let attr = pool.attributes.find( a=> a.name=='cover_images')
         if (!attr) return true
         return attr.supported
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

         // NOTE: this assumes all logo assets are seved by the pool and advertised with a 
         // relative URL
         let logo = attr.value
         logo = logo.replace("./", "/")
         return pool.url+logo
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
      courseReserveSupport: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return false
         if (!pool.attributes) return true
         let attr = pool.attributes.find( a=> a.name=='course_reserves')
         if (!attr) return true
         return attr.supported
      },
      findProvider: (state) => (poolID, providerID) => {
         let pool = state.list.find( p => p.id == poolID)
         if (!pool) return {}
         if (!pool.providers) return {}
         let detail = pool.providers.find( p=> p.provider==providerID)
         if (!detail) return {}
         return detail
      },
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      setPools(state, data) {
         if (data.length == 0) {
            state.system.fatal = "No search pools configured"
            state.list.splice(0, state.list.length)
            return
         }

         data.forEach( p => {
            let currIdx = state.list.findIndex(curr => curr.name == p.name  )
            if (currIdx == -1) {
               p.providers = []
               state.list.push(p)    
            }
         })
      },
      setPoolProviders(state, data) {
         let pool = state.list.find(p=> p.id == data.pool)
         pool.providers.splice(0, pool.providers.length)
         data.providers.forEach( prov => {
            pool.providers.push(prov)
         })
      }
   },

   actions: {
      async getPools(ctx) {
         ctx.commit("setLookingUp", true)
         let url = ctx.rootState.system.searchAPI + "/api/pools"
         try {
            let response = await axios.get(url)
            ctx.commit('setPools', response.data)
            ctx.commit("setLookingUp", false)

            ctx.state.list.forEach( async p => {
               try {
                  let response = await axios.get(p.url+"/api/providers")
                  ctx.commit('setPoolProviders', {pool: p.id, providers: response.data.providers})
               } catch (_e) {
                  // NO-OP; this is fine as some pools don't implement providers
               }
            })
         } catch (error)  {
            ctx.commit('system/setFatal', "Unable to get pools: " + error.response.data, { root: true })
            ctx.commit("setLookingUp", false)
         }
      },
   }
}

export default pools