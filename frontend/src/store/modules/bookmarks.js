import axios from 'axios'
import router from '../../router'

const bookmarks = {
   namespaced: true,
   state: {
      searching: false,
      public: [],
      bookmarks: [],
      newBookmarkInfo: null,
   },

   getters: {
      hasBookmarks: state => {
         if ( state.bookmarks == null ) return false 
         if ( state.bookmarks.length === 0) return false
         return true
      },
      bookmarks: state => {
         if ( state.bookmarks == null ) return []
         return state.bookmarks
      },
      folders: state => {
         if ( state.bookmarks == null ) return []
         let out = []
         let foundGeneral = false
         state.bookmarks.forEach( (folderObj) => {
            if ( folderObj.folder == "General") {
               foundGeneral = true
            }
            out.push( {id: folderObj.id, name: folderObj.folder} )
         })
         if (foundGeneral == false ) {
            out.push( {id: 0, name: "General"} )
         }
         return out.sort( (a,b) => {
            if (a.name < b.name) return -1 
            if (a.name > b.name) return 1 
            return 0
         })
      },
      addingBookmark: state => {
         return state.newBookmarkInfo != null
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
      showAddBookmark(state, bookmarkData) {
         state.newBookmarkInfo = bookmarkData
      },
      closeAddBookmark(state) {
         state.newBookmarkInfo = null
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
      async getBookmarks(ctx) {
         ctx.commit('setSearching', true)
         if (ctx.rootGetters["user/hasAccountInfo"] == false) {
            await ctx.dispatch("user/getAccountInfo", null, { root: true })
         }
         let v4UID = ctx.rootState.user.signedInUser
         return axios.get(`/api/users/${v4UID}/bookmarks`).then((response) => {
            ctx.commit('setBookmarks', response.data)
            ctx.commit('setSearching', false)
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setSearching', false)
          })
      },
      addBookmark(ctx, folder ) {
         let v4UID = ctx.rootState.user.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/items`
         let bm = ctx.state.newBookmarkInfo
         let data = {folder: folder, pool: bm.pool, identifier: bm.data.identifier}

         // required details: title, author, call number, location, library, availability
         let author = "" 
         if  (bm.data.header.author) {
            author = bm.data.header.author.value.join(", ")
         }
         let detail = {title :bm.data.header.title, author: author}
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
      removeFolder(ctx, folderID) {
         let v4UID = ctx.rootState.user.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/${folderID}`
         axios.delete(url).then((response) => {
            ctx.commit('setBookmarks', response.data)
         }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
         })
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
      }
   }
}

export default bookmarks