import axios from 'axios'

// Plugin to watch for version changes and reload
const versionCheker = (store) => {
   var currBuild = "unknown"
   axios.get("/version").then((response) => {
      currBuild = response.data.build
      store.commit('setError', "this is a test error!")
      setInterval(() => {
         axios.get("/version").then((ckResp) => {
            if (currBuild!= ckResp.data.build) {
               // load without cache
               window.location.reload(true)
             }
         })
      }, 1000*60)
    })
 }

 export default versionCheker