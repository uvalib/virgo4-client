import { defineStore } from 'pinia'
import { useSearchStore } from "@/stores/search"


export const useRestoreStore = defineStore('restore', {
	state: () => ({
      url: "/",
      activeRequest: "",
      bookmarkID: "",
      bookmarkFrom: "",
      bookmarkGroupParent: "",
      restoreSaveSearch: false
   }),
   getters: {
      bookmarkTarget: state => {
         return { id: state.bookmarkID, parent: state.bookmarkGroupParent, origin: state.bookmarkFrom}
      },
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
         this.bookmarkID = data.identifier
         this.bookmarkFrom = data.origin
         if ( data.groupParent ) {
            this.bookmarkGroupParent = data.groupParent
         }
      },
      clear() {
         this.$reset()
      },
      save() {
         const saveData = {
            url: this.url,
            activeRequest: this.activeRequest,
            bookmarkID: this.bookmarkID,
            bookmarkFrom: this.bookmarkFrom,
            bookmarkGroupParent: this.bookmarkGroupParent,
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
               this.bookmarkID = data.bookmarkID
               this.bookmarkGroupParent = data.bookmarkGroupParent
               this.bookmarkFrom = data.bookmarkFrom
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
