import { createApp, markRaw } from 'vue'
import App from './App.vue'
import router from './router'
import { plugin, defaultConfig } from '@formkit/vue'

import V4Button from "@/components/V4Button.vue"
import V4Checkbox from "@/components/V4Checkbox.vue"
import V4Spinner from "@/components/V4Spinner.vue"
import V4Select from "@/components/V4Select.vue"
import V4Modal from "@/components/modals/V4Modal.vue"
import V4Disclosure from "@/components/disclosures/V4Disclosure.vue"
import V4FormActions from "@/components/V4FormActions.vue"
import Confirm from "@/components/modals/Confirm.vue"

import { createPinia } from 'pinia'
const pinia = createPinia()
pinia.use(({ store }) => {
   // all stores can access router with this.router
   store.router = markRaw(router)
})

const app = createApp(App)
app.use(router)
app.use(pinia)

const dc = defaultConfig({
   config: {
      classes: {
         input: '$reset v4-form-input',
         label: '$reset v4-form-label',
         messages: '$reset v4-form-invalid',
         help: '$reset v4-form-help',
      },
      incompleteMessage: false,
      validationVisibility: 'submit'
   }
})
app.use(plugin, dc)

app.component('V4Button', V4Button)
app.component('V4Checkbox', V4Checkbox)
app.component('V4Spinner', V4Spinner)
app.component('V4Select', V4Select)
app.component('V4Modal', V4Modal)
app.component('V4Disclosure', V4Disclosure)
app.component('V4FormActions', V4FormActions)
app.component('Confirm', Confirm)

import './assets/styles/forms.scss'
import './assets/styles/uva-colors.css'

import '@fortawesome/fontawesome-pro/css/all.css'
import 'purecss'

import VueAnnouncer from '@vue-a11y/announcer'
import '@vue-a11y/announcer/dist/style.css'
app.use(VueAnnouncer, { router })

app.mount('#app')
