import { defineStore } from 'pinia'

const DefaultSort = "SortRelevance_desc"

export const useSortStore = defineStore('sort', {
	state: () => ({
      pools: [],

      // activeSort is used to drive the sort dropdown on the search
      // results page; it is just a working copy of the data in state.pools that
      // can easily be manipulated with mapFields
      activeSort: DefaultSort,

      // sort order can be set in advanced search. this is the current setting
      preSearchSort: DefaultSort
   }),

   getters: {
      poolSort: (state) => {
         return (poolID) => {
            let ps = state.pools.find( p => p.poolID == poolID)
            if (ps) {
               return ps.sort
            }
            return  {
               sort_id: DefaultSort.split("_")[0],
               order: DefaultSort.split("_")[1]
            }
         }
      },
   },

   actions: {
      setActivePool(poolID) {
         let ps = this.pools.find( p => p.poolID == poolID)
         if ( ps) {
            this.activeSort = `${ps.sort.sort_id}_${ps.sort.order}`
         } else {
            this.activeSort = DefaultSort
         }
      },
      setPoolSort(poolID, sortString) {
         if (!sortString || sortString == "" || sortString === undefined ) {
            return
         }
         let sort = {
            sort_id: sortString.split("_")[0],
            order: sortString.split("_")[1]
         }
         let tgtPool = this.pools.find( p => p.poolID == poolID )
         if (tgtPool) {
            tgtPool.sort = sort
         } else {
            let ps = {poolID: poolID, sort: sort }
            this.pools.push(ps)
         }
      },
      promotePreSearchSort(pools) {
         this.activeSort = this.preSearchSort
         let sort = {
            sort_id: this.preSearchSort.split("_")[0],
            order: this.preSearchSort.split("_")[1]
         }
         pools.forEach( currPool => {
            // if this pool supports the preSearch sort, carry on.
            let hasSort = (currPool.sort_options.findIndex( opt => opt.id == sort.sort_id) > -1)
            if (hasSort) {
               let tgtPool = this.pools.find( p => p.poolID == currPool.poolID )
               if (tgtPool) {
                  tgtPool.sort = sort
               } else {
                  let ps = {poolID: currPool.id, sort: sort }
                  this.pools.push(ps)
               }
            }
         })
      },
      reset() {
         this.$reset()
      },
   }
})
