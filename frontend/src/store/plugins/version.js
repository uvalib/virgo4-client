import axios from 'axios'

// Plugin to watch for version changes and reload
const versionChecker = (store) => {
   var currBuild = "unknown"
   axios.get("/version").then((response) => {
      currBuild = response.data.build
      setInterval(() => {
         axios.get("/version").then((ckResp) => {
            if (currBuild!= ckResp.data.build) {
               // load without cache
               window.location.reload(true)
            } else {
               if (store.state.system.fatal != "") {
                  store.commit('system/setFatal', "")
               }
            }
         }).catch((_error) => {
            store.commit('system/setFatal', "Lost connection to Virgo backend services")
         })
      }, 1000*60)
    })
 }

 export default versionChecker