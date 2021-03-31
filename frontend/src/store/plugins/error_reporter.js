const errorReporter = store => {
   store.subscribe( mutation => {
      if (mutation.type == "system/setError" || mutation.type == "system/setILSError" || mutation.type == "system/setFatal") {
         if (mutation.payload != "" && mutation.payload != {}) {
            let err = mutation.payload
            store.dispatch("system/reportError", err)
         }
      }
   })
}

export default errorReporter