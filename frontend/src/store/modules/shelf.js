import axios from 'axios'

const shelf = {
   namespaced: true,
   state: {
      lookingUp: false,
      browse: [],
      browseRange: 3
   },

   getters: {
      hasBrowseData: state => {
         return (state.browse.length > 0 && state.lookingUp == false)
      }
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },

      setBrowseDetails(state, data) {
         state.browse.splice(0, state.browse.length)
         data.forEach( b => {
            console.log(b)
            state.browse.push(b)
         })
      },
   },

   actions: {
      async getBrowseData(ctx, centerId) {
         ctx.commit("setLookingUp", true)
         if ( ctx.rootState.system.searchAPI.length == 0) {
            await ctx.dispatch('system/getConfig', null, { root: true })
         }

         let url = `${ctx.rootState.system.shelfBrowseURL}/api/browse/${centerId}?range=${ctx.state.browseRange}`
         await axios.get(url).then((response) => {
            console.log("GOT DATA "+JSON.stringify(response.data.items))
            ctx.commit("setBrowseDetails", response.data.items)
            ctx.commit("setLookingUp", false)
         }).catch((error) => {
            // no negative impact on client; just don't show shelf browse and log error
            ctx.dispatch("system/reportError", error, {root: true})
            ctx.commit("setLookingUp", false)
         })
      },
   }
}

export default shelf