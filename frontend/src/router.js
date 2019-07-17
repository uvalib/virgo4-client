import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import store from './store'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
  ],
  scrollBehavior(/*to, from, savedPosition*/) {
    // each new 'page' will scroll to the top of the screen
    return { x: 0, y: 0 }
  },
})

// This is called before every URL in the SPA is hit. Use
// it to be sure an authentication token is present, and request one 
// if not. NOTE: If shibboleth is going to be used to protect the /authenticate
// endpoint, it cannot be a POST. Convert to a GET and redirect to it
// instead of making an ajax request. Update the back end to accept a ?url=dest
// query param. Once token generated, redirect to the passed URL. 
// EX: let authURL =  "/authorize?url=" + to.fullPath
//     window.location.href = authURL
router.beforeEach((_to, _from, next) => {
    let getters = store.getters
    if (getters["auth/hasAuthToken"] == false) {
      store.dispatch("auth/getAuthToken")
    } else {
      alert( store.auth.authToken)
    }
 
  next()
})

export default router
