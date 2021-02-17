import axios from 'axios'
import router from '../../router'

const bookmarks = {
   namespaced: true,
   state: {
      searching: false,
      public: [],
      bookmarks: [],
   },

   getters: {
      hasBookmarks: state => {
         if ( state.bookmarks.length === 0) return false
         return true
      },

      bookmarks: state => {
         return state.bookmarks
      },

      folders: state => {
         let out = []
         let foundGeneral = false
         state.bookmarks.forEach( (folderObj) => {
            if ( folderObj.folder == "General") {
               foundGeneral = true
            }

            // Add date used info to folder. Default to date folder was created.
            // All bookmarks in a folder come back from server sorted by ascending date added.
            // Pick the latest bookmark from each folder and set that as folder used date.
            let lastUsed = folderObj.addedAt
            if (folderObj.bookmarks.length > 0) {
               lastUsed = folderObj.bookmarks[folderObj.bookmarks.length-1].addedAt
            }
            out.push( {id: folderObj.id, name: folderObj.folder, lastUsed: lastUsed} )
         })

         if (foundGeneral == false ) {
            out.push( {id: 0, name: "General", lastUsed: ""} )
         }

         return out.sort( (a,b) => {
            if (a.lastUsed > b.lastUsed) return -1
            if (a.lastUsed < b.lastUsed) return 1
            return 0
         })
      },
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
      clear: state => {
         state.bookmarks.splice(0, state.bookmarks.length)
         state.public.splice(0, state.public.length)
      },
      // CALLED ONLY FROM BOOKMARKS ACTION
      setBookmarks(state, bookmarks) {
         state.bookmarks.splice(0, state.bookmarks.length)
         bookmarks.forEach( b => {
            b.bookmarks.forEach( d => {
               d.details = JSON.parse(d.details)
            })
            state.bookmarks.push(b)
         })
      },
      toggleFolderVisibility(state, folderVisibility) {
         state.bookmarks.forEach( f => {
            if ( f.id == folderVisibility.id ) {
               f.public = folderVisibility.public
            }
         })
      },
      setFolderToken(state, data) {
         state.bookmarks.forEach( f => {
            if ( f.id == data.id ) {
               f.token = data.token
            }
         })
      },
   },

   actions: {
      async getPublicBookmarks(ctx, token) {
         ctx.commit('setSearching', true)
         return axios.get(`/api/bookmarks/${token}`).then((response) => {
            ctx.commit('setPublicBookmarks', response.data)
            ctx.commit('setSearching', false)
          }).catch((_error) => {
            ctx.commit('setSearching', false)
            router.push("/not_found")
          })
      },
      async getBookmarks(ctx) {
         if (ctx.getters.hasBookmarks) {
            return
         }
         let v4UID = ctx.rootState.user.signedInUser
         if ( v4UID) {
            ctx.commit('setSearching', true)
            return axios.get(`/api/users/${v4UID}/bookmarks`).then((response) => {
               ctx.commit('setBookmarks', response.data)
               ctx.commit('setSearching', false)
            }).catch((error) => {
               ctx.commit('system/setError', error, { root: true })
               ctx.commit('setSearching', false)
            })
         }
      },

      // bmData Fields: Folder, Pool, ID, Title. Author optional
      async addBookmark(ctx, bmData ) {
         let v4UID = ctx.rootState.user.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/items`
         let data = {folder: bmData.folder, pool: bmData.pool, identifier: bmData.identifier}
         let detail = {title : bmData.title, author: bmData.author}
         data['details'] = JSON.stringify(detail)
         return axios.post(url, data).then((response) => {
            ctx.commit('setBookmarks', response.data)
         })
      },

      addFolder(ctx, folder) {
         let v4UID = ctx.rootState.user.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders`
         return axios.post(url, {name: folder}).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
      renameFolder(ctx, folder) {
         let v4UID = ctx.rootState.user.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/${folder.id}`
         axios.post(url, {name: folder.name}).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
      async removeFolder(ctx, folderID) {
         let v4UID = ctx.rootState.user.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/${folderID}`
         try {
            let response = await axios.delete(url)
            ctx.commit('setBookmarks', response.data)
         } catch(error)  {
            ctx.commit('system/setError', error, { root: true })
         }
      },
      removeBookmarks(ctx, bookmarks) {
         let v4UID = ctx.rootState.user.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/delete`
         axios.post(url, {bookmarkIDs: bookmarks}).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
      moveBookmarks(ctx, data) {
         let v4UID = ctx.rootState.user.signedInUser
         let bookmarkIDs = data.bookmarks
         let folderID = data.folderID
         let url = `/api/users/${v4UID}/bookmarks/move`
         axios.post(url, {folderID: folderID, bookmarkIDs: bookmarkIDs}).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
      },
      async toggleFolderVisibility(ctx, folderVisibility) {
         ctx.commit('toggleFolderVisibility', folderVisibility)
         try {
            let usrID = ctx.rootState.user.signedInUser
            if (folderVisibility.public) {
               let resp = await axios.post(`/api/users/${usrID}/bookmarks/folders/${folderVisibility.id}/publish`)
               folderVisibility.token = resp.data
               ctx.commit('setFolderToken', folderVisibility)
            } else {
               axios.delete(`/api/users/${usrID}/bookmarks/folders/${folderVisibility.id}/publish`)
            }
         } catch (error)  {
            ctx.commit('system/setError', error, { root: true })
         }
      },
      async printBookmarks(ctx, data) {
         let items = []
         let bookmarkIDs = data.bookmarkIDs
         let folderID = data.folderID
         let folder = ctx.state.bookmarks.find( folder => folder.id == folderID)
         bookmarkIDs.forEach( bid => {
            let bm = folder.bookmarks.find( bm => bm.id == bid)
            items.push( {pool: bm.pool, identifier: bm.identifier} )
         })
         let req = {title: data.title, notes: data.notes, items: items}
         let url = ctx.rootState.system.searchAPI + "/api/pdf"
         await axios.post(url, req, {responseType: "blob"}).then((response) => {
            let blob = new Blob([response.data], { type: response.headers['content-type'] })
            let href = window.URL.createObjectURL(blob)
            window.open(href)

            // if using dowload.js
            // const content = response.headers['content-type'];
            // download(response.data, "results.pdf", content)
         }).catch((error) => {
             // no negative impact on client; just don't show shelf browse and log error
             ctx.dispatch("system/reportError", error, {root: true})
         })
      }
   }
}

export default bookmarks