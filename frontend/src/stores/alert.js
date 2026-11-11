import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"

// Alerts come from the shared <uvalib-alerts> web component (github.com/uvalib/uvalib-alerts), loaded at runtime
// from the alerts CDN and used headless: it applies the alert rules and pushes live updates; this store only
// mirrors its state so App.vue and MenuBar.vue keep working unchanged.

const AlertsStorage = "v4SeenAlerts"

const EMPTY = Object.freeze({
   alerts: [], headerAlerts: [], menuAlerts: [], menuCount: 0,
   seenAlerts: [], seenCount: 0, regionalAlerts: [], updated: "",
})

// the element lives outside Pinia state so it is never wrapped in a reactive proxy
let element = null
let started = false

export function componentURL(src) {
   const base = src.endsWith("/") ? src : src + "/"
   return new URL("v1/uvalib-alerts.js", base).href
}

export function loadComponent(src) {
   return import(/* @vite-ignore */ componentURL(src))
}

export function _resetForTests() {
   element = null
   started = false
}

export const useAlertStore = defineStore('alert', {
   state: () => ({
      detail: EMPTY,
      version: 0,
      status: "",
   }),

   getters: {
      headerAlerts: state => state.detail.headerAlerts,
      menuAlerts: state => state.detail.menuAlerts,
      menuCount: state => state.detail.menuCount,
      seenCount: state => state.detail.seenCount,
      pageAlerts: state => {
         // NOTE: getters cannot accept params; return a function instead. Reading state.version makes callers
         // re-render when the element reports new alerts.
         return (tgtPath) => {
            state.version
            return element ? element.pageAlerts(tgtPath) : []
         }
      },
   },

   actions: {
      clearSeenAlerts() {
         if (element) {
            element.clearSeen()
         } else {
            localStorage.removeItem(AlertsStorage)
         }
      },
      dismissAlert(uuid) {
         element?.dismiss(uuid)
      },

      async setConfig(cfg, loader = loadComponent) {
         const src = cfg?.alerts?.src
         if (!src || started) return
         started = true
         try {
            await loader(src)
            const el = document.createElement("uvalib-alerts")
            el.setAttribute("headless", "")
            el.setAttribute("storage-key", AlertsStorage)
            el.setAttribute("src", src)
            el.addEventListener("uvalib-alerts-update", (e) => {
               this.detail = e.detail
               this.version++
            })
            el.addEventListener("uvalib-alerts-status", (e) => {
               this.status = e.detail.status
            })
            element = el
            document.body.appendChild(el)
         } catch (e) {
            element = null
            const system = useSystemStore()
            system.reportError(`Unable to load alerts from ${src}: ${e}`)
         }
      },
   }
})
