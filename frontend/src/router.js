import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import SignedOut from './views/SignedOut.vue'
import Forbidden from './views/Forbidden.vue'
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
    {
      // NOTES: the signedin route doesn't actually have a 
      // visual representation. It just handes the auth session 
      // setup and redirects to home page
      path: '/signedin',
      beforeEnter: (_to, _from, next) => {
        let authInfo = Vue.cookies.get("v4_auth_user")
        if (authInfo) {
          let userId = authInfo.split("|")[0]
          let token = authInfo.split("|")[1]
          let type = authInfo.split("|")[2]
          store.commit("auth/setSignedInUser", {userId: userId, token: token, type: type})
        }
        next('/')
      }
    },
    {
      path: '/signedout',
      name: 'signedout',
      component: SignedOut
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: Forbidden
    },
  ],
  scrollBehavior(/*to, from, savedPosition*/) {
    // each new 'page' will scroll to the top of the screen
    return { x: 0, y: 0 }
  },
})

// This is called before every URL in the SPA is hit. Use
// it to be sure an authentication token is present
router.beforeEach((to, _from, next) => {
  if (to.name == "signedin" || to.name == "signedout" || to.name == "forbidden") {
    // no need to request auth with these pages
    next()
    return
  }

  let getters = store.getters
  if (getters["auth/hasAuthToken"] == false) {
    store.dispatch("auth/getAuthToken")
  } 

  next()
})

export default router
