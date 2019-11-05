// Plugin to listen for messages being set. After a delay, clear them
const messaging = store => {
  store.subscribe((mutation) => {
    if (mutation.type === "system/setError") {
      if (mutation.payload != null && mutation.payload != "") {
        setTimeout(() => { store.commit('system/setError', "") }, 10000)
      }
    } 
  })
}

export default messaging