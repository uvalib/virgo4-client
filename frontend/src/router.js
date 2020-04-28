import Vue from 'vue'
import Router from 'vue-router'
import Browse from './views/Browse.vue'
import Home from './views/Home.vue'
import Journals from './views/Journals.vue'
import CourseReserves from './views/CourseReserves.vue'
import CourseReservesRequest from './views/CourseReservesRequest.vue'
import CourseReserveSuccess from './views/CourseReserveSuccess.vue'
import Details from './views/Details.vue'
import Preferences from './views/Preferences.vue'
import SignIn from './views/SignIn.vue'
import Account from './views/Account.vue'
import Checkouts from './views/Checkouts.vue'
import Requests from './views/Requests.vue'
import SavedSearches from './views/SavedSearches.vue'
import Bookmarks from './views/Bookmarks.vue'
import SignedOut from './views/SignedOut.vue'
import Feedback from './views/Feedback.vue'
import NotFound from './views/NotFound.vue'
import PublicBookmarks from './views/PublicBookmarks.vue'
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
         component: Home,
      },
      {
         path: '/search/:id',
         name: 'home',
         component: Home
      },
      {
         path: '/bookmarks/:key',
         name: 'public-bookmarks',
         component: PublicBookmarks
      },
      {
         path: '/journals',
         name: 'journals',
         component: Journals
      },
      {
         path: '/browse/:type',
         name: 'browse',
         component: Browse,
         props: true,
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
         path: '/feedback',
         name: 'feedback',
         component: Feedback
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
            ensureSignedIn()
            store.dispatch('restore/loadLocalStorage')
            let redirectPath = store.getters['restore/previousPath']
            next(redirectPath)
         }
      },
      {
         path: '/signin',
         name: 'signin',
         component: SignIn,
         beforeEnter(_to, from, next) {
            store.dispatch('restore/save', from.fullPath)
            next()
         }
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
         path: '/requests',
         name: 'requests',
         component: Requests
      },
      {
         path: '/searches',
         name: 'searches',
         component: SavedSearches
      },
      {
         path: '/signedout',
         name: 'signedout',
         component: SignedOut
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
   // Some pages just require an auth token...
   let tokenPages = ["home", "course-reserves", "details", "search", "journals", "public-bookmarks", "browse", "feedback"]
   if (tokenPages.includes(to.name)) {
      ensureAuthTokenPresent(next)
      return
   }

   // Some pages require a signed in user...
   let userPages = ["preferences", "account", "bookmarks", "checkouts",
      "course-reserves-request", "requests", "searches"]
   if (userPages.includes(to.name)) {
      if (ensureSignedIn()) {
         next()
      } else {
         store.commit('system/setSessionExpired')
         next("/")
      }
      return
   }

   // All others just proceed...
   next()
})

function ensureSignedIn() {
   let jwtStr = Vue.$cookies.get("v4_jwt")
   if (jwtStr) {
      store.commit("user/setUserJWT", jwtStr)
      return true
   } else {
      store.commit("user/signoutUser")   
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
   let jwtStr = Vue.$cookies.get("v4_jwt")
   if (jwtStr) {
      // console.log("IN COOKIE AUTH, signing in")
      store.commit("user/setUserJWT", jwtStr)
      next()
      return
   }

   // No token. Request one and WAIT FOR RESPONSE before calling next()
   // console.log("REQUEST AUTH")
   store.dispatch("user/getAuthToken").then(() => {
      next()
   }).catch((_error) => {
      next("/")
   })
}

export default router
