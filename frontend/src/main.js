import { createApp, markRaw, nextTick } from 'vue'
import App from './App.vue'
import router from './router'
import { plugin, defaultConfig } from '@formkit/vue'
import formatDatePlugin from './plugins/formatdate'
import formatNumPlugin from './plugins/formatnum'

import V4Spinner from "@/components/V4Spinner.vue"
import V4FormActions from "@/components/V4FormActions.vue"

import { createPinia } from 'pinia'
const pinia = createPinia()
pinia.use(({ store }) => {
   // all stores can access router with this.router
   store.router = markRaw(router)
})

const app = createApp(App)
app.use(router)
app.use(pinia)
app.use(formatDatePlugin)
app.use(formatNumPlugin)

// global custom components
app.component('V4Spinner', V4Spinner)
app.component('V4FormActions', V4FormActions)

// add a directive that can be used to autofocus and a plugin that can sefelt set focus
app.directive('focus', {
   mounted: (el) => nextTick( ()=> el.focus() )
})

const dc = defaultConfig({
   plugins: [addErrorAlertIconPlugin, addRequiredNotePlugin],
   config: {
      classes: {
         input: '$reset v4-form-input',
         label: '$reset v4-form-label',
         messages: '$reset v4-form-invalid',
         help: '$reset v4-form-help',
      },
   }
})
app.use(plugin, dc)

// announcer
import VueAnnouncer from '@vue-a11y/announcer'
import '@vue-a11y/announcer/dist/style.css'
app.use(VueAnnouncer, { router })

// styles
import './assets/styles/forms.scss'
import '@fortawesome/fontawesome-pro/css/all.css'
import 'primeicons/primeicons.css'


// Primevue setup
import PrimeVue from 'primevue/config'
import UVA from './assets/theme/uva'
import Button from 'primevue/button'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

app.use(PrimeVue, {
   theme: {
      preset: UVA,
      options: {
         prefix: 'p',
         darkModeSelector: '.virgo-dark'
      }
   }
})

app.use(ToastService)
app.use(ConfirmationService)
app.component("VirgoButton", Button) // Override the default name of primevue Button to VirgoButton (later renae to v4button)

app.mount('#app')

// Plugins for formkit -------

function addRequiredNotePlugin(node) {
   node.on('created', () => {
      const schemaFn = node.props.definition.schema
      node.props.definition.schema = (sectionsSchema = {}) => {
         sectionsSchema["label"] = {
            children: [`$label`, {
               $el: 'span',
               if: '$state.required',
                  attrs: {
                     innerHTML: "*</i><span class='req'>(required)</span>"
                  },
            }]
         }
         return schemaFn(sectionsSchema)
      }
   })
}

function addErrorAlertIconPlugin(node) {
   node.on('created', () => {
      const schemaFn = node.props.definition.schema
      node.context.warningIcon = '<i class="fas fa-exclamation-triangle"></i>'
      node.props.definition.schema = (extensions) => {
         if (!extensions.message) {
            extensions.message = {
               attrs: {
                  innerHTML: '$warningIcon + " " + $message.value'
               },
               children: null
            }
         }
         return schemaFn(extensions)
      }
   })
}
