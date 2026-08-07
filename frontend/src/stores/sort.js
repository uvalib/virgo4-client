import { defineStore } from 'pinia'

const DefaultSort = "SortRelevance_desc"

export const useSortStore = defineStore('sort', {
	state: () => ({
      pools: new Map(),

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
            if ( poolID == "all") {
               let out = []
               state.pools.forEach( (val,key) => {
                  out.push( {poolID: key, sort: val} )
               })
               return out
            } 

            if ( state.pools.has(poolID) ) {
               return state.pools.get(poolID)
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
         if ( this.pools.has(poolID) ) {
            const ps = this.pools.get(poolID)
            this.activeSort = `${ps.sort_id}_${ps.order}`
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
         this.pools.set(poolID, sort)
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
               this.pools.set(currPool.id, sort)
            }
         })
      },

      reset() {
         this.$reset()
      },
   }
})
