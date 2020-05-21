import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueCookies from 'vue-cookies'
import VTooltip from 'v-tooltip'
import VueClipboard from 'vue-clipboard2'
import V4Button from "@/components/V4Button"
import V4Checkbox from "@/components/V4Checkbox"
import V4Spinner from "@/components/V4Spinner"
import V4Popover from "@/components/popovers/V4Popover"
Vue.component('V4Button', V4Button)
Vue.component('V4Checkbox', V4Checkbox)
Vue.component('V4Spinner', V4Spinner)
Vue.component('V4Popover', V4Popover)

import VueMoment from 'vue-moment';
Vue.use(VueMoment)

import 'viewerjs/dist/viewer.css'
import Viewer from 'v-viewer'

import Purecss from 'purecss'

Vue.use(VueCookies)
Vue.use(Purecss)
Vue.use(VTooltip)
Vue.use(Viewer)
Vue.use(VueClipboard)


Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
