const errorReporter = store => {
   store.subscribe( mutation => {
      if (mutation.type == "system/setError" || mutation.type == "system/setILSError" || mutation.type == "system/setFatal") {
         if (mutation.payload != "" && mutation.payload != {}) {
            let err = mutation.payload
            if ( typeof err != "string" ) {
               // it is ok to report all non-string errors (except net connectivity problems)
               if (err.toString().includes("Network Error") == false || err.toString().includes("ECONNREFUSED") == false) {
                  store.dispatch("system/reportError", err)
               }
            } else if (err.includes("System error, we regret the inconvenience") == false &&
                       err.includes("Network Error") == false &&
                       err.includes("ECONNREFUSED") == false &&
                       err.includes("Internal Server Error") == false ) {
               // don't report the generic error. The actual error will be reported when it is caught (searchAll/One in index.js)
               store.dispatch("system/reportError", err)
            }
         }
      }
   })
}

export default errorReporter