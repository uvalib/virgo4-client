const expiredSessionWatcher = store => {
   store.subscribe( mutation => {
      if (mutation.type == "system/setError") {
         if (mutation.payload.response && mutation.payload.response.status == 401) {
            store.dispatch("user/signout")
         }
      }
   })
}

export default expiredSessionWatcher