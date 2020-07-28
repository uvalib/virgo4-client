import axios from 'axios'
import router from '../../router'

const searches = {
   namespaced: true,
   state: {
      templates: [],
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
      clearSavedSearches(state) {
         state.saved.splice(0, state.saved.length)
      },
      clearSearchHistory(state) {
         state.history.splice(0, state.history.length)
      },
      clear(state) {
         state.saved.splice(0, state.saved.length)
         state.history.splice(0, state.history.length)
         state.templates.splice(0, state.templates)
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
      setAdvancedSearchTemplates(state, data) {
         state.templates.splice(0, state.templates.length)
         data.forEach( s => {
            s.template = JSON.parse(s.template)
            state.templates.push( s )
         })
      },
      addAdvancedSearchTemplate(state, item) {
         state.templates.push(item)
      }
   },

   actions: {
      getAdvancedTemplates(ctx, userID) {
         axios.get(`/api/users/${userID}/search_templates`).then((response) => {
            ctx.commit('setAdvancedSearchTemplates', response.data)
          }).catch((error) => {
            console.error(`Unable to get search templates for ${userID}: ${error}`)
          })
      },
      async saveAdvancedSearchTemplate( ctx, data) {
         let req = {name: data.name, template: data.template}
         return axios.post(`/api/users/${data.userID}/search_templates`, req).then((response) => {
            ctx.commit('addAdvancedSearchTemplate', response.data)
            ctx.commit("system/setMessage", `Advanced search template '${data.name}' saved.`, { root: true })
          }).catch((error) => {
            console.error(`Unable to get search templates for ${data.userID}: ${error}`)
            ctx.commit('system/setError', error, { root: true })
          })
      },
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

export default searches
