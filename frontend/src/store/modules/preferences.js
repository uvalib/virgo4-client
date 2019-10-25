import axios from 'axios'

const preferences = {
   namespaced: true,
   state: {
      targetPoolURL: "",
      excludePoolURLs: [],
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
   },

   mutations: {
      setPreferences(state, prefsStr) {
         let json = JSON.parse(prefsStr)
         state.targetPoolURL = json.targetPoolURL
         state.excludePoolURLs = json.excludePoolURLs
      },
      clear(state) {
         state.targetPoolURL = ""
         state.excludePoolURLs = []
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
   },

   actions: {
      toggleTargetPool(ctx, tgtURL) {
         ctx.commit("toggleTargetPool", tgtURL)
         let url = `/api/users/${ctx.rootState.user.signedInUser}/preferences`
         let data = {targetPoolURL: ctx.state.targetPoolURL, 
            excludePoolURLs: ctx.state.excludePoolURLs
         }
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         axios.post(url, data)
      },
      toggleExcludePool(ctx, tgtURL) {
         ctx.commit("toggleExcludePool", tgtURL)
         let url = `/api/users/${ctx.rootState.user.signedInUser}/preferences`
         let data = {targetPoolURL: ctx.state.targetPoolURL, 
            excludePoolURLs: ctx.state.excludePoolURLs
         }
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         axios.post(url, data)
      }
   }
}

export default preferences