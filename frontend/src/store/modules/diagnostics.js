const diagnostics = {
   namespaced: true,
   state: {
      debugEnabled: false,
      warnEnabled: false,
      showDebug: false,
      showWarn: false,
      debug: {},        // debug info for the overall search
      warnings: [],     // warning info for the oveall search

      // pool specific debug and warning keyed by result index:
      //    [ {debug: {}, warnings: []}, ..., ...]
      poolDiag: [],     
   },

   getters: {
      hasDebug: (state, getters, rootState) => {
         if (state.debugEnabled == false || rootState.searching) return false
         if ( state.poolDiag.length == 0) return false
         let dbg = getters.debugInfo
         return Object.entries(dbg).length
      },
      debugInfo: (state, _getters, rootState) => {
         if ( state.debugEnabled == false || rootState.searching) return {}
         if ( state.poolDiag.length == 0) return {}
         let poolDebug = {}
         if (rootState.currPoolIdx > -1) {
            poolDebug = state.poolDiag[rootState.currPoolIdx].debug
         } 
         return { ...state.debug, ...poolDebug }
      },
      hasWarnings: (state, getters, rootState) => {
         if (state.warnEnabled == false || rootState.searching) return false
         if ( state.poolDiag.length == 0) return false
         let warns = getters.warnings
         return warns.length > 0
      },
      warnings: (state, _getters, rootState) => {
         if (state.warnEnabled == false || rootState.searching) return []
         if ( state.poolDiag.length == 0) return []
         let poolWarn = []
         if (rootState.currPoolIdx > -1) {
            poolWarn = state.poolDiag[rootState.currPoolIdx].warnings
         }
         return state.warnings.concat(poolWarn)
      }
   },

   mutations: {
      setConfig(state, cfg) {
         state.debugEnabled = cfg.showDebug
         state.warnEnabled = cfg.showWarn
      },
      toggleDebug(state) {
         state.showDebug = !state.showDebug
      },
      toggleWarn(state) {
         state.showWarn = !state.showWarn
      },
      setPoolDiagnostics(state, diagPayload) {
         let info = state.poolDiag[diagPayload.poolResultsIdx]
         info.debug = diagPayload.debug
         if (typeof info.debug === "undefined") {
            info.debug = {}
         }
         info.warnings = diagPayload.warnings
         if (typeof info.warnings === "undefined") {
            info.warnings = []
         }
      },
      setSearchDiagnostics(state, results) {
         // NOTE: individual pool results can have a debug property.
         //       This is not handled here; it is just treated as a hit
         //       result property and rendered if present.
         state.debug = results.debug
         state.warnings = results.warnings
         state.poolDiag = []

         // populate an array of pool diagnistics that matches 
         // the results array ordering; an index into results is same 
         // as index into poolDiag 
         results.pool_results.forEach( function(pr) {
            state.poolDiag.push({debug: pr.debug, warnings: pr.warnings})
         })
       },
   }
}

export default diagnostics