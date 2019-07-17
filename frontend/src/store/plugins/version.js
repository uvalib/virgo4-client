import axios from 'axios'

// Plugin to watch for version changes and reload
const versionCheker = (_store) => {
   var currBuild = "unknown"
   axios.get("/version").then((response) => {
      currBuild = response.data.build
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