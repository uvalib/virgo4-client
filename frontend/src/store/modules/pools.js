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
      hasAvailability: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return false
         if (!pool.attributes) return false
         let attr = pool.attributes.find( a=> a.name=='availability')
         if (!attr) return false
         return attr.supported
      },
      itemMessage: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return ""
         if (!pool.attributes) return ""
         let attr = pool.attributes.find( a=> a.name=='item_message')
         if (!attr || attr && attr.supported == false) return ""
         return attr.value
      },
      facetSupport: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return false
         if (!pool.attributes) return true
         let attr = pool.attributes.find( a=> a.name=='facets')
         if (!attr) return true
         return attr.supported
      },
      sortingSupport: (state) => (id) => {
         let pool = state.list.find( p => p.id == id)
         if (!pool) return false
         if (!pool.attributes) return false
         let attr = pool.attributes.find( a=> a.name=='sorting')
         if (!attr) return false
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
      findProvider: (state) => (poolID, providerID) => {
         let pool = state.list.find( p => p.id == poolID)
         if (!pool) return null
         if (!pool.providers) return null
         let detail = pool.providers.find( p=> p.provider==providerID)
         if (!detail) return null
         return detail
      },
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },

      setPools(state, data) {
         // Copy old items to preserve providers lists for each, then wipe out list
         let old = state.list.slice()
         state.list.splice(0, state.list.length)

         // copy new pools into list and add pre-existing providers data
         data.forEach( p => {
            let prior = old.find(op => op.name == p.name  )

            // no providers in new data?
            if ( !(p.providers && p.providers.length > 0) ) {
               if (prior) {
                  p.providers = prior.providers.slice()
               } else {
                  p.providers = []
               }
            } else {
               p.providers.forEach( pp => {
                  if ( pp.logo_url ) {
                     let logo = pp.logo_url
                     logo = logo.replace("./", "/")
                     pp.logo_url =  p.url+logo
                  }
               })
            }

            if (!p.sort_options) {
               p.sort_options=[]
            }
            state.list.push(p)
         })
      },
   },

   actions: {
      async getPools(ctx) {
         ctx.commit("setLookingUp", true)
         if ( ctx.rootState.system.searchAPI.length == 0) {
            await ctx.dispatch('system/getConfig', null, { root: true })
         }

         await axios.get( `${ctx.rootState.system.searchAPI}/api/pools` ).then( response => {
            ctx.commit('setPools', response.data)
            ctx.commit("setLookingUp", false)
            if (ctx.state.list.length == 0) {
               ctx.commit('system/setFatal', "No search sources found", { root: true })
            }
         }).catch ( error => {
            ctx.commit('system/setFatal', error, { root: true })
            ctx.commit("setLookingUp", false)
         })
      },
   }
}

export default pools