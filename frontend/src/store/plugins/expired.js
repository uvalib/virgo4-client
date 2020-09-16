const expiredSessionWatcher = store => {
   store.subscribe( mutation => {
      if (mutation.type == "system/setError") {
         if (mutation.payload.response && mutation.payload.response.status == 401) {
            store.dispatch("user/signout", "/")
         }
         if (mutation.payload != "" ) {
            store.dispatch("system/reportError", mutation.payload)
         }
      }
      if (mutation.payload != "" && mutation.payload != {} && (
         mutation.type == "system/setILSError" || mutation.type == "system/setFatal") ) {
         store.dispatch("system/reportError", mutation.payload)
      }
   })
}

export default expiredSessionWatcher