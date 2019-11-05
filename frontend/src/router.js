import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import CourseReserves from './views/CourseReserves.vue'
import CourseReservesRequest from './views/CourseReservesRequest.vue'
import CourseReserveSuccess from './views/CourseReserveSuccess.vue'
import Details from './views/Details.vue'
import Preferences from './views/Preferences.vue'
import SignIn from './views/SignIn.vue'
import Account from './views/Account.vue'
import Checkouts from './views/Checkouts.vue'
import Bookmarks from './views/Bookmarks.vue'
import SignedOut from './views/SignedOut.vue'
import Forbidden from './views/Forbidden.vue'
import NotFound from './views/NotFound.vue'
import store from './store'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      alias: '/search',
      name: 'home',
      component: Home
    },
    {
      path: '/course-reserves',
      name: 'course-reserves', 
      component: CourseReserves
    },
    {
      path: '/course-reserves-request',
      name: 'course-reserves-request',
      component: CourseReservesRequest
    },
    {
      path: '/reserved',
      name: 'reserved',
      component: CourseReserveSuccess,
    },
    {
      path: '/sources/:src/items/:id',
      name: 'details',
      component: Details,
    },
    {
      path: '/preferences',
      name: 'preferences',
      component: Preferences
    },
    {
      // NOTES: the signedin route doesn't actually have a 
      // visual representation. It just handes the auth session 
      // setup and redirects to account page
      path: '/signedin',
      beforeEnter: (_to, _from, next) => {
        getSignedInUserFromCookie()
        next('/account')
      }
    },
    {
      path: '/signin',
      name: 'signin',
      component: SignIn
    },
    {
      path: '/account',
      name: 'account',
      component: Account
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: Bookmarks
    },
    {
      path: '/checkouts',
      name: 'checkouts',
      component: Checkouts
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
    {
      path: "*",
      name: "notfound",
      component: NotFound
    }
  ],
  scrollBehavior(/*to, from, savedPosition*/) {
    // each new 'page' will scroll to the top of the screen
    return { x: 0, y: 0 }
  },
})

// This is called before every URL in the SPA is hit
router.beforeEach((to, _from, next) => {
  // always make sure user menu is closed
  store.commit("system/closeUserMenu")

  // Some pages just require an auth token...
  let tokenPages = ["home", "course-reserves", "details"]
  if (tokenPages.includes(to.name)) {
    ensureAuthTokenPresent(next)
    return
  }

  // Some pages require a signed in user...
  let userPages = ["preferences", "account", "bookmarks", "checkouts", "course-reserves-request"]
  if (userPages.includes(to.name)) {
    if (getSignedInUserFromCookie()) {
      next()
    } else {
      next("/") 
    }
    return
  }

  // All others just proceed...
  next()
})

function getSignedInUserFromCookie() {
  store.commit("user/setSignedInUser", {userId: "", token: "", type: "", quiet: true})
  let authInfo = Vue.cookies.get("v4_auth_user")
  if (authInfo) {
    let userId = authInfo.split("|")[0]
    let token = authInfo.split("|")[1]
    let type = authInfo.split("|")[2]
    store.commit("user/setSignedInUser", {userId: userId, token: token, type: type, quiet: false})
    return true
  } 
  return false
}

function ensureAuthTokenPresent(next) {
  let getters = store.getters
  if (getters["user/hasAuthToken"]) {
    next()
    return
  }

  // see if there is an auth user cookie set from which we can retrieve
  // the auth token and logged in user info....
  // console.log("NO AUTH")
  let authInfo = Vue.cookies.get("v4_auth_user")
  if (authInfo) {
    // console.log("IN COOKIE AUTH, signing in")
    let userId = authInfo.split("|")[0]
    let token = authInfo.split("|")[1]
    let type = authInfo.split("|")[2]
    store.commit("user/setSignedInUser", {userId: userId, token: token, type: type, quiet: true})
    next()
    return
  }

  // No token. Request one and WAIT FOR RESPONSE before calling next()
  // console.log("REQUEST AUTH")
  store.dispatch("user/getAuthToken").then( ()=> {
    next()
  }).catch((_error) => {
    next("/")
  })
}

export default router
