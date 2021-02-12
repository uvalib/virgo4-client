import Vue from 'vue'
import Router from 'vue-router'
import Codes from './views/Codes.vue'
import Home from './views/Home.vue'

import CourseReserves from './views/CourseReserves.vue'
import CourseReservesRequest from './views/CourseReservesRequest.vue'
import CourseReserveSuccess from './views/CourseReserveSuccess.vue'
import Details from './views/Details.vue'
import ShelfBrowse from './views/ShelfBrowse.vue'
import SignIn from './views/SignIn.vue'
import Account from './views/account/Account.vue'
import Bookmarks from './views/account/Bookmarks.vue'
import Checkouts from './views/account/Checkouts.vue'
import DigitalDeliveries from './views/account/DigitalDeliveries.vue'
import Preferences from './views/account/Preferences.vue'
import Requests from './views/account/Requests.vue'
import SavedSearches from './views/account/SavedSearches.vue'
import OpenURLRequest from './views/OpenURLRequest.vue'

import SignedOut from './views/SignedOut.vue'
import Feedback from './views/Feedback.vue'
import PublicBookmarks from './views/PublicBookmarks.vue'

import NotFound from './views/NotFound.vue'
import FatalError from './views/FatalError.vue'

import store from './store'

import analytics from './analytics'

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
         meta: {
            announcer: {
              skip: true
            }
         }
      },
      {
         path: '/search/:id',
         name: 'search',
         component: Home,
         meta: {
            announcer: {
              skip: true
            }
         }
      },
      {
         path: '/bookmarks/:key',
         name: 'public-bookmarks',
         component: PublicBookmarks
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
         name: 'item',
         component: Details,
      },
      {
         path: '/sources/:src/items/:id/browse',
         name: 'shelf-browse',
         component: ShelfBrowse,
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
         beforeEnter: async (_to, _from, next) => {
            // Grab the cookie and stuff in local storage. Cookie is short lived
            let jwtStr = Vue.$cookies.get("v4_jwt")
            store.commit("user/setUserJWT", jwtStr)
            await store.dispatch("user/getAccountInfo")  // needed for search preferences
            store.dispatch("user/getCheckouts")          // needed so the alert icon can show in menubar
            store.commit('restore/load')
            if ( store.getters["user/isUndergraduate"]) {
               analytics.trigger('User', 'NETBADGE_SIGNIN', "undergraduate")
            } else if ( store.getters["user/isGraduate"]) {
               analytics.trigger('User', 'NETBADGE_SIGNIN', "graduate")
            } else {
               analytics.trigger('User', 'NETBADGE_SIGNIN', "other")
            }

            let tgtURL = store.state.restore.url
            if (!tgtURL || tgtURL == "") {
               tgtURL = "/"
            }
            console.log("signed in, continue to "+tgtURL)
            next( tgtURL )
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
         path: '/requests/openurl',
         name: 'openurl',
         component: OpenURLRequest
      },
      {
         path: '/signedout',
         name: 'signedout',
         component: SignedOut
      },
      {
         path: "/error",
         name: "fatal_error",
         component: FatalError
      },
      {
         path: "*",
         name: "not_found",
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

router.afterEach((to, _from) => {
   let titles = {home: "Virgo", search: "Virgo", signin: "Sign In", account: "My Information",
      checkouts: "Checkouts", 'digital-deliveries': "Digital Deliveries",
      bookmarks: "Bookmarks", requests: "Requests", searches: "Saved Searches",
      preferences: "Preferences", fatal_error: "Virgo System Error", 'shelf-browse': "Shelf Browse"
   }
   Vue.nextTick(() => {
      let title = titles[to.name]
      if ( title == "Virgo") {
         if (to.query.q) {
            document.title = "Search Results"
         } else if (to.query.mode=="advanced" ){
            document.title = "Advanced Search"
         } else {
            document.title = title
         }
      } else {
         if (title) {
            document.title = title
         } else {
            document.title = "Virgo"
         }
      }
      document.getElementById("app").focus()
   })
})

// This is called before every URL in the SPA is hit
router.beforeEach( async (to, from, next) => {
   store.commit("system/setILSError", "")

   // keep sign-in or access tokens current (issue new token if none present)
   await refreshSession()


   // Some pages require a signed in user; grab one from session or cookie.
   // otherwise sign out the current user (if any)
   let userPages = ["preferences", "account", "bookmarks", "digital-deliveries",
      "course-reserves-request", "requests", "searches", "checkouts"]
   if (userPages.includes(to.name)) {
      if (store.getters["user/isSignedIn"] == false) {
         // clear out any possible signin session. The consequences will be handled on the targte page
         await store.dispatch("user/signout")
      }
   }

   // These pages require signed in user and will automatically netbadge in if not signed in
   let autoAuth = ["openurl"]
   if (autoAuth.includes(to.name)) {
      if (store.getters["user/isSignedIn"] == false) {
         store.commit('restore/setURL', from)
         store.dispatch('user/netbadge')
         return
      }
   }

   // console.log("session OK... continue")
   next()
})

async function refreshSession() {
   // First, check for active (in-memory) sign-in and refresh it...
   if (store.getters["user/isSignedIn"]) {
      // console.log("Sign-in session found in memory")
      await store.dispatch("user/refreshAuth")
      // console.log("session refreshed")
      return
   }

   // Next, see if a session is in local storage and refresh it...
   // console.log("Restore session from local storage...")
   let jwtStr = localStorage.getItem('v4_jwt')
   if (jwtStr) {
      // console.log("Found JWT in local storage...")
      store.commit("user/setUserJWT", jwtStr)

      await store.dispatch("user/refreshAuth")
      // console.log("session refreshed")

      // console.log("load user data into session")
      store.dispatch("user/getAccountInfo")  // needed for search preferences
      store.dispatch("user/getCheckouts")    // needed so the alert icon can show in menubar
      return
   }

   // Last, if there is no auth token get one
   if (store.getters["user/hasAuthToken"] == false) {
      console.log("no sign-in nor auth token; get new auth token")
      await store.dispatch("user/getAuthToken")
      // console.log("session created")
   } // else {
      // console.log("has auth token")
   // }

}

export default router
