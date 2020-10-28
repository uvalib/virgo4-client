const expiredSessionWatcher = store => {
   store.subscribe( mutation => {
      if (mutation.type == "system/setError") {
         if (mutation.payload.response && mutation.payload.response.status == 401) {
            store.dispatch("user/signout")
         }

         // payload = "" is clearing the error; don't report that
         if (mutation.payload != "") {
            let err = mutation.payload
            if ( typeof err != "string" ) {
               // it is ok to report all non-string errors
               store.dispatch("system/reportError", err)
            } else if (err.includes("System error, we regret the inconvenience") == false ) {
               // don't report the generic error. The actual error will be reported when it is caught (searchAll/One in index.js)
               store.dispatch("system/reportError", err)
            }
         }
      }
      if (mutation.payload != "" && mutation.payload != {} && (
         mutation.type == "system/setILSError" || mutation.type == "system/setFatal") ) {
         store.dispatch("system/reportError", mutation.payload)
      }
   })
}

export default expiredSessionWatcher