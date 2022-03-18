import { getField, updateField } from 'vuex-map-fields'


const DefaultSort = "SortRelevance_desc"

const sort = {
   namespaced: true,
   state: {
      pools: [],

      // activeSort is used to drive the sort dropdown on the search
      // results page; it is just a working copy of the data in state.pools that
      // can easily be manipulated with mapFields
      activeSort: DefaultSort,

      // sort order can be set in advanced search. this is the current setting
      preSearchSort: DefaultSort
   },

   getters: {
      getField,
      poolSort: (state) => (poolID) => {
         let ps = state.pools.find( p => p.poolID == poolID)
         if (ps) {
            return ps.sort
         }
         return  {
            sort_id: DefaultSort.split("_")[0],
            order: DefaultSort.split("_")[1]
         }
      },
   },

   mutations: {
      updateField,
      setActivePool(state, poolID) {
         let ps = state.pools.find( p => p.poolID == poolID)
         if ( ps) {
            state.activeSort = `${ps.sort.sort_id}_${ps.sort.order}`
         } else {
            state.activeSort = DefaultSort
         }
      },
      setPoolSort(state, data) {
         let sortString = data.sort
         if (!sortString || sortString == "" || data.sort === undefined ) {
            return
         }
         let sort = {
            sort_id: sortString.split("_")[0],
            order: sortString.split("_")[1]
         }
         let tgtPool = state.pools.find( p => p.poolID == data.poolID )
         if (tgtPool) {
            tgtPool.sort = sort
         } else {
            let ps = {poolID: data.poolID, sort: sort }
            state.pools.push(ps)
         }
      },
      promotePreSearchSort(state, pools) {
         state.activeSort = state.preSearchSort
         let sort = {
            sort_id: state.preSearchSort.split("_")[0],
            order: state.preSearchSort.split("_")[1]
         }
         pools.forEach( currPool => {
            // if this pool supports the preSearch sort, carry on.
            let hasSort = (currPool.sort_options.findIndex( opt => opt.id == sort.sort_id) > -1)
            if (hasSort) {
               let tgtPool = state.pools.find( p => p.poolID == currPool.poolID )
               if (tgtPool) {
                  tgtPool.sort = sort
               } else {
                  let ps = {poolID: currPool.id, sort: sort }
                  state.pools.push(ps)
               }
            }
         })
      },
      reset(state) {
         state.activeSort = DefaultSort
         state.preSearchSort = DefaultSort
         state.pools.splice(0, state.pools.length)
      }
   },
   actions: {
      promotePreSearchSort(ctx) {
         ctx.commit("promotePreSearchSort", ctx.rootState.pools.list)
      }
   }
}

export default sort
