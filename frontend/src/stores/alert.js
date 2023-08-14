import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, onValue } from "firebase/database"

const  AlertsStorage = "v4SeenAlerts"

export const useAlertStore = defineStore('alert', {
	state: () => ({
      alertsDB: null,
      regionalAlertsDB:  null,
      alerts: [],
      seenAlerts: [],
      regionalAlerts: [],
   }),

   getters: {
      headerAlerts: state => {
         return state.alerts.filter( a => a.severity == "alert4")
      },
      menuAlerts: state => {
         return state.alerts.filter( a => a.severity != "alert4" && !state.seenAlerts.includes(a.uuid))
      },
      menuCount: state => {
         return state.alerts.filter( a => a.severity != "alert4" && !state.seenAlerts.includes(a.uuid)).length
      },
      seenCount: state => {
         return state.seenAlerts.length
      },
      pageAlerts: state => {
         // NOTE: getters cannot accept params. Instead have the getter return a function that
         // takes a param. The result will not me cached like other getters tho
         return (tgtPath) => {
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
         }
      },
   },

   actions: {
      clearSeenAlerts() {
         localStorage.removeItem(AlertsStorage)
         this.seenAlerts = []
      },
      autoHideAlert3() {
         let alerts = this.alerts.filter( a => a.severity == "alert3" && !this.seenAlerts.includes(a.uuid))
         alerts.forEach( a=> {
            this.seenAlerts.push(a.uuid)
         })
         let str = JSON.stringify(this.seenAlerts)
         localStorage.setItem(AlertsStorage, str)
      },
      loadSeenAlerts() {
         let seen = localStorage.getItem(AlertsStorage)
         if ( seen ) {
            try {
               let needsUpdate = false
               this.seenAlerts.splice(0, this.seenAlerts.length)
               JSON.parse(seen).forEach( saUUID =>  {
                  if ( this.alerts.find(a => a.uuid == saUUID) ) {
                     this.seenAlerts.push(saUUID)
                  } else {
                     needsUpdate = true
                  }
               })
               if (needsUpdate) {
                  let str = JSON.stringify(this.seenAlerts)
                  localStorage.setItem(AlertsStorage, str)
               }
            } catch (e) {
               this.seenAlerts.splice(0, this.seenAlerts.length)
            }
         }
      },
      dismissAlert(uuid) {
         this.seenAlerts.push(uuid)
         let str = JSON.stringify(this.seenAlerts)
         localStorage.setItem(AlertsStorage, str)
      },
      initDB(cfg) {
         const firebaseApp = initializeApp({
            apiKey: cfg.firebase.apiKey,
            authDomain: cfg.firebase.authDomain,
            databaseURL: cfg.firebase.databaseURL,
            projectId: cfg.firebase.projectId,
            appId: cfg.firebase.appId
         })
         let db = getDatabase(firebaseApp)
         this.alertsDB = ref(db, 'library-alerts')   // FOR dev data which includes all types of alerts: library-alerts-dev
         this.regionalAlertsDB = ref(db, 'regionalalerts')
      },

      setConfig(cfg) {
         if (!cfg.firebase) return

         try {
            this.initDB(cfg)
            onValue(this.alertsDB, (data) => {
               this.alerts.splice(0, this.alerts.length)
               data.forEach(a=>{
                  let aVal = a.val()
                  if (aVal) {
                     this.alerts.push(aVal)
                  }
               })
               this.loadSeenAlerts()
               this.autoHideAlert3()
            })
            onValue( this.regionalAlertsDB, (data) => {
               this.regionalAlerts.splice(0, this.regionalAlerts.length)
               data.forEach(a=>{
                  let aVal = a.val()
                  if (aVal) {
                     this.regionalAlerts.push(aVal)
                  }
               })
            })
         } catch(e){
            const system = useSystemStore()
            system.reportError(e)
         }
      },
   }
})
