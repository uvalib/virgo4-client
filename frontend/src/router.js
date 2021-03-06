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
         // NOTES: the signedin route doesn't have a visual representation. It just stores token and redirects
         path: '/signedin',
         beforeEnter: async (_to, _from, next) => {
            let jwtStr = Vue.$cookies.get("v4_jwt")
            store.commit("user/setUserJWT", jwtStr)
            store.commit('restore/load')
            let tgtURL = "/"
            if ( store.state.user.noILSAccount &&  store.state.user.signedInUser != "") {
               console.log("NetBadge success, but NO ILS ACCOUNT")
               tgtURL = "/account"
            } else {
               tgtURL = store.state.restore.url
               console.log("redirect to "+tgtURL)
               if (!tgtURL || tgtURL == "") {
                  tgtURL = "/"
               }
            }
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
router.beforeEach( async (to, _from, next) => {
   store.commit("system/setILSError", "")
   if ( to.path == "/signedin") {
      // signedin page is a temporary redirect after netbadge. don't
      // do any special handling for at as that page has specific handling
      // baked into the router above
      next()
      return
   }

   // Page header is now in the main app template and driven by the pageTitle
   // model variable. Ensure it is set correctly for each new page
   let h1 = {home: "Search", search: "Search", signin: "User Sign In", account: "My Account",
      checkouts: "My Account", 'digital-deliveries': "My Account",
      bookmarks: "My Account", requests: "My Account", searches: "My Account",
      preferences: "My Account", fatal_error: "Virgo System Error", 'shelf-browse': "Shelf Browse",
      codes: "Codes", signedout: "Signed Out", details: "Item Details", not_found: "404 error: Page not found",
      'public-bookmarks': "Public Bookmarks", feedback: "Virgo Feedback", openurl: "Request an Item",
      'course-reserves': "Course Reserves", 'course-reserves-request': "Course Reserves Request", reserved: "Course Reserves Request"
   }
   let title =  h1[to.name]
   if (title) {
      store.commit("setPageTitle", title)
   }

   // These pages require signed in user and will automatically netbadge in if not signed in
   let autoAuth = ["openurl"]
   if (autoAuth.includes(to.name)) {
      if (store.getters["user/isSignedIn"] == false) {
         store.commit('restore/setURL', to.fullPath)
         store.commit('restore/save')
         store.dispatch('user/netbadge')
         return
      }
   }

   next()
})

export default router
