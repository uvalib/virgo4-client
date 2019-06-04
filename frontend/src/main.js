import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueCookies from 'vue-cookies'
import VTooltip from 'v-tooltip'

import Purecss from 'purecss'

Vue.use(VueCookies)
Vue.use(Purecss)
Vue.use(VTooltip)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
