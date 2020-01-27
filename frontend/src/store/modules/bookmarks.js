import axios from 'axios'
import router from '../../router'

const bookmarks = {
   namespaced: true,
   state: {
      searching: false,
      public: []
   },

   getters: {
   },

   mutations: {
      setSearching(state, flag) {
         state.searching = flag
      },
      setPublicBookmarks(state, data) {
         state.public.splice(0, state.public.length)
         data.forEach( s => {
            s.details = JSON.parse(s.details)
            state.public.push( s ) 
         })
      },
   },

   actions: {
      async getPublicBookmarks(ctx, token) {
         if (ctx.rootState.system.searchAPI == "") {
            await ctx.dispatch("system/getConfig", null, {root:true})
         }
         ctx.commit('setSearching', true)
         return axios.get(`/api/bookmarks/${token}`).then((response) => {
            ctx.commit('setPublicBookmarks', response.data)
            ctx.commit('setSearching', false)
          }).catch((_error) => {
            ctx.commit('setSearching', false)
            router.push("/not_found")
          })
      },
   }
}

export default bookmarks