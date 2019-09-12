import axios from 'axios'

const pools = {
   namespaced: true,
   state: {
      list: [],
      targetPoolURL: "",
      excludePoolURLs: [],
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
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      includeAll(state) {
         state.excludePoolURLs = []
      },
      excludeAll(state) {
         state.excludePoolURLs = []
         state.list.forEach(function (p) {
            state.excludePoolURLs.push(p.url)
         })
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
      setPools(state, data) {
         state.list = data
         if (state.list.length == 0) {
            state.fatal = "No search pools configured"
         }
      },
   },

   actions: {
      getPools(ctx) {
         ctx.commit("setLookingUp", true)
         let url = ctx.rootState.searchAPI + "/api/pools"
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         return axios.get(url).then((response) => {
            ctx.commit('setPools', response.data)
            ctx.commit("setLookingUp", false)
         }).catch((error) => {
            ctx.commit('setFatal', "Unable to get pools: " + error.response.data, { root: true })
            ctx.commit("setLookingUp", false)
         })
      },
   }
}

export default pools