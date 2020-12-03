import axios from 'axios'
import router from '../../router'

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
            state.saved.push( stripExclude(s) )
         })
         state.history.splice(0, state.history.length)
         data.history.forEach( s => {
            state.history.push( stripExclude(s) )
         })
      },
      clearSavedSearches(state) {
         state.saved.splice(0, state.saved.length)
      },
      clearSearchHistory(state) {
         state.history.splice(0, state.history.length)
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

      updateHistory(ctx) {
         if ( ctx.rootGetters['user/isSignedIn'] ) {
            let searchURL = router.currentRoute.fullPath
            let userID = ctx.rootState.user.signedInUser
            let req = {url: searchURL, history: true}
            try {
               axios.post(`/api/users/${userID}/searches`, req)
            } catch (e) {
               console.error("Unable to save search history: "+e)
               // NO-OP, no history will be saved
            }
         }
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
         axios.delete(`/api/users/${userID}/searches?type=saved`).then((_response) => {
            ctx.commit('clearSavedSearches')
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      },

      clearHistory(ctx, userID) {
         ctx.commit('setLookingUp', true)
         axios.delete(`/api/users/${userID}/searches?type=history`).then((_response) => {
            ctx.commit('clearSearchHistory')
            ctx.commit('setLookingUp', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setLookingUp', false)
          })
      }
   }
}

function stripExclude( url) {
   let idx1 = url.indexOf("&exclude")
   if (idx1 > -1) {
      let idx2 = url.indexOf("&", idx1+1)
      if ( idx2 > -1) {
         url = url.substring(0,idx1)+url.substring(idx2)
      } else {
         url = url.substring(0,idx1)
      }
   }
   return url
}

export default searches
