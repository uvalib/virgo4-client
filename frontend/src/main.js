import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueCookies from 'vue-cookies'
import VueClipboard from 'vue-clipboard2'
import V4Button from "@/components/V4Button"
import V4Checkbox from "@/components/V4Checkbox"
import V4Spinner from "@/components/V4Spinner"
import V4Select from "@/components/V4Select"
import V4Modal from "@/components/modals/V4Modal"
import V4Disclosure from "@/components/disclosures/V4Disclosure"
import Confirm from "@/components/modals/Confirm"
import SignInRequired from "@/components/SignInRequired"

Vue.component('V4Button', V4Button)
Vue.component('V4Checkbox', V4Checkbox)
Vue.component('V4Spinner', V4Spinner)
Vue.component('V4Select', V4Select)
Vue.component('V4Modal', V4Modal)
Vue.component('V4Disclosure', V4Disclosure)
Vue.component('Confirm', Confirm)
Vue.component('SignInRequired', SignInRequired)

import analytics from './analytics'
Vue.prototype.$analytics = analytics

import * as utils from './utils'
Vue.prototype.$utils = utils

import VueMoment from 'vue-moment';
Vue.use(VueMoment)

import Purecss from 'purecss'

Vue.use(VueCookies)
Vue.use(Purecss)
Vue.use(VueClipboard)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
