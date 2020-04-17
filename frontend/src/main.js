import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueCookies from 'vue-cookies'
import VTooltip from 'v-tooltip'
import VueClipboard from 'vue-clipboard2'


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
