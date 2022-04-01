import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import axios from 'axios'

export const useBookmarkStore = defineStore('bookmark', {
	state: () => ({
      searching: false,
      public: [],
      bookmarks: [],
   }),

   getters: {
      hasBookmarks: state => {
         if ( state.bookmarks.length === 0) return false
         return true
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

   actions: {
      clear() {
         this.$reset()
      },
      setPublicBookmarks(data) {
         this.public.splice(0, this.public.length)
         data.forEach( s => {
            s.details = JSON.parse(s.details)
            this.public.push( s )
         })
      },
      setBookmarks(bmData) {
         this.bookmarks.splice(0, this.bookmarks.length)
         bmData.forEach( b => {
            b.bookmarks.forEach( d => {
               d.details = JSON.parse(d.details)
               let pn = d.pool.name
               delete d.pool
               d.pool = pn
            })
            this.bookmarks.push(b)
         })
      },
      setFolderToken(data) {
         this.bookmarks.forEach( f => {
            if ( f.id == data.id ) {
               f.token = data.token
            }
         })
      },
      updateFolder(folder) {
         folder.bookmarks.forEach( b => {
            b.details = JSON.parse(b.details)
            let pn = b.pool.name
            delete b.pool
            b.pool = pn
         })
         var idx = this.bookmarks.findIndex( f => f.id == folder.id)
         if (idx > -1) {
            this.bookmarks.splice(idx, 1, folder)
         }
      },

      async getPublicBookmarks(token) {
         this.searching = true
         return axios.get(`/api/bookmarks/${token}`).then((response) => {
            this.setPublicBookmarks(response.data.bookmarks)
            useSystemStore().pageTitle = response.data.folder
            this.searching = false
          }).catch((error) => {
             console.error(error)
            this.searching = false
            this.router.push("/not_found")
          })
      },

      // bmData Fields: Folder, Pool, ID, Title. Author optional
      async addBookmark(bmData ) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/add`
         let data = {folder: bmData.folder, pool: bmData.pool, identifier: bmData.identifier}
         let detail = {title : bmData.title, author: bmData.author}
         data['details'] = JSON.stringify(detail)
         return axios.post(url, data).then((response) => {
            this.setBookmarks(response.data)
         })
      },

      async addFolder(folder) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/add`
         return axios.post(url, {name: folder}).then((response) => {
            this.bookmarks.splice(0, 0, response.data)
         }).catch((error) => {
            useSystemStore().setError(error)
         })
      },
      renameFolder(folder) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/${folder.id}`
         axios.post(url, {name: folder.name}).then((response) => {
            this.updateFolder(response.data)
         }).catch((error) => {
            useSystemStore().setError(error)
         })
      },
      async removeFolder(folderID) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/${folderID}`
         try {
            await axios.delete(url)
            var idx = this.bookmarks.findIndex( f => f.id == folderID)
            if (idx > -1) {
               this.bookmarks.splice(idx, 1)
            }
         } catch(error)  {
            useSystemStore().setError(error)
         }
      },
      removeBookmarks( folderID, bookmarkIDs) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/${folderID}/delete`
         axios.post(url, {bookmarkIDs: bookmarkIDs}).then((response) => {
            this.updateFolder(response.data)
         }).catch((error) => {
            useSystemStore().setError(error)
         })
      },
      moveBookmarks(data) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let bookmarkIDs = data.bookmarks
         let folderID = data.folderID
         let url = `/api/users/${v4UID}/bookmarks/move`
         axios.post(url, {folderID: folderID, bookmarkIDs: bookmarkIDs}).then((response) => {
            this.setBookmarks(response.data)
         }).catch((error) => {
            useSystemStore().setError(error)
         })
      },
      async toggleFolderVisibility(folderVisibility) {
         this.bookmarks.forEach( f => {
            if ( f.id == folderVisibility.id ) {
               f.public = folderVisibility.public
            }
         })
         try {
            const userStore = useUserStore()
            let usrID = userStore.signedInUser
            if (folderVisibility.public) {
               let resp = await axios.post(`/api/users/${usrID}/bookmarks/folders/${folderVisibility.id}/publish`)
               folderVisibility.token = resp.data
               this.setFolderToken(folderVisibility)
            } else {
               axios.delete(`/api/users/${usrID}/bookmarks/folders/${folderVisibility.id}/publish`)
            }
         } catch (error)  {
            useSystemStore().setError(error)
         }
      },
      async printBookmarks(data) {
         let items = []
         let bookmarkIDs = data.bookmarkIDs
         let folderID = data.folderID
         let folder = this.bookmarks.find( folder => folder.id == folderID)
         bookmarkIDs.forEach( bid => {
            let bm = folder.bookmarks.find( bm => bm.id == bid)
            items.push( {pool: bm.pool, identifier: bm.identifier} )
         })

         const system = useSystemStore()
         let req = {title: data.title, notes: data.notes, items: items}
         let url = system.searchAPI + "/api/pdf"
         await axios.post(url, req, {responseType: "blob"}).then((response) => {
            let blob = new Blob([response.data], { type: response.headers['content-type'] })
            let href = window.URL.createObjectURL(blob)
            window.open(href)
         }).catch((error) => {
             system.setError(error)
         })
      },
      async exportBookmarks(folderName) {
         let items = []
         let folder = this.bookmarks.find( bmf => bmf.folder == folderName )
          folder.bookmarks.forEach( bm =>{
            items.push( {pool: bm.pool, identifier: bm.identifier} )
         })

         const system = useSystemStore()
         let v4URL = window.location.href.replace("/bookmarks", "")
         let req = {title: folderName, notes: v4URL, items: items}
         let url = system.searchAPI + "/api/csv"
         await axios.post(url, req, {responseType: "blob"}).then((response) => {
            const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
            const fileLink = document.createElement('a')
            fileLink.href =  fileURL
            fileLink.setAttribute('download', `bookmarks-${folderName}.csv`)
            document.body.appendChild(fileLink)
            fileLink.click()
            window.URL.revokeObjectURL(fileURL)
         }).catch((error) => {
            system.setError(error)
         })
      }
   }
})