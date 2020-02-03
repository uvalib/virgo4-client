import { getField } from 'vuex-map-fields'

const restore = {
   namespaced: true,
   state: {
     previousPath: null,

     // Record used for scrolling to bookmark
     recordId: null,
     groupParent: null
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
     pool: state => {
       state.searchData.pool
     },
     hasPreviousSearch: _state => {
       return (typeof localStorage.getItem('previousSearch')) != 'undefined'
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

     setBookmarkRecord(state, value) {
       state.recordId = value.identifier
       if ( value.groupParent != "") {
         state.groupParent =  value.groupParent
       }
     },
     setBookmarkStore(state, value) {
       state.recordId = value.recordId
       state.groupParent = value.groupParent
     },
     clearStorage(state) {
       localStorage.removeItem("previousSearch")
       state.previousPath = null
     },
     clearBookmarkData(state) {
       localStorage.removeItem("previousSearch")
       state.previousPath = null
       state.recordId = null
       state.groupParent = null
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


        searchData.previousPath = fromPath
        searchData.pools = rootGetters['pools/sortedList']
        searchData.numPools = searchData.pools.length
        searchData.resultsIdx = rootGetters['selectedResultsIdx']
        searchData.pool = rootGetters['selectedResults']
        searchData.page = searchData.pool.page
        searchData.filters = rootGetters['filters/poolFilter'](searchData.poolIdx)


        localStorage.setItem("previousSearch", JSON.stringify(searchData))
      },

      async fromStorage({ dispatch, commit, getters, rootGetters }){
        try {
          let searchData = getters.searchData


          if (!searchData || searchData.query == "") {
            return
          }
          commit('setBookmarkStore', searchData)


          commit('query/restoreSearch', searchData, {root: true})
          commit('filters/restoreFilters', searchData, {root: true})
          await dispatch("searchAllPools", searchData.page, {root: true})
          commit('setSearching', true, {root: true})

          await dispatch("selectPoolResults", searchData.resultsIdx, {root: true})


          if ( rootGetters['filters/hasFilter'], searchData.resultsIdx) {
            await dispatch("searchSelectedPool", null, {root: true})
          }
        } finally {
          commit('clearStorage')
        }
      }
   }
}

export default restore
