import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueClipboard from 'vue3-clipboard'
import V4Button from "@/components/V4Button"
import V4Checkbox from "@/components/V4Checkbox"
import V4Spinner from "@/components/V4Spinner"
import V4Select from "@/components/V4Select"
import V4Modal from "@/components/modals/V4Modal"
import V4Disclosure from "@/components/disclosures/V4Disclosure"
import Confirm from "@/components/modals/Confirm"
import SignInRequired from "@/components/SignInRequired"


// provide store access to the router and router to store
store.router = router
router.store = store

const app = createApp(App)
app.use(router)
app.use(store)

app.component('V4Button', V4Button)
app.component('V4Checkbox', V4Checkbox)
app.component('V4Spinner', V4Spinner)
app.component('V4Select', V4Select)
app.component('V4Modal', V4Modal)
app.component('V4Disclosure', V4Disclosure)
app.component('Confirm', Confirm)
app.component('SignInRequired', SignInRequired)

import VueEllipseProgress from 'vue-ellipse-progress'
app.use(VueEllipseProgress)

import analytics from './analytics'
app.config.globalProperties.$analytics = analytics

import * as utils from './utils'
app.config.globalProperties.$utils = utils

import '@fortawesome/fontawesome-pro/css/all.css'
import 'purecss'

app.use(VueClipboard, {
   autoSetContainer: true,
   appendToBody: true,
 })

import VueAnnouncer from '@vue-a11y/announcer'
import '@vue-a11y/announcer/dist/style.css'
app.use(VueAnnouncer, { router })

app.mount('#app')
