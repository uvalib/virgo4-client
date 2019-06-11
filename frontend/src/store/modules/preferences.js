const preferences = {
   namespaced: true,
   state: {
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
   },
   mutations: {
      includeAll(state) {
         state.excludePoolURLs = []
      },
      excludeAll(state) {
         state.excludePoolURLs = []
         state.pools.forEach(function (p) {
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
   }
}

export default preferences