// Plugin to listen for error messages being set. After a delay, clear them
const errorPlugin = store => {
   store.subscribe((mutation) => {
     if (mutation.type === "setError") {
       if (mutation.payload != null && mutation.payload != "") {
         setTimeout(() => { store.commit('setError', "") }, 10000)
       }
     }
   })
 }

 export default errorPlugin