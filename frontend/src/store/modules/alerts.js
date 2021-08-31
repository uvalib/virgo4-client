import firebase from 'firebase/app'
import 'firebase/database'

const  AlertsStorage = "v4SeenAlerts"

const alerts = {
   namespaced: true,
   state: {
      alertsDB: null,
      regionalAlertsDB:  null,
      alerts: [],
      seenAlerts: [],
      regionalAlerts: [],
   },

   getters: {
      headerAlerts: state => {
         return state.alerts.filter( a => a.severity == "alert4")
      },
      menuAlerts: state => {
         return state.alerts.filter( a => a.severity != "alert4" && !state.seenAlerts.includes(a.uuid))
      },
      alertCount: state => {
         return state.alerts.filter( a => a.severity != "alert4" && !state.seenAlerts.includes(a.uuid)).length
      },
      seenAlertsCount: state => {
         return state.seenAlerts.length
      },
      pageAlerts:  state => tgtPath => {
         let tgtRegex = new RegExp(`${tgtPath}$`)
         let out = []
         state.regionalAlerts.forEach( ra => {
            let urls = ra.url
            if ( !Array.isArray(urls) ) urls = [{value:urls}]
            let matched = false
            urls.some( u => {
               if (tgtPath == "/" && u.value.match(/search.lib.virginia.edu$/) ) {
                  out.push(ra)
                  matched = true
               } else {
                  if ( u.value.match(/search.lib.virginia.edu/) && u.value.match(tgtRegex) ) {
                     out.push(ra)
                     matched = true
                  }
               }
               return matched == true
            })

         })
         return out
      },
   },

   mutations: {
      clearSeenAlerts(state) {
         localStorage.removeItem(AlertsStorage)
         state.seenAlerts.splice(0, state.seenAlerts.length)
      },
      autoHideAlert3(state) {
         let alerts = state.alerts.filter( a => a.severity == "alert3" && !state.seenAlerts.includes(a.uuid))
         alerts.forEach( a=> {
            state.seenAlerts.push(a.uuid)
         })
         let str = JSON.stringify(state.seenAlerts)
         localStorage.setItem(AlertsStorage, str)
      },
      loadSeenAlerts(state) {
         let seen = localStorage.getItem(AlertsStorage)
         if ( seen ) {
            try {
               let needsUpdate = false
               state.seenAlerts.splice(0, state.seenAlerts.length)
               JSON.parse(seen).forEach( saUUID =>  {
                  if ( state.alerts.find(a => a.uuid == saUUID) ) {
                     state.seenAlerts.push(saUUID)
                  } else {
                     needsUpdate = true
                  }
               })
               if (needsUpdate) {
                  let str = JSON.stringify(state.seenAlerts)
                  localStorage.setItem(AlertsStorage, str)
               }
            } catch (e) {
               state.seenAlerts.splice(0, state.seenAlerts.length)
            }
         }
      },
      dismissAlert(state, uuid) {
         state.seenAlerts.push(uuid)
         let str = JSON.stringify(state.seenAlerts)
         localStorage.setItem(AlertsStorage, str)
      },
      unseeAllAlerts(state) {
         state.seenAlerts.splice(0, state.seenAlerts.length)
         localStorage.removeItem(AlertsStorage)
      },
      updateAlerts(state, data) {
         state.alerts.splice(0, state.alerts.length)
         data.forEach(a=>{
            let aVal = a.val()
            if (aVal) {
               state.alerts.push(aVal)
            }
         })
      },
      updateRegionalAlerts(state, data) {
         state.regionalAlerts.splice(0, state.regionalAlerts.length)
         data.forEach(a=>{
            let aVal = a.val()
            if (aVal) {
               state.regionalAlerts.push(aVal)
            }
         })
      },
      initDB(state, cfg) {
         let db = firebase.initializeApp({
            apiKey: cfg.firebase.apiKey,
            authDomain: cfg.firebase.authDomain,
            databaseURL: cfg.firebase.databaseURL,
            projectId: cfg.firebase.projectId,
            appId: cfg.firebase.appId
         }).database()
         state.alertsDB = db.ref('library-alerts')
         state.regionalAlertsDB = db.ref('regionalalerts')
      }
   },

   actions: {
      setConfig(ctx, cfg) {
         if (!cfg.firebase) return

         try {
            ctx.commit("initDB", cfg)
            ctx.state.alertsDB.on('value', (d) => {
               ctx.commit('updateAlerts', d)
               ctx.commit("loadSeenAlerts")
               ctx.commit("autoHideAlert3")
            })
            ctx.state.regionalAlertsDB.on('value', (d) => {
               ctx.commit('updateRegionalAlerts', d)
            })
         } catch(e){
            this.dispatch('system/reportError', e, {root: true})
         }
      },
   }
}

export default alerts
