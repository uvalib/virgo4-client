import axios from 'axios'

const searches = {
   namespaced: true,
   state: {
      saved: [],
      history: [],
      lookingUp: false,
      lastSavedSearchKey: "",
   },

   getters: {
   },

   mutations: {
      setLastSavedSearchKey(state, key) {
         state.lastSavedSearchKey = key
      },
      setSearches(state, data) {
         state.saved.splice(0, state.saved.length)
         data.saved.forEach( s => {
            state.saved.push( s )
         })
         state.history.splice(0, state.history.length)
         data.history.forEach( s => {
            state.history.push( s )
         })
      },
      clear(state) {
         state.saved.splice(0, state.saved.length)
         state.history.splice(0, state.history.length)
      },
      deleteSavedSearch(state, token) {
         let idx = state.saved.findIndex(s => s.token == token)
         if (idx > -1) {
            state.saved.splice(idx,1)
         }
      },
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
   },

   actions: {
      async updateVisibility(ctx, data) {
         ctx.commit('setLookingUp', true)
         if (data.public) {
            await axios.post(`/api/users/${data.userID}/searches/${data.token}/publish`)
         } else {
            await axios.delete(`/api/users/${data.userID}/searches/${data.token}/publish`)
         }
         ctx.commit('setLookingUp', false)
      },

      getAll(ctx, userID) {
         ctx.commit('setLookingUp', true)
         axios.get(`/api/users/${userID}/searches`).then((response) => {
            ctx.commit('setSearches', response.data)
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },

      async save(ctx, data) {
         let resp = await axios.post(`/api/users/${data.userID}/searches`, data)
         ctx.commit('setLastSavedSearchKey', resp.data.token)
      },

      updateHistory(_ctx, data) {
         data.history = true
         axios.post(`/api/users/${data.userID}/searches`, data)
      },

      async delete(ctx, data) {
         try {
            await axios.delete(`/api/users/${data.userID}/searches/${data.token}`)
            ctx.commit('setLastSavedSearchKey', "")
            ctx.commit('deleteSavedSearch', data.token)
         } catch (e) {
            ctx.commit('system/setError', "Unable to delete saved search. Please try again later.", {root: true})
         }
      },

      deleteAll(ctx, userID) {
         ctx.commit('setLookingUp', true)
         axios.delete(`/api/users/${userID}/searches`).then((_response) => {
            ctx.commit('clearSavedSearches')
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      }
   }
}

export default searches
