import axios from 'axios'

const pools = {
   namespaced: true,
   state: {
      list: [],
      targetPoolURL: "",
      excludePoolURLs: []
   },

   getters: {
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
      find: state => url => {
         let match = null
         state.list.forEach(function (p) {
            if (p.url == url) {
               match = p
            }
         })
         return match
      }
   },

   mutations: {
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
        let url = ctx.rootState.searchAPI + "/api/pools"
        axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.auth.authToken
        axios.get(url).then((response) => {
          ctx.commit('setPools', response.data)
        }).catch((error) => {
          ctx.commit('setFatal', "Unable to get pools: " + error.response.data, { root: true })
        })
      },
   }
}

export default pools