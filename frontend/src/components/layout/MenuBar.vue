<template>
   <nav v-if="!systemStore.$datafatal" class="menu" role="menubar" aria-label="Virgo Menu"
      :class="{shadow: alertStore.seenCount>0 && alertStore.menuCount==0 || alertStore.menuCount == 0}"
   >
      <ul class="menu-right"
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
               <span role="menu" id="servicemenu" class="menu-item service" tabindex="-1"
                  :aria-expanded="isOpen('servicemenu').toString()">
                  Library Services
                  <i class="fas fa-caret-down submenu-arrow" :class="{ rotated: isOpen('servicemenu') }"></i>
               </span>
               <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave">
                  <ul v-if="isOpen('servicemenu')" class="dropdown-menu" @keydown.space.stop.prevent @click.stop>
                     <li class="submenu">
                        <a @click="libServiceClicked('Subject Guides')"
                           href="https://www.library.virginia.edu/research/" role="menuitem"
                           tabindex="-1" id="guides">
                           Subject Guides
                        </a>
                     </li>
                     <li class="submenu">
                        <a @click="libServiceClicked('Journal Finder')" target="_blank"
                           href="https://guides.lib.virginia.edu/journalfinder" role="menuitem"
                           tabindex="-1" id="journalsub">
                           Journal Finder
                        </a>
                     </li>
                     <li class="submenu">
                        <a @click="libServiceClicked('Databases A-Z')" target="_blank"
                           href="https://guides.lib.virginia.edu/az.php" role="menuitem"
                           tabindex="-1" id="databasesub">
                           Databases A-Z
                        </a>
                     </li>
                     <li class="submenu">
                        <a @click="libServiceClicked('Spaces & Equipment')" target="_blank"
                           href="https://cal.lib.virginia.edu/" role="menuitem"
                           tabindex="-1" id="spacesub">
                           Spaces & Equipment
                        </a>
                     </li>
                     <li class="submenu">
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
               @keydown.down.prevent.stop="nextSubMenu">
               <span role="menu" id="accountmenu" class="menu-item account" tabindex="-1"
                  :aria-expanded="isOpen('accountmenu').toString()">
                  <i class="icon fal fa-user-circle"></i>
                  &nbsp;Signed in as {{userStore.signedInUser}}&nbsp;
                  <i class="fas fa-caret-down submenu-arrow" :class="{ rotated: isOpen('accountmenu') }"></i>
               </span>
               <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave">
                  <ul v-if="isOpen('accountmenu')" class="dropdown-menu"
                     @keydown.space.prevent.stop @keydown.enter.stop="linkClicked">
                     <li class="submenu">
                        <router-link role="menuitem" tabindex="-1" to="/account" id="accountsub">
                           My Information
                        </router-link>
                     </li>
                     <li class="submenu">
                        <router-link role="menuitem" tabindex="-1" to="/checkouts" id="checkoutsub">
                           Checkouts
                        </router-link>
                     </li>
                     <li class="submenu">
                        <router-link role="menuitem" tabindex="-1" to="/digital-deliveries" id="digitalsub">
                           Digital Deliveries
                        </router-link>
                     </li>
                     <li class="submenu">
                        <router-link role="menuitem" tabindex="-1" to="/requests"  id="requestsub">
                           Requests
                        </router-link>
                     </li>
                     <li class="submenu">
                        <router-link role="menuitem" tabindex="-1" to="/bookmarks" id="bookmarksub">
                           Bookmarks
                        </router-link>
                     </li>
                     <li class="submenu">
                        <router-link role="menuitem" tabindex="-1" to="/searches" id="savesub">
                           Searches
                        </router-link>
                     </li>
                     <li class="submenu">
                        <router-link role="menuitem" tabindex="-1" to="/preferences"  id="prefsub">
                           Preferences
                        </router-link>
                     </li>
                     <li v-if="userStore.isAdmin || userStore.isPDAAdmin" class="submenu">
                        <router-link role="menuitem" tabindex="-1" to="/admin"  id="adminsub">
                           Admin
                        </router-link>
                     </li>
                     <li class="submenu">
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
            <li v-if="systemStore.isKiosk == false" class="menu-item alert-wrap"
               :class="{dim: alertStore.menuCount==0 && alertStore.seenCount==0 || alertStore.menuCount>0}" tabindex="-1" role="menuitem" id="alertmenu"
               @click="alertClicked" @keydown.prevent.stop.enter="alertClicked"
               @keydown.space.prevent.stop="alertClicked"
            >
               <div class="alert-bell icon fal fa-bell">
                  <span v-if="alertStore.seenCount" class="alert-count">{{alertStore.seenCount}}</span>
               </div>
            </li>
         </template>
      </ul>
   </nav>
</template>

<script setup>
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { useAlertStore } from "@/stores/alert"
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import analytics from '@/analytics'
import { useRouter } from 'vue-router'

const alertStore = useAlertStore()
const systemStore = useSystemStore()
const userStore = useUserStore()
const router = useRouter()

const noFocus = ref(false)
const menuBarIdx = ref(0)
const menuBar = ref([
   {id: "searchmenu", submenu:[], expanded: false},
   {id: "feedbackmenu", submenu:[], expanded: false},
   {id: "servicemenu",
      submenu:["guides", "journalsub", "databasesub", "spacesub", "moresub"],
      expanded: false, subMenuIdx: 0},
   {id: "accountmenu", submenu:
      ["accountsub", "checkoutsub", "digitalsub",  "requestsub", "bookmarksub", "savesub", "prefsub", "adminsub", "outsub"],
      expanded: false, subMenuIdx: 0},
   {id: "alertmenu", submenu:[], expanded: false},
])

onMounted(() => {
   window.addEventListener("click", resetMenus)
}),
onUnmounted(() => {
   window.removeEventListener("click", resetMenus)
})

function resetMenus() {
   menuBarIdx.value = 0
   closeSubMenus()
}
function closeSubMenus() {
   menuBar.value.forEach( mb => {
      if (mb.submenu.length > 0) {
         mb.expanded = false
         mb.idx = 0
      }
   })
}
function linkClicked() {
   noFocus.value = true
}
function isOpen( menuID ) {
   let m = menuBar.value.find( mb => mb.id == menuID)
   return m.expanded
}
function libServiceClicked(serviceName) {
   resetMenus()
   analytics.trigger('Navigation', 'LIBRARY_SERVICE_CLICKED', serviceName)
}
function alertClicked() {
   alertStore.clearSeenAlerts()
}
function nextMenu() {
   closeSubMenus()
   menuBarIdx.value++
   if (menuBarIdx.value == menuBar.value.length) {
      menuBarIdx.value = 0
   }
   setMenuFocus()
}
function prevMenu() {
   closeSubMenus()
   menuBarIdx.value--
   if (menuBarIdx.value < 0) {
      menuBarIdx.value = menuBar.value.length - 1
   }
   setMenuFocus()
}
function toggleSubMenu( targetMenu ) {
   if ( targetMenu ) {
      menuBarIdx.value = menuBar.value.findIndex( mb => mb.id == targetMenu)
   }
   let menu = menuBar.value[menuBarIdx.value]
   if ( menu.submenu.length == 0) {
      return
   }
   menu.expanded = !menu.expanded
   menu.subMenuIdx = 0
   setMenuFocus()
}
function nextSubMenu() {
   let currMenu = menuBar.value[menuBarIdx.value]
   if ( currMenu.submenu.length == 0) {
      return
   }
   if ( currMenu.expanded ) {
      currMenu.subMenuIdx++
   } else {
      currMenu.expanded = true
   }
   if ( currMenu.subMenuIdx == currMenu.submenu.length) {
      currMenu.subMenuIdx = 0
   }
   setMenuFocus()
}
function prevSubMenu() {
   let currMenu = menuBar.value[menuBarIdx.value]
   if ( currMenu.submenu.length == 0) {
      return
   }
   if ( currMenu.expanded ) {
      currMenu.subMenuIdx--
   } else {
      currMenu.expanded = true
   }
   if ( currMenu.subMenuIdx < 0) {
      currMenu.subMenuIdx = currMenu.submenu.length-1
   }
   setMenuFocus()
}
function setMenuFocus() {
   if ( noFocus.value === true) {
      noFocus.value = false
      return
   }
   let menu = menuBar.value[menuBarIdx.value]
   if (menu.submenu.length == 0 || menu.expanded == false) {
      document.getElementById(menu.id).focus({preventScroll:true})
   } else {
      nextTick( () => {
         let subMenuEle = document.getElementById(menu.submenu[menu.subMenuIdx])
         subMenuEle.focus({preventScroll:true})
      })
   }
}
function searchClicked() {
   // FIXME
   // $store.dispatch('resetSearch')
   window.scrollTo({
      top: 0,
      behavior: "auto"
   })
}

async function signOut() {
   await userStore.signout(true)
   router.push("/signedout")
}
function beforeEnter(el) {
   el.style.height = '0'
}
function enter(el) {
   el.style.height = el.scrollHeight + 'px'
}
function beforeLeave(el) {
   el.style.height = el.scrollHeight + 'px'
}
function leave(el) {
   el.style.height = '0'
}
</script>

<style lang="scss" scoped>
#app nav.menu.shadow {
   box-shadow: $v4-box-shadow;
}
#app nav.menu {
   text-align: right;
   padding: 0px;
   margin: 0;
   background-color: var(--uvalib-blue-alt-darkest);
   color: white;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
   position: relative;

   .icon {
      font-size: 1.3em;
      margin-right: 5px;
   }

   ul {
      display: block;
      position: relative;
      list-style: none;
      margin: 0;
      padding: 0;
      li {
         display: inline-block;
         padding: 0;
         margin: 0;
         font-weight: 500;
         position: relative;
      }
   }

   ul.menu-right {
      margin: 0 0 0 auto;
      padding: 10px;
      li {
         margin: 0 0 0 20px;
      }
   }

   ul.dropdown-menu {
      position: absolute;
      z-index: 1000;
      background: white;
      padding: 0;
      border-radius: 0 0 5px 5px;
      border: 1px solid var(--uvalib-grey-light);
      border-top: none;
      top: 29px;
      right: 0;
      overflow: hidden;
      transition: 200ms ease-out;
      display: grid;
      grid-auto-rows: auto;
      width: max-content;

      li.submenu {
         padding: 0;
         margin: 0;
         a, div {
            margin:0;
            padding: 10px 15px;
            font-weight: normal;
            color: var(--uvalib-text-dark);
            text-align: right;
            box-sizing: border-box;
            display: block;
            cursor: pointer;
            outline: none;
            &:hover {
               text-decoration: underline;
            }
            &:focus {
               background-color: var(--uvalib-brand-blue-lightest);
               color: var(--uvalib-text-dark);
            }
         }
      }
   }
   .menu-item {
      cursor: pointer;
      color: white;
      flex: 0 1 auto;
      display: inline-block;
      border-bottom:1px solid transparent;

      &:hover {
         border-bottom:1px solid white;
      }

      &:focus {
         @include be-accessible-light();
      }
   }
   .menu-item.notice {
      color: var(--uvalib-yellow);
      margin-right: 2px;
      font-weight: normal;
      .cnt {
         font-size: 0.8em;
         font-weight: bold;
         font-family: sans-serif;
         display: inline-block;
         position: relative;
         top: -6px;
         left: -2px;
      }
   }

   .submenu-arrow {
      transform: rotate(0deg);
      transition-duration: 200ms;
   }
     .submenu-arrow.rotated {
      transform: rotate(180deg);
   }

   .alert-bell {
      position: relative;
      .alert-count {
         font-size: 0.7em;
         font-weight: bold;
         background: var(--uvalib-yellow);
         color: var(--uvalib-text-dark);
         width: 1em;
         height: 1em;
         font-family: sans-serif;
         display: inline-block;
         text-align: center;
         border-radius: 15px;
         padding: 1px;
         position: absolute;
         right: -12px;
         top: -8px;
      }
   }
   .alert-wrap.dim  {
      opacity: 0.4;
      cursor: default;
      &:hover {
         border-bottom: none;
      }
   }
   .alert-wrap {
      cursor: pointer;
      color: white;
      display: inline-block;
      margin-left:20px;
      &:focus {
         @include be-accessible-light();
      }
      &::hover {
         border-bottom:1px solid white;
      }
   }
}

@media only screen and (max-width: 800px) {
   i.icon {
      display: none !important;
   }
   #feedbackmenu {
      padding: 8px 0 8px 0;
   }
   #searchmenu {
      margin-left: 25px !important;
   }
   div.alert-wrap {
      position: absolute;
      left: 10px;
      top: 10px;
      margin-left: 0 !important;
   }
}
</style>
