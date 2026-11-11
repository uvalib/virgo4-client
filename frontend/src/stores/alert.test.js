import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAlertStore, componentURL, _resetForTests } from '@/stores/alert'
import { useSystemStore } from '@/stores/system'

const SRC = 'https://alerts.test/'
const site = (uuid, severity) => ({ uuid, title: uuid, body: `<p>${uuid}</p>`, severity })

// Minimal stand-in for <uvalib-alerts>: records calls and lets the test push updates.
class FakeAlerts extends HTMLElement {
   constructor() {
      super()
      this.dismiss = vi.fn()
      this.clearSeen = vi.fn()
      this.pageList = []
      this.pageAlerts = vi.fn(() => this.pageList)
   }
   push(detail) {
      this.dispatchEvent(new CustomEvent('uvalib-alerts-update', { detail, bubbles: true, composed: true }))
   }
}
if (!customElements.get('uvalib-alerts')) customElements.define('uvalib-alerts', FakeAlerts)

const okLoader = vi.fn(async () => ({}))
const cfg = { alerts: { src: SRC } }
const el = () => document.querySelector('uvalib-alerts')
const flush = () => new Promise(r => setTimeout(r, 0))

const detail = (alerts, seen) => {
   const menuAlerts = alerts.filter(a => a.severity !== 'alert4' && !seen.includes(a.uuid))
   return {
      alerts, headerAlerts: alerts.filter(a => a.severity === 'alert4'), menuAlerts, menuCount: menuAlerts.length,
      seenAlerts: seen, seenCount: seen.length, regionalAlerts: [], updated: '2026-11-11T00:00:00Z',
   }
}

beforeEach(() => {
   setActivePinia(createPinia())
   _resetForTests()
   document.body.innerHTML = ''
   localStorage.clear()
   okLoader.mockClear()
})
afterEach(() => vi.restoreAllMocks())

describe('alert store on <uvalib-alerts>', () => {
   it('mirrors updates into the existing getters', async () => {
      const store = useAlertStore()
      await store.setConfig(cfg, okLoader)
      el().push(detail([site('h', 'alert4'), site('c', 'alert1'), site('w', 'alert2')], ['w']))
      expect(store.headerAlerts.map(a => a.uuid)).toEqual(['h'])
      expect(store.menuAlerts.map(a => a.uuid)).toEqual(['c'])
      expect(store.menuCount).toBe(1)
      expect(store.seenCount).toBe(1)
   })

   it('creates one headless element with Virgo storage key and src', async () => {
      const store = useAlertStore()
      await store.setConfig(cfg, okLoader)
      await store.setConfig(cfg, okLoader)
      const all = document.querySelectorAll('uvalib-alerts')
      expect(all.length).toBe(1)
      expect(all[0].hasAttribute('headless')).toBe(true)
      expect(all[0].getAttribute('src')).toBe(SRC)
      expect(okLoader).toHaveBeenCalledTimes(1)
      expect(okLoader).toHaveBeenCalledWith(SRC)
   })

   it("uses Virgo's existing storage key", async () => {
      await useAlertStore().setConfig(cfg, okLoader)
      expect(el().getAttribute('storage-key')).toBe('v4SeenAlerts')
   })

   it('dismissAlert and clearSeenAlerts call the element', async () => {
      const store = useAlertStore()
      await store.setConfig(cfg, okLoader)
      store.dismissAlert('w')
      store.clearSeenAlerts()
      expect(el().dismiss).toHaveBeenCalledWith('w')
      expect(el().clearSeen).toHaveBeenCalledTimes(1)
   })

   it('pageAlerts recomputes after an update', async () => {
      const store = useAlertStore()
      await store.setConfig(cfg, okLoader)
      const page = computed(() => store.pageAlerts('/search').map(a => a.uuid))
      expect(page.value).toEqual([])
      el().pageList = [site('r', 'alert2')]
      el().push(detail([], []))
      expect(page.value).toEqual(['r'])
      expect(el().pageAlerts).toHaveBeenLastCalledWith('/search')
   })

   it('dismiss and clear before the element loads are safe', async () => {
      const store = useAlertStore()
      localStorage.setItem('v4SeenAlerts', '["x"]')
      store.setConfig(cfg, () => new Promise(() => {}))
      expect(() => store.dismissAlert('x')).not.toThrow()
      expect(() => store.clearSeenAlerts()).not.toThrow()
      expect(localStorage.getItem('v4SeenAlerts')).toBeNull()
      expect(store.pageAlerts('/')).toEqual([])
   })

   it('Virgo works without alerts when the component cannot load', async () => {
      const unhandled = vi.fn()
      process.on('unhandledRejection', unhandled)
      const system = useSystemStore()
      const report = vi.spyOn(system, 'reportError').mockImplementation(() => {})
      const store = useAlertStore()
      await store.setConfig(cfg, async () => { throw new TypeError('Failed to fetch dynamically imported module') })
      await flush()
      process.off('unhandledRejection', unhandled)
      expect(report).toHaveBeenCalledTimes(1)
      expect(unhandled).not.toHaveBeenCalled()
      expect(store.headerAlerts).toEqual([])
      expect(store.menuCount).toBe(0)
      expect(store.pageAlerts('/')).toEqual([])
      expect(document.querySelector('uvalib-alerts')).toBeNull()
   })

   it('a bundle that does not define the element is a load failure and sign-out still works', async () => {
      const system = useSystemStore()
      const report = vi.spyOn(system, 'reportError').mockImplementation(() => {})
      const store = useAlertStore()
      const defined = customElements.get('uvalib-alerts')
      vi.spyOn(customElements, 'get').mockImplementation(name => (name === 'uvalib-alerts' ? undefined : defined))
      await store.setConfig(cfg, okLoader)
      expect(report).toHaveBeenCalledTimes(1)
      expect(document.querySelector('uvalib-alerts')).toBeNull()
      localStorage.setItem('v4SeenAlerts', '["x"]')
      expect(() => store.clearSeenAlerts()).not.toThrow()
      expect(() => store.dismissAlert('x')).not.toThrow()
      expect(localStorage.getItem('v4SeenAlerts')).toBeNull()
   })

   it('does nothing when alerts are not configured', async () => {
      const store = useAlertStore()
      await store.setConfig({}, okLoader)
      expect(okLoader).not.toHaveBeenCalled()
      expect(document.querySelector('uvalib-alerts')).toBeNull()
   })

   it('componentURL builds the versioned script URL', () => {
      expect(componentURL('https://x.test/')).toBe('https://x.test/v1/uvalib-alerts.js')
      expect(componentURL('https://x.test')).toBe('https://x.test/v1/uvalib-alerts.js')
   })
})
