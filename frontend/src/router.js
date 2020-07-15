import Vue from 'vue'
import Router from 'vue-router'
import Browse from './views/Browse.vue'
import Codes from './views/Codes.vue'
import Home from './views/Home.vue'
import Journals from './views/Journals.vue'
import CourseReserves from './views/CourseReserves.vue'
import CourseReservesRequest from './views/CourseReservesRequest.vue'
import CourseReserveSuccess from './views/CourseReserveSuccess.vue'
import Details from './views/Details.vue'
import SignIn from './views/SignIn.vue'
import Account from './views/account/Account.vue'
import Bookmarks from './views/account/Bookmarks.vue'
import Checkouts from './views/account/Checkouts.vue'
import DigitalDeliveries from './views/account/DigitalDeliveries.vue'
import Preferences from './views/account/Preferences.vue'
import Requests from './views/account/Requests.vue'
import SavedSearches from './views/account/SavedSearches.vue'

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
         name: 'search',
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
         path: '/codes',
         name: 'codes',
         component: Codes
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
         // route to details page when pool is not known
         path: '/items/:id',
         alias: '/catalog/:id',
         name: 'item',
         component: Details,
      },
      {
         // this is a catchall route for catalog queries from external search boxes
         path: '/catalog',
         beforeEnter: (to, _from, next) => {
            let field = to.query.search_field
            if ( field == "journal") {
               console.log("Detected a journal query. Converting to V4 search...")
               let q = to.query.q
               next(`/search?mode=basic&scope=journals&q=title%3A%20%7B${q}%7D`)
            } else {
               console.error("Unrecognized URL: "+to.fullPath+". Redirect to Virgo3")
               window.location.href="https://v3.lib.virginia.edu"+to.fullPath
            }
         }
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
            store.commit('restore/load')
            next( store.state.restore.url )
         }
      },
      {
         path: '/signin',
         name: 'signin',
         component: SignIn,
         beforeEnter(_to, from, next) {
            store.commit('restore/setURL', from.fullPath)
            store.commit('restore/save')
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
         path: '/digital-deliveries',
         name: 'digital-deliveries',
         component: DigitalDeliveries
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
   scrollBehavior(to, _from, _savedPosition) {
      let noScrollPages = ["home", "search"]

      // dont alter scroll position on search page
      if (noScrollPages.includes(to.name) && to.fullPath != "/search" ) {
         return false
      } 

      return new Promise(resolve => {
         setTimeout( () => {
            resolve({x: 0, y: 0})
         }, 100)
      })
   },
})

// This is called before every URL in the SPA is hit
router.beforeEach((to, _from, next) => {
   // Some pages just require an auth token...
   let tokenPages = ["home", "codes", "course-reserves", "details", "search", "journals", "public-bookmarks", "browse", "feedback", "item"]
   if (tokenPages.includes(to.name)) {
      ensureAuthTokenPresent(next)
      return
   }

   // Some pages require a signed in user...
   let userPages = ["preferences", "account", "bookmarks", "checkouts", "digital-deliveries",
      "course-reserves-request", "requests", "searches"]
   if (userPages.includes(to.name)) {
      if (ensureSignedIn()) {
         next()
      } else {
         store.commit('system/setSessionExpired')
         store.dispatch("user/signout")
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
   } 
   return false
}

async function ensureAuthTokenPresent(next) {
   let getters = store.getters
   if (getters["user/hasAuthToken"]) {
      next()
      return
   }

   // see if there is an auth user cookie set from which we can retrieve
   // the auth token and logged in user info....
   let jwtStr = Vue.$cookies.get("v4_jwt")
   if (jwtStr) {
      store.commit("user/setUserJWT", jwtStr)
      next()
      return
   }

   // No token. Request one and WAIT FOR RESPONSE before calling next()
   await store.dispatch("user/getAuthToken")
   next()
}

export default router
