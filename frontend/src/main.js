import { createApp, markRaw } from 'vue'
import App from './App.vue'
import router from './router'
import V4Button from "@/components/V4Button.vue"
import V4Checkbox from "@/components/V4Checkbox.vue"
import V4Spinner from "@/components/V4Spinner.vue"
import V4Select from "@/components/V4Select.vue"
import V4Modal from "@/components/modals/V4Modal.vue"
import V4Disclosure from "@/components/disclosures/V4Disclosure.vue"
import Confirm from "@/components/modals/Confirm.vue"
import SignInRequired from "@/components/SignInRequired.vue"

import { createPinia } from 'pinia'
const pinia = createPinia()
pinia.use(({ store }) => {
   // all stores can access router with this.router
   store.router = markRaw(router)
})

const app = createApp(App)
app.use(router)
app.use(pinia)

app.component('V4Button', V4Button)
app.component('V4Checkbox', V4Checkbox)
app.component('V4Spinner', V4Spinner)
app.component('V4Select', V4Select)
app.component('V4Modal', V4Modal)
app.component('V4Disclosure', V4Disclosure)
app.component('Confirm', Confirm)
app.component('SignInRequired', SignInRequired)

import veProgress from "vue-ellipse-progress";
app.use(veProgress)

import analytics from './analytics'
app.config.globalProperties.$analytics = analytics

import * as utils from './utils'
app.config.globalProperties.$utils = utils

import '@fortawesome/fontawesome-pro/css/all.css'
import 'purecss'

import VueAnnouncer from '@vue-a11y/announcer'
import '@vue-a11y/announcer/dist/style.css'
app.use(VueAnnouncer, { router })

app.mount('#app')
