<template>
   <nav v-if="!systemStore.$datafatal" class="menu" aria-label="Virgo Menu"
      :class="{shadow: alertStore.seenCount>0 && alertStore.menuCount==0 || alertStore.menuCount == 0}"
   >
      <Menubar :model="v4Menu" />
   </nav>
   <!-- <nav v-if="!systemStore.$datafatal" class="menu" aria-label="Virgo Menu"
      :class="{shadow: alertStore.seenCount>0 && alertStore.menuCount==0 || alertStore.menuCount == 0}"
   >
      <ul class="menu-right" role="menubar" aria-label="Virgo Menu"
         @keydown.right.prevent.stop="nextMenu" @keyup.left.prevent.stop="prevMenu"
         @keyup.esc="toggleSubMenu()" @keydown.space.prevent.stop
         @keydown.down.prevent.stop @keydown.up.prevent.stop>
         <li role="none">
            <router-link role="menuitem" id="searchmenu" @focus="resetMenus" @mousedown="searchClicked" to="/">
               <span class="menu-item no-pad"><i class="icon fal fa-search"></i>Search</span>
            </router-link>
         </li>
         <template v-if="systemStore.isKiosk==false">
            <li role="none">
               <a tabindex="-1" id="feedbackmenu" role="menuitem"
                  href="https://www.library.virginia.edu/askalibrarian/" target="_blank">
                  <span class="menu-item"><i class="icon fal fa-comment-dots"></i>Questions? Ask a Librarian</span>
               </a>
            </li>
            <li role="none"
               @click.stop="toggleSubMenu('servicemenu')" @keyup.enter="toggleSubMenu()"
               @keydown.space="toggleSubMenu()" @keydown.up.prevent.stop="prevSubMenu"
               @keydown.down.prevent.stop="nextSubMenu">
               <span id="servicemenu" class="menu-item service" tabindex="-1"
                  role="menuitem" aria-haspopup="true"
                  :aria-expanded="isOpen('servicemenu').toString()">
                  Library Services
                  <i class="fas fa-caret-down submenu-arrow" :class="{ rotated: isOpen('servicemenu') }"></i>
               </span>
               <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave">
                  <ul v-if="isOpen('servicemenu')"
                     aria-label="Library Services" role="menu" id="library-services"
                     class="dropdown-menu" @keydown.space.stop.prevent @click.stop
                  >
                     <li class="submenu" role="none">
                        <a @click="libServiceClicked('Subject Guides')" role="menuitem"
                           href="https://www.library.virginia.edu/research/"
                           tabindex="-1" id="guides">
                           Subject Guides
                        </a>
                     </li>
                     <li class="submenu" role="none">
                        <a @click="libServiceClicked('Journal Finder')" target="_blank"
                           href="https://guides.lib.virginia.edu/journalfinder" role="menuitem"
                           tabindex="-1" id="journalsub">
                           Journal Finder
                        </a>
                     </li>
                     <li class="submenu" role="none">
                        <a @click="libServiceClicked('Databases A-Z')" target="_blank"
                           href="https://guides.lib.virginia.edu/az.php" role="menuitem"
                           tabindex="-1" id="databasesub">
                           Databases A-Z
                        </a>
                     </li>
                     <li class="submenu" role="none">
                        <a @click="libServiceClicked('Spaces & Equipment')" target="_blank"
                           href="https://cal.lib.virginia.edu/" role="menuitem"
                           tabindex="-1" id="spacesub">
                           Spaces & Equipment
                        </a>
                     </li>
                     <li class="submenu" role="none">
                        <a @click="libServiceClicked('More Library Services')" target="_blank"
                           href="https://www.library.virginia.edu/services" role="menuitem"
                           tabindex="-1" id="moresub">
                           More Library Services
                        </a>
                     </li>
                  </ul>
               </transition>
            </li>
            <li v-if="userStore.isSignedIn" role="none"
               @click.stop="toggleSubMenu('accountmenu')" @keydown.enter="toggleSubMenu()"
               @keydown.space="toggleSubMenu()" @keydown.up.prevent.stop="prevSubMenu"
               @keydown.down.prevent.stop="nextSubMenu"
            >
               <span role="menuitem" id="accountmenu" class="menu-item account" tabindex="-1"
                  aria-haspopup="true" :aria-expanded="isOpen('accountmenu').toString()"
               >
                  <i class="icon fal fa-user-circle"></i>
                  <span class="signed-in-label">{{signedInLabel}}</span>
                  <i class="fas fa-caret-down submenu-arrow" :class="{ rotated: isOpen('accountmenu') }"></i>
               </span>
               <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave">
                  <ul v-if="isOpen('accountmenu')" class="dropdown-menu"  id="acct-menu"
                     role="menu" :aria-label="signedInLabel"
                     @keydown.space.prevent.stop @keydown.enter.stop="linkClicked"
                  >
                     <li class="submenu" role="none">
                        <router-link role="menuitem" tabindex="-1" to="/account" id="accountsub">
                           My Information
                        </router-link>
                     </li>
                     <li class="submenu" role="none">
                        <router-link role="menuitem" tabindex="-1" to="/checkouts" id="checkoutsub">
                           Checkouts
                        </router-link>
                     </li>
                     <li class="submenu" role="none">
                        <router-link role="menuitem" tabindex="-1" to="/digital-deliveries" id="digitalsub">
                           Digital Deliveries
                        </router-link>
                     </li>
                     <li class="submenu" role="none">
                        <router-link role="menuitem" tabindex="-1" to="/requests"  id="requestsub">
                           Requests
                        </router-link>
                     </li>
                     <li class="submenu" role="none">
                        <router-link role="menuitem" tabindex="-1" to="/bookmarks" id="bookmarksub">
                           Bookmarks
                        </router-link>
                     </li>
                     <li class="submenu" role="none">
                        <router-link role="menuitem" tabindex="-1" to="/searches" id="savesub">
                           Searches
                        </router-link>
                     </li>
                     <li class="submenu" role="none">
                        <router-link role="menuitem" tabindex="-1" to="/preferences"  id="prefsub">
                           Preferences
                        </router-link>
                     </li>
                     <li v-if="userStore.isAdmin || userStore.isPDAAdmin" class="submenu" role="none">
                        <router-link role="menuitem" tabindex="-1" to="/admin"  id="adminsub">
                           Admin
                        </router-link>
                     </li>
                     <li class="submenu" role="none">
                        <div role="menuitem" tabindex="-1"  id="outsub" @click="signOut" @keydown.stop.enter="signOut">
                           Sign out
                        </div>
                     </li>
                  </ul>
               </transition>
            </li>
            <li v-if="userStore.isSignedIn && userStore.itemsOnNotice.length > 0" role="none">
               <router-link to="/checkouts?overdue=1" role="menuitem" >
                  <span  class="menu-item notice">
                     <i class="fas fa-exclamation-triangle"></i><span class="cnt">{{userStore.itemsOnNotice.length}}</span>
                  </span>
               </router-link>
            </li>
            <li v-if="userStore.isSignedIn == false" role="none">
               <router-link tabindex="-1" role="menuitem" id="accountmenu" to="/signin">
                  <span tabindex="-1" class="menu-item"><i class="icon fal fa-user-circle"></i>Sign In</span>
               </router-link>
            </li>
            <li v-if="systemStore.isKiosk == false" role="none">
               <a role="menuitem" id="alertmenu" class="menu-item" tabindex="-1"
                  @click="alertClicked" @keydown.prevent.stop.enter="alertClicked"
                  @keydown.space.prevent.stop="alertClicked"
                  aria-label="virgo alerts"
               >
                  <i class="alert-bell icon fal fa-bell" :class="{dim: alertStore.menuCount==0 && alertStore.seenCount==0 || alertStore.menuCount>0}"></i>
                  <span v-if="alertStore.seenCount" class="alert-count">{{alertStore.seenCount}}</span>
               </a>
            </li>
         </template>
      </ul>
   </nav> -->
</template>

<script setup>
import Menubar from 'primevue/menubar'
import { useSystemStore } from "@/stores/system"
import { useResultStore } from "@/stores/result"
import { useUserStore } from "@/stores/user"
import { useAlertStore } from "@/stores/alert"
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import analytics from '@/analytics'

const alertStore = useAlertStore()
const systemStore = useSystemStore()
const userStore = useUserStore()
const results = useResultStore()

const v4Menu = computed( () => {
   let menu = [ {label: "Search", to: "/", icon: "icon fal fa-search", command: ()=>searchClicked()}, ]
   if ( systemStore.isKiosk) return menu

   let nonKiosk = [
      {label: "Questions? Ask a Librarian", url: "https://www.library.virginia.edu/askalibrarian",
         target: "_blank", icon: "icon fal fa-comment-dots"},
      {label: "Library Services", items: [
         {label: "Subject Guides", url: "https://www.library.virginia.edu/research",
            target: "_blank", command: ()=>libServiceClicked('Subject Guides')},
         {label: "Journal Finder", url: "https://guides.lib.virginia.edu/journalfinder",
            target: "_blank", command: ()=>libServiceClicked('Journal Finder')},
         {label: "Databases A-Z", url: "https://guides.lib.virginia.edu/az.php",
            target: "_blank", command: ()=>libServiceClicked('Databases A-Z')},
         {label: "Spaces & Equipment", url: "https://www.library.virginia.edu/services",
            target: "_blank", command: ()=>libServiceClicked('Spaces & Equipment')},
         {label: "Spaces & Equipment", url: "https://www.library.virginia.edu/services",
            target: "_blank", command: ()=>libServiceClicked('Spaces & Equipment')},
      ]}
   ]

   let signIn = []
   if (userStore.isSignedIn) {
      let items = [
         {label: "My Information", to: "/account"},
         {label: "Checkouts", to: "/checkouts"},
         {label: "Digital Deliveries", to: "/digital-deliveries"},
         {label: "Requests", to: "/requests"},
         {label: "Bookmarks", to: "/bookmarks"},
         {label: "Searches", to: "/searches"},
         {label: "Preferences", to: "/preferences"},
      ]
      if ("userStore.isAdmin || userStore.isPDAAdmin") {
         items.push({label: "Admin", to: "/admin"})
      }
      items.push({label: "Sign out",  command: ()=>signOut()})
      signIn = [ {label: `Signed in as ${userStore.signedInUser}`, icon: "icon fal fa-user-circle", items: items} ]
   } else {
      signIn = [ {label: "Sign In", to: "/signin", icon: "icon fal fa-user-circle"} ]
   }

   return menu.concat(nonKiosk).concat(signIn)
})

const libServiceClicked = ((serviceName) => {
   analytics.trigger('Navigation', 'LIBRARY_SERVICE_CLICKED', serviceName)
})

function alertClicked() {
   alertStore.clearSeenAlerts()
}

const searchClicked = (() => {
   results.resetSearch()
   window.scrollTo({
      top: 0,
      behavior: "auto"
   })
})

const signOut = (() => {
   userStore.signout(true)
})
</script>

<style lang="scss" scoped>
nav.menu.shadow {
   box-shadow: $v4-box-shadow;
}
//    .menu-item.notice {
//       color: var(--uvalib-yellow);
//       margin-right: 2px;
//       font-weight: normal;
//       .cnt {
//          font-size: 0.8em;
//          font-weight: bold;
//          font-family: sans-serif;
//          display: inline-block;
//          position: relative;
//          top: -6px;
//          left: -2px;
//       }
//    }

//    .alert-bell {
//       position: relative;
//       color: white;
//       cursor: pointer;
//       display: inline-block;
//       margin-left:0px;
//    }
//    .alert-bell.dim {
//       opacity: 0.4;
//       cursor: default;
//       &:hover {
//          border-bottom: none;
//       }
//    }
//    .alert-count {
//          font-size: 1em;
//          font-weight: bold;
//          background: var(--uvalib-yellow);
//          color: var(--uvalib-text-dark);
//          width: 1em;
//          height: 1em;
//          font-family: sans-serif;
//          display: inline-block;
//          text-align: center;
//          border-radius: 15px;
//          padding: 1px;
//          position: absolute;
//          right: -8px;
//          top: -8px;
//       }
//    // .alert-wrap {
//    //    cursor: pointer;
//    //    color: white;
//    //    display: inline-block;
//    //    margin-left:20px;
//    //    &:focus {
//    //       @include be-accessible-light();
//    //    }
//    //    &::hover {
//    //       border-bottom:1px solid white;
//    //    }
//    // }
// }
</style>
