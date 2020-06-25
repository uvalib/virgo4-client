const restore = {
   namespaced: true,
   state: {
      url: "/",
      activeRequest: "",
      bookmarkID: "",
      bookmarkGroupParent: "",
      restoreSaveSearch: false
   },
   getters: {
      bookmarkTarget: state => {
         return { id: state.bookmarkID, parent: state.bookmarkGroupParent}
      },
   },
   mutations: {
      setURL(state, url) {
         let ignoredPaths = ['/signedout', '/signin', '/forbidden']
         if (ignoredPaths.includes(url)){
           state.url = '/search'
         } else {
           state.url = url
         }
      },
      setActiveRequest(state, nextPanel) {
         state.activeRequest = nextPanel
      },
      setRestoreSaveSearch(state) {
         state.restoreSaveSearch = true
      },
      setBookmarkRecord(state, hit) {
         state.bookmarkID = hit.identifier
         if ( hit.groupParent ) {
            state.bookmarkGroupParent = hit.groupParent
         }
      },
      clear(state) {
         state.url = "/"
         state.activeRequest = ""
         state.bookmarkID = ""
         state.bookmarkGroupParent = ""
         state.restoreSaveSearch = false
      },
      save( state ) {
         let str = JSON.stringify(state)
         localStorage.setItem("v4Cache", str)
      },
      load( state ) {
         let restored = localStorage.getItem('v4Cache')
         if (restored ) {
            try {
               let data = JSON.parse(restored)
               state.url = data.url
               state.activeRequest = data.activeRequest
               state.bookmarkID = data.bookmarkID
               state.bookmarkGroupParent = data.bookmarkGroupParent
               state.restoreSaveSearch = data.restoreSaveSearch
            } catch (e) {
               // NO-OP; just nothing to be restored
            }
         }
         localStorage.removeItem("v4Cache")
      }
   }
}

export default restore
