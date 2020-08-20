import { getField, updateField } from 'vuex-map-fields'


const DefaultSort = "SortRelevance_desc"

const sort = {
   namespaced: true,
   state: {
      pools: [],

      // activeSort is used to drive the sort dropdown on the search
      // results page; it is just a working copy of the data in state.pools that
      // can easily be manipulated with mapFields
      activeSort: DefaultSort
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
         state.activeSort = DefaultSort
         let ps = state.pools.find( p => p.poolID == poolID)
         if ( ps) {
            state.activeSort = `${ps.sort.sort_id}_${ps.sort.order}`
         }
      },
      setPoolSort(state, data) {
         let sortString = data.sort
         if (!sortString || sortString == "") {
            sortString = DefaultSort
         }
         let sort = {
            sort_id: sortString.split("_")[0],
            order: sortString.split("_")[1]
         }
         let poolSortIdx = state.pools.findIndex( p => p.poolID == data.poolID )
         if (poolSortIdx > -1) {
            let ps = state.pools[poolSortIdx]
            ps.sort = sort
            state.pools.splice(poolSortIdx,1)
            state.pools.push(ps)
         } else {
            let ps = {poolID: data.poolID, sort: sort }
            state.pools.push(ps)
         }
      },
      reset(state) {
         state.activeSort = DefaultSort
         state.pools.splice(0, state.pools.length)
      }
   },
   actions: {
   }
}

export default sort
