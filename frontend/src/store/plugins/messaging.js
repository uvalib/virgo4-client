// Plugin to listen for messages being set. After a delay, clear them
const messaging = store => {
  store.subscribe((mutation) => {
    if (mutation.type === "setError") {
      if (mutation.payload != null && mutation.payload != "") {
        setTimeout(() => { store.commit('setError', "") }, 10000)
      }
    } else if (mutation.type === "auth/setSignedInUser") {
      setTimeout(() => { store.commit('auth/clearSignInMessage') }, 5000)
    }
  })
}

export default messaging