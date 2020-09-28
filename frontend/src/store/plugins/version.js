import axios from 'axios'

// Plugin to watch for version changes and prompt for a reload
const versionChecker = (store) => {
   if (store.state.system.versionIntervalID != -1) {
      clearInterval(store.state.system.versionIntervalID)
   }
   var currBuild = "unknown"
   let tid = setInterval(() => {
      axios.get("/version").then((response) => {
         if ( currBuild == "unknown" ) {
            currBuild = response.data.build
         }
         else if (currBuild != response.data.build) {
            store.commit('system/newVersionDetected')
         }
      }).catch((error) => {
         // no need to show a big error box; just try again later. If there is
         // really a connectivity problem, other calls will fail and provide more information
         console.error("Version check failed "+ JSON.stringify(error))
      })
   }, 1000*60*5)
   store.commit("system/setVersionIntervalID", tid)
 }

 export default versionChecker