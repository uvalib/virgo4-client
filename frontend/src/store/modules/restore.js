import { getField } from 'vuex-map-fields'

const restore = {
   namespaced: true,
   state: {
     previousPath: null,

     // Record used for scrolling to bookmark
     recordId: null,
     groupParent: null,
     poolName: null
   },
   getters: {
     getField,
     previousPath: state => {
       if( state.previousPath == '/signedout' ){
         return null
       }
       return state.previousPath
     },
     recordId: state => {
       return state.recordId
     },
     groupParent: state => {
       return state.groupParent
     },
     poolName: state => {
       return state.poolName
     },
     hasPreviousSearch: _state => {
      return localStorage.getItem('previousSearch') != null
     },
     searchData: _state => {
       if (localStorage.getItem('previousSearch')) {
         try {
           return JSON.parse(localStorage.getItem('previousSearch'));
         } catch(e) {
           return null
         }
       } else {
         return null
       }
     },

   },
   mutations: {
     setPreviousPath(state, value) {
       state.previousPath = value
     },

     // Called from bookmark button
     setBookmarkRecord(state, value) {
       state.recordId = value.identifier
       if ( value.groupParent != "") {
         state.groupParent =  value.groupParent
       }
     },
     // Copies bookmark data from localstorage to state
     loadBookmarkData(state, value) {
       state.recordId = value.recordId
       state.groupParent = value.groupParent
       state.poolName = value.poolName
     },
     // Cleans up localStorage, keeps bookmark data
     clearLocalStorage(state) {
       localStorage.removeItem("previousSearch")
       state.previousPath = null
     },
     // cleans up remaining state
     clearAll(state) {
       localStorage.removeItem("previousSearch")
       state.previousPath = null
       state.recordId = null
       state.groupParent = null
       state.poolName = null
     },
   },
   actions: {
      save({ _dispatch, _commit, getters, rootGetters }, fromPath) {

        // skip if you're logged in
        if(rootGetters['user/isSignedIn']) {
          return
        }
        let searchData = rootGetters['query/queryObject']

        // A specific record is set during bookmark sign in
        searchData.recordId = getters.recordId
        searchData.groupParent = getters.groupParent
        searchData.poolName = rootGetters['selectedResults'].pool.id

        searchData.previousPath = fromPath
        searchData.pools = rootGetters['pools/sortedList']
        searchData.numPools = searchData.pools.length
        searchData.resultsIdx = rootGetters['selectedResultsIdx']
        searchData.page = rootGetters['selectedResults'].page
        searchData.filters = rootGetters['filters/poolFilter'](searchData.poolIdx)

        searchData.journalQuery = rootGetters['journals/query']


        localStorage.setItem("previousSearch", JSON.stringify(searchData))
      },

      async fromStorage({ dispatch, commit, getters, rootGetters }){
        try {
          let searchData = getters.searchData
          if (!searchData || searchData.query == "") {
            return
          }

          commit('loadBookmarkData', searchData)

          commit('query/restoreSearch', searchData, {root: true})
          commit('filters/restoreFilters', searchData, {root: true})
          await dispatch("searchAllPools", searchData.page, {root: true})
          commit('setSearching', true, {root: true})

          dispatch("selectPoolResults", searchData.resultsIdx, {root: true})


          if ( rootGetters['filters/hasFilter'], searchData.resultsIdx) {
            await dispatch("searchSelectedPool", null, {root: true})
          }
        } finally {
          commit('clearLocalStorage')
          commit('setSearching', false, {root: true})
        }
      },
      loadJournals(ctx){
        try {
          // skip if you're not logged in, or no searchData
          if(!ctx.rootGetters['user/isSignedIn'] || !ctx.getters.searchData) {
            return
          }

          if (ctx.getters.searchData.journalQuery){
            ctx.commit('journals/setQuery', ctx.getters.searchData.journalQuery, {root: true})
            ctx.dispatch('journals/searchJournals', null, {root: true})
          }
        } finally {
          ctx.commit('clearAll')
        }
      }

   }
}

export default restore
