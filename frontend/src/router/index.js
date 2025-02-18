import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import SignIn from '../views/SignIn.vue'

import { useSystemStore } from "@/stores/system"
import { useRestoreStore } from "@/stores/restore"
import { useUserStore } from "@/stores/user"
import { setFocusID } from '@/utils'

import VueCookies from 'vue-cookies'

const router = createRouter({
   history: createWebHistory( import.meta.env.BASE_URL ),
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
         component: () => import('../views/PublicBookmarks.vue')
      },
      {
         path: '/codes',
         name: 'codes',
         component: () => import('../views/Codes.vue')
      },
      {
         path: '/coursereserves/:id?',
         name: 'course-reserves',
         component: () => import('../views/CourseReserves.vue')
      },
      {
         path: '/course-reserves-request',
         name: 'course-reserves-request',
         component: () => import('../views/CourseReservesRequest.vue')
      },
      {
         path: '/feedback',
         name: 'feedback',
         component: () => import('../views/Feedback.vue')
      },
      {
         path: '/sources/:src/items/:id',
         name: 'details',
         component: () => import('../views/Details.vue')
      },
      {
         path: '/sources/:src/items/:id/browse',
         name: 'shelf-browse',
         component: () => import('../views/ShelfBrowse.vue')
      },
      {
         path: '/preferences',
         name: 'preferences',
         component: () => import('../views/account/Preferences.vue')
      },
      {
         path: '/admin',
         name: 'admin',
         component: () => import('../views/account/Admin.vue')
      },
      {
         path: '/signin',
         name: 'signin',
         component: SignIn,
         beforeEnter(_to, from) {
            const restore = useRestoreStore()
            restore.setURL(from.fullPath)
            restore.save()
         }
      },
      {
         path: '/register',
         name: 'register',
         component: () => import('../views/account/Register.vue')

      },
      {
         path: '/account',
         name: 'account',
         component: () => import('../views/account/Account.vue')
      },
      {
         path: '/bookmarks',
         name: 'bookmarks',
         component: () => import('../views/account/Bookmarks.vue')
      },
      {
         path: '/checkouts',
         name: 'checkouts',
         component: () => import('../views/account/Checkouts.vue')
      },
      {
         path: '/digital-deliveries',
         name: 'digital-deliveries',
         component: () => import('../views/account/DigitalDeliveries.vue')
      },
      {
         path: '/requests',
         name: 'requests',
         component: () => import('../views/account/Requests.vue')
      },
      {
         path: '/searches',
         name: 'searches',
         component: () => import('../views/account/SavedSearches.vue')
      },
      {
         path: '/requests/openurl',
         name: 'openurl',
         component: () => import('../views/OpenURLRequest.vue')
      },
      {
         path: '/signedout',
         name: 'signedout',
         component: () => import('../views/SignedOut.vue')
      },
      {
         path: "/error",
         name: "fatal_error",
         component: () => import('../views/FatalError.vue')
      },
      {
         path: "/forbidden",
         name: "forbidden",
         component: () => import('../views/Forbidden.vue')
      },
      {
         path: '/newversion',
         name: 'newversion',
         component: () => import('../views/NewVersion.vue')

      },
      {
         path: '/:pathMatch(.*)*',
         name: "not_found",
         component: () => import('../views/NotFound.vue')
      }
   ],

   scrollBehavior(to, _from, _savedPosition) {
      let noScrollPages = ["home", "search"]

      // dont scroll during skip to nav
      if ( to.hash == "#v4main") {
         return false
      }

      // dont alter scroll position on search page
      if (noScrollPages.includes(to.name) && to.fullPath != "/search" ) {
         return false
      }

      return new Promise(resolve => {
         setTimeout( () => {
            resolve({left: 0, top: 0})
         }, 100)
      })
   },
})

router.afterEach((to) => {
   const systemStore  = useSystemStore()
   systemStore.clearMessage()

   // Page header is now in the main app template and driven by the pageTitle
   // model variable. Ensure it is set correctly for each new page
   const h1 = {home: "Search", search: "Search", signin: "User Sign In", account: "My Account",
      checkouts: "My Account", 'digital-deliveries': "My Account",
      bookmarks: "My Account", requests: "My Account", searches: "My Account", admin: "My Account",
      preferences: "My Account", register: "Register for a Community Borrower Account", fatal_error: "Virgo System Error", 'shelf-browse': "Shelf Browse",
      codes: "Codes", signedout: "Signed Out", details: "Item Details", not_found: "404 error: Page not found", newversion: "Virgo Update",
      'public-bookmarks': "Public Bookmarks", feedback: "Virgo Feedback", openurl: "Request an Item", forbidden: "Forbidden",
      'course-reserves': "Course Reserves", 'course-reserves-request': "Course Reserves Request", reserved: "Course Reserves Request"
   }
   const pageTitle =  h1[to.name]
   if (pageTitle) {
      systemStore.pageTitle = pageTitle
   }

   // Set the document title as as wekk
   const titles = {home: "Virgo", search: "Virgo", signin: "Sign In", account: "My Information",
      checkouts: "Checkouts", 'digital-deliveries': "Digital Deliveries",
      bookmarks: "Bookmarks", requests: "Requests", searches: "Saved Searches", forbidden: "Forbidden",
      preferences: "Preferences", fatal_error: "Virgo System Error", 'shelf-browse': "Shelf Browse",
      'course-reserves': "Course Reserves", admin: "Admin",
   }
   const title = titles[to.name]
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

   // dont refocus to app when using skipto nav
   if (to.hash != "#v4main") {
      setFocusID("app")
   }
})

router.beforeEach( async (to, _from) => {
   const restore = useRestoreStore()
   const userStore = useUserStore()

   // URLs like /items/PID are legacy format. Redirect to /sources with a legacy source name
   // when the details page loads, source = legacy will trigger a lookup of the correct source / item and redirect again
   if (to.path.indexOf("/items") == 0) {
      let tgtID = to.path.split("/")[2]
      return `/sources/legacy/items/${tgtID}`
   }

   // signedin page is a temporary redirect after netbadge.
   if ( to.path == "/signedin") {
      let jwtStr = VueCookies.get("v4_jwt")
      userStore.setUserJWT(jwtStr)
      restore.load()
      let tgtURL = "/"
      if ( userStore.noILSAccount &&  userStore.signedInUser != "") {
         console.log("NetBadge success, but NO ILS ACCOUNT")
         tgtURL = "/account"
      } else {
         tgtURL = restore.url
         console.log("redirect to "+tgtURL)
         if (!tgtURL || tgtURL == "") {
            tgtURL = "/"
         }
      }
      return tgtURL
   }

   // These pages require signed in user and will automatically netbadge in if not signed in
   let autoAuth = ["openurl"]
   if (autoAuth.includes(to.name)) {
      if (userStore.isSignedIn == false) {
         restore.setURL(to.fullPath)
         restore.save()
         userStore.netbadge()
         return false
      }
   }
})

export default router
