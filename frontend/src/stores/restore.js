import { defineStore } from 'pinia'
import { useSearchStore } from "@/stores/search"
import { useRequestStore } from "@/stores/request"

export const useRestoreStore = defineStore('restore', {
	state: () => ({
      url: "/",
      activeRequest: "",
      pendingBookmark: null,
      restoreSaveSearch: false
   }),
   getters: {
   },
   actions: {
      setURL(url) {
         let ignoredPaths = ['/signedout', '/signin', '/forbidden']
         if (ignoredPaths.includes(url)){
           this.url = '/search'
         } else {
           this.url = url
         }
      },
      setActiveRequest(nextPanel) {
         this.activeRequest = nextPanel
      },
      setRestoreSaveSearch() {
         this.restoreSaveSearch = true
      },
      setBookmarkRecord(data) {
         this.pendingBookmark = data
      },
      clear() {
         this.$reset()
      },
      save() {
         const saveData = {
            url: this.url,
            activeRequest: this.activeRequest,
            pendingBookmark: this.pendingBookmark,
            restoreSaveSearch: this.restoreSaveSearch
         }
         const str = JSON.stringify(saveData)
         localStorage.setItem("v4Cache", str)
      },
      load() {
         let restored = localStorage.getItem('v4Cache')
         if (restored ) {
            try {
               let data = JSON.parse(restored)
               this.url = data.url
               this.activeRequest = data.activeRequest
               if ( this.activeRequest != "none") {
                  const request = useRequestStore()
                  request.activePanel = this.activeRequest
               }
               this.pendingBookmark = data.pendingBookmark
               this.restoreSaveSearch = data.restoreSaveSearch
               if ( this.restoreSaveSearch ) {
                  const searches = useSearchStore()
                  searches.showSaveDialog = true
               }
            } catch (e) {
               // NO-OP; just nothing to be restored
            }
         }
         localStorage.removeItem("v4Cache")
      }
   }
})
