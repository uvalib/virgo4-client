import Vue from 'vue'
import Router from 'vue-router'
import Codes from './views/Codes.vue'
import Home from './views/Home.vue'

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
import OpenURLRequest from './views/OpenURLRequest.vue'

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
         path: '/catalog*',
         beforeEnter: (to, _from, _next) => {
            console.error("Unrecognized URL: "+to.fullPath+". Redirect to Virgo3")
            window.location.href="https://v3.lib.virginia.edu"+to.fullPath
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
            // Grab the cookie and stuff in local storage. Cookie is short lived
            let jwtStr = Vue.$cookies.get("v4_jwt")
            store.commit("user/setUserJWT", jwtStr)
            store.dispatch("user/getAccountInfo")  // needed for search preferences
            store.dispatch("user/getCheckouts")    // needed so the alert icon can show in menubar
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
router.beforeEach( (to, from, next) => {
   // Some pages just require an auth token...
   store.commit("system/setILSError", "")
   let tokenPages = ["home", "codes", "course-reserves", "details", "search", "public-bookmarks", "feedback", "item"]
   if (tokenPages.includes(to.name)) {
      // console.log(`Page ${to.name} requires auth token only`)
      ensureAuthTokenPresent( next )
      return
   }

   // Some pages require a signed in user...
   let userPages = ["preferences", "account", "bookmarks", "checkouts", "digital-deliveries",
      "course-reserves-request", "requests", "searches"]
   if (userPages.includes(to.name)) {
      // console.log(`Page ${to.name} requires signed in user`)
      ensureSignedIn( from.fullPath, next, false )
      return
   }

   // These pages require signed in user and will automatically netbadge in if not signed in
   let autoAuth = ["openurl"]
   if (autoAuth.includes(to.name)) {
      ensureSignedIn( from.fullPath, next, true )
      return
   }

   // All others just proceed...
   next()
})

async function ensureSignedIn( fromPath, next, autoNetbadge ) {
   if ( store.getters["user/isSignedIn"]) {
      // console.log("Sign-in session found in memory")
      await store.dispatch("user/refreshAuth")
      next()
   } else {
      let resp = await restoreSessionFromLocalStorage()
      if ( resp === true) {
         next()
      } else {
         if (autoNetbadge) {
            store.commit('restore/setURL', fromPath)
            store.dispaych('user/netbadge')
         } else {
            // console.log("Unable to find session for page access. Flag as expired")
            store.commit('system/setSessionExpired')
            await store.dispatch("user/signout", "/")
            next("/")
         }
      }
   }
}

async function restoreSessionFromLocalStorage() {
   // console.log("Restore session from local storage...")
   let jwtStr = localStorage.getItem('v4_jwt')
   if (jwtStr) {
      // console.log("Found JWT in local storage...")
      store.commit("user/setUserJWT", jwtStr)

      await store.dispatch("user/refreshAuth")

      // console.log("load user data into session")
      await store.dispatch("user/getAccountInfo")  // needed for search preferences
      store.dispatch("user/getCheckouts")          // needed so the alert icon can show in menubar
      return true
   }

   // console.log("Nothing found in local storage")
   return false
}

async function ensureAuthTokenPresent( next ) {
   // console.log("Check memory for auth token or session...")
   // Check for sign-in first, and if found check for expire / renew
   // Reason: signed in users have an auth token too. If that is detected first
   // the session may expire without being refreshed
   if (store.getters["user/isSignedIn"]) {
      // console.log("Sign-in session found in memory")
      await store.dispatch("user/refreshAuth")
      next()
      return
   }
   if (store.getters["user/hasAuthToken"]) {
      // console.log("Auth token found in memory")
      next()
      return
   }

   // console.log("Check Local store for session...")
   let restored = await restoreSessionFromLocalStorage()
   if ( restored === true ) {
      // console.log("Session restored from local store")
      next()
      return
   }

   // console.log("Get new auth token...")
   await store.dispatch("user/getAuthToken")
   // console.log("...DONE; new auth token received")
   next()
}

export default router
