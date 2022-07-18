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
      selectedBookmarks: state => {
         return (folderID) => {
            let selected = []
            let folder = state.bookmarks.find( f => f.id == folderID )
            if (folder) {
               folder.bookmarks.forEach( bm => {
                  if (bm.selected) {
                     selected.push(bm)
                  }
               })
            }
            return selected
         }
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
         bmData.forEach( f => {
            f.bookmarks.forEach( bm => {
               bm.details = JSON.parse(bm.details)
               let pn = bm.pool.name
               delete bm.pool
               bm.pool = pn
               bm.selected = false
            })
            f.settingsOpen = false
            this.bookmarks.push(f)
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
            folder.settingsOpen = this.bookmarks[idx].settingsOpen
            this.bookmarks.splice(idx, 1, folder)
         }
      },
      toggleBookmarkSelected(folderID, bmID) {
         let folder = this.bookmarks.find( f => f.id == folderID )
         if (folder) {
            folder.bookmarks.forEach(bm => {
               if ( bm.id == bmID) {
                  bm.selected = !bm.selected
               }
            })
         }
      },
      selectAll(folderID) {
         let folder = this.bookmarks.find( f => f.id == folderID )
         if (folder) {
            folder.bookmarks.forEach( bm => {
               bm.selected = true
            })
         }
      },
      clearAll(folderID) {
         let folder = this.bookmarks.find( f => f.id == folderID )
         if (folder) {
            folder.bookmarks.forEach( bm => {
               bm.selected = false
            })
         }
      },
      toggleBookmarkSettings(folderID) {
         let folder = this.bookmarks.find( f => f.id == folderID )
         if (folder) {
            folder.settingsOpen = !folder.settingsOpen
            if (folder.settingsOpen ) {
               this.bookmarks.forEach( f => {
                  if (f.id != folderID) {
                     f.settingsOpen = false
                  }
               })
            }
         }
      },
      closeOtherSettings(folderID) {
         this.bookmarks.forEach( f => {
            if (f.id != folderID) {
               f.settingsOpen = false
            }
         })
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
            this.bookmarks.sort( (a,b) => {
               if (a.folder > b.folder) return 1
               if (a.folder < b.folder) return -1
               return 0
            })
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
      removeSelectedBookmarks( folderID ) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/${folderID}/delete`
         let folder = this.bookmarks.find( f => f.id == folderID )
         if (!folder) {
            return
         }
         var bookmarkIDs = []
         folder.bookmarks.forEach(bm => {
            if (bm.selected) {
               bookmarkIDs.push(bm.id)
            }
         })
         axios.post(url, {bookmarkIDs: bookmarkIDs}).then((response) => {
            this.updateFolder(response.data)
         }).catch((error) => {
            useSystemStore().setError(error)
         })
      },
      removeBookmark( folderID, bookmarkID ) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/${folderID}/delete`
         axios.post(url, {bookmarkIDs: [bookmarkID]}).then((response) => {
            this.updateFolder(response.data)
         }).catch((error) => {
            useSystemStore().setError(error)
         })
      },
      async manageSelectedBookmarks(data) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let folder = this.bookmarks.find( f => f.id == data.sourceFolderID )
         if (!folder) {
            return
         }
         var bookmarkIDs = []
         folder.bookmarks.forEach(bm => {
            if (bm.selected) {
               bookmarkIDs.push(bm.id)
            }
         })

         let url = `/api/users/${v4UID}/bookmarks/manage`
         let req = {sourceFolderID: data.sourceFolderID, bookmarkIDs: bookmarkIDs, destFolderIDs: data.destFolderIDs}
         return axios.post(url, req).then((response) => {
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
         let folderID = data.folderID
         let folder = this.bookmarks.find( folder => folder.id == folderID)
         folder.bookmarks.forEach( bm=> {
            if (bm.selected) {
               items.push({pool: bm.pool, identifier: bm.identifier} )
            }
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
         let url = system.searchAPI + "/api/export"
         await axios.post(url, req, {responseType: "blob"}).then((response) => {
            const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.ms-excel' }))
            const fileLink = document.createElement('a')
            fileLink.href =  fileURL
            fileLink.setAttribute('download', `bookmarks-${folderName}.xlsx`)
            document.body.appendChild(fileLink)
            fileLink.click()
            window.URL.revokeObjectURL(fileURL)
         }).catch((error) => {
            system.setError(error)
         })
      }
   }
})