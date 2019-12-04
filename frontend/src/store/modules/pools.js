import axios from 'axios'

const pools = {
   namespaced: true,
   state: {
      list: [],
      lookingUp: false,
   },

   getters: {
      sortedList: state => {
         return state.list.sort( (a,b) => {
            if (a.name < b.name) return -1 
            if (a.name > b.name) return 1 
            return 0
         })
      },
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      setPools(state, data) {
         state.list = data
         if (state.list.length == 0) {
            state.system.fatal = "No search pools configured"
         }
      },
   },

   actions: {
      getPools(ctx) {
         ctx.commit("setLookingUp", true)
         let url = ctx.rootState.system.searchAPI + "/api/pools"
         return axios.get(url).then((response) => {
            ctx.commit('setPools', response.data)
            ctx.commit("setLookingUp", false)
         }).catch((error) => {
            ctx.commit('system/setFatal', "Unable to get pools: " + error.response.data, { root: true })
            ctx.commit("setLookingUp", false)
         })
      },
   }
}

export default pools