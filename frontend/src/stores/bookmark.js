import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import axios from 'axios'

export const useBookmarkStore = defineStore('bookmark', {
	state: () => ({
      showAddDialog: false,
      updating: false,
      // Note: only pool, identifier and groupParent are used. Title/Author are for temp display only
      // and will be looked up when bookmark is made
      newBookmark: {pool: "", identifier: null, groupParent: "", title: "", author: ""},
      searching: false,
      public: [],
      bookmarks: [],
   }),

   getters: {
      hasBookmarks: state => {
         if ( state.bookmarks.length === 0) return false
         return true
      },
      bookmarkCount: state => {
         return (pool, identifier) => {
            let count = 0
            state.bookmarks.forEach( folder => {
               folder.bookmarks.forEach( item => {
                  if (item.pool == pool && item.identifier == identifier) {
                     count++
                  }
               })
            })
            return count
         }
      },
      sortedFolders: state => {
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

      showAddBookmark( pool, details ) {
         this.newBookmark = {pool: pool, identifier: details.identifier }

          // normalize the various data sources into a simplified newBookmark struct
          // The sources: search hit header, item details, shelf browse and restored bookmark
         if ( details.groupParent) {
            this.newBookmark.groupParent = details.groupParent
         } else {
            if (details.grouped) {
               this.newBookmark.groupParent = details.group[0].groupParent
            } else if ( details.groupParent ) {
               this.newBookmark.groupParent =  details.groupParent
            }
         }

         // shelf browse has title in top level data, and no author
         // restored also has top level title and possibly top level author
         if (details.title) {
            this.newBookmark.title = details.title
            if ( details.author ) {
               this.newBookmark.author = details.author
            }
         } else {
            // search hits and item details put the title and author in header
            this.newBookmark.title = details.header.title
            if ( details.header.author ) {
               this.newBookmark.author = details.header.author.value.join(details.header.author.separator)
            }
         }

         this.showAddDialog = true
      },

      async addBookmark( folder  ) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/add`
         let data = {folder: folder, pool: this.newBookmark.pool, identifier: this.newBookmark.identifier}
         return axios.post(url, data).then((response) => {
            this.setBookmarks(response.data)
         }).catch((error) => {
            console.error("Bookmark failed: "+error)
            let errTxt = error
            if (error.response && error.response.data) {
               errTxt = error.response.data
            }
            let msg = `Unable to add bookmark for ${this.newBookmark.identifier}: ${errTxt}`
            useSystemStore().setError(msg)
          })
      },

      clearAddBookmark() {
         this.newBookmark = {}
         this.showAddDialog = false
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
            })
            f.settingsOpen = false
            this.bookmarks.push(f)
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
          }).catch(() => {
            this.searching = false
            this.router.push("/not_found")
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
      renameFolder(v4UID, folder) {
         let url = `/api/users/${v4UID}/bookmarks/folders/${folder.id}`
         axios.post(url, {name: folder.name}).then((response) => {
            this.updateFolder(response.data)
         }).catch((error) => {
            useSystemStore().setError(error)
         })
      },
      async removeFolder(v4UID, folderID) {
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
      refreshBookmarksFolder(v4UID, folderID) {
         const system = useSystemStore()
         this.updating = true
         let url = `/api/users/${v4UID}/bookmarks/folders/${folderID}/refresh`
         axios.post(url).then((response) => {
            this.updateFolder(response.data.folder)
            if ( response.data.updated == 0) {
               if ( response.data.missing > 0) {
                  system.setToast("Boomarks Refresh",`${response.data.missing} items are no longer in Virgo.`)
               } else {
                  system.setToast("Boomarks Refresh", "No updates were necessary.")
               }
            } else {
               let msg = `${response.data.updated} bookmarks updated. `
               if ( response.data.missing > 0) {
                  msg +=  `${response.data.missing} items are no longer in Virgo.`
               }
               system.setToast("Boomarks Refresh", msg, 10000)
            }
            this.updating = false
         }).catch((error) => {
            useSystemStore().setError(error)
            this.updating = false
         })
      },
      removeSelectedBookmarks( v4UID, folderID, bookmarkIDs ) {
         let url = `/api/users/${v4UID}/bookmarks/folders/${folderID}/delete`
         axios.post(url, {bookmarkIDs: bookmarkIDs}).then((response) => {
            let tgtFolder = this.bookmarks.find( f => f.id == folderID)
            if (tgtFolder) {
               tgtFolder.bookmarks = tgtFolder.bookmarks.filter( bm => bookmarkIDs.includes( bm.id ) == false)
            }  else {
               this.updateFolder(response.data)
            }
         }).catch((error) => {
            useSystemStore().setError(error)
         })
      },
      reorderFolder( folderID, reorderedBookmarks ) {
         let folder = this.bookmarks.find( f => f.id == folderID)
         if ( !folder ) {
            return
         }

         let seq = 1
         let payload = []
         folder.bookmarks = []
         reorderedBookmarks.forEach( b => {
            b.sequence = seq
            folder.bookmarks.push(b)
            payload.push( {id: b.id, sequence: b.sequence})
            seq++
         })

         const userStore = useUserStore()
         let v4UID = userStore.signedInUser
         let url = `/api/users/${v4UID}/bookmarks/folders/${folder.id}/sort`
         axios.post(url, payload).catch((error) => {
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
      async manageSelectedBookmarks(sourceFolderID, bookmarks, destFolderIDs) {
         const userStore = useUserStore()
         let v4UID = userStore.signedInUser

         var bookmarkIDs = bookmarks.map( bm => bm.id)
         let url = `/api/users/${v4UID}/bookmarks/manage`
         let req = {sourceFolderID: sourceFolderID, bookmarkIDs: bookmarkIDs, destFolderIDs: destFolderIDs}
         return axios.post(url, req).then((response) => {
            this.setBookmarks(response.data)
         }).catch((error) => {
            useSystemStore().setError(error)
         })
      },
      async updateFolderVisibility(folder) {
         try {
            const userStore = useUserStore()
            let usrID = userStore.signedInUser
            if (folder.public) {
               let resp = await axios.post(`/api/users/${usrID}/bookmarks/folders/${folder.id}/publish`)
               folder.token = resp.data
            } else {
               await axios.delete(`/api/users/${usrID}/bookmarks/folders/${folder.id}/publish`)
            }
         } catch (error)  {
            useSystemStore().setError(error)
         }
      },
      async printBookmarks(title, notes, items) {
         // note: items list requires pool and identifier fields
         const system = useSystemStore()
         let req = {title: title, notes: notes, items: items}
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