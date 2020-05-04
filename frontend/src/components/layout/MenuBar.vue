<template>
   <nav class="menu" role="menubar" aria-label="Virgo Menu" @keyup.right="nextMenu" @keyup.left="prevMenu" @keyup.esc="closeSubMenus">
      <span class="menu-right">
        <router-link role="menuitem" id="searchmenu" @click.native="searchClicked" to="/search" v-on:focus.native="onMenuFocus">
           <span class="menu-item"><i class="fas fa-search"></i>&nbsp;Search</span>
        </router-link>
        <router-link tabindex="-1" role="menuitem" id="reservemenu" to="/course-reserves" @mousedown.native="closeSubMenus">
           <span class="menu-item"><i class="fas fa-university"></i>&nbsp;Course Reserves</span>
        </router-link>
        <div v-if="isKiosk==false" tabindex="-1" id="feedbackmenu" role="menuitem" class="menu-item feedback" @mousedown="closeSubMenus">
            <a tabindex="-1" href="https://www.library.virginia.edu/askalibrarian/" target="_blank">
               <span><i class="fas fa-comments"></i>&nbsp;</span>
               <span>Questions? Ask a Librarian</span>
            </a>
         </div>
         <span v-if="isKiosk==false" role="menu" id="servicemenu" class="menu-item service" tabindex="-1" :aria-expanded="svcMenuOpen"
            @click.stop="toggleSvcMenu" @keyup.prevent.stop.enter="toggleSvcMenu" @keydown.space.prevent.stop="toggleSvcMenu"
            @keyup.down="nextSvcMenu" @keyup.up="prevSvcMenu">
            <span>Library Services&nbsp;</span>
            <i class="fas fa-caret-down submenu-arrow" v-bind:style="{ transform: rotation('svc') }"></i>
            <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave">
               <div v-if="svcMenuOpen" class="user-menu" @keydown.space.prevent.stop>
                  <a href="https://guides.lib.virginia.edu/journalfinder" target="_blank" role="menuitem" 
                     tabindex="-1" id="journalsub">
                     <div class="submenu">Journal&nbsp;Finder</div>
                  </a>
                  <a href="https://guides.lib.virginia.edu/az.php" target="_blank" role="menuitem" 
                     tabindex="-1" id="databasesub">
                     <div class="submenu">Databases A-Z</div>
                  </a>
                  <a href="https://cal.lib.virginia.edu/calendar" target="_blank" role="menuitem" 
                     tabindex="-1" id="eventsub">
                     <div class="submenu">Event Calendar</div>
                  </a>
                  <a href="https://cal.lib.virginia.edu" target="_blank" role="menuitem" 
                     tabindex="-1" id="roomrsrvsub">
                     <div class="submenu">Room Reservations</div>
                  </a>
                  <a href="https://gis.lib.virginia.edu" target="_blank" role="menuitem" 
                     tabindex="-1" id="gissub">
                     <div class="submenu">GIS</div>
                  </a>
                  <a href="https://libra.virginia.edu" target="_blank" role="menuitem" 
                     tabindex="-1" id="librasub">
                     <div class="submenu">Libra</div>
                  </a>
               </div>
            </transition>
         </span>
         <template v-if="isSignedIn">
            <span role="menu" id="accountmenu" class="menu-item account" tabindex="-1" :aria-expanded="userMenuOpen"
               @click.stop="toggleUserMenu" @keyup.prevent.stop.enter="toggleUserMenu" @keydown.space.prevent.stop="toggleUserMenu"
               @keyup.down="nextUserMenu" @keyup.up="prevUserMenu">
               <span><i class="fas fa-user"></i>&nbsp;Signed in as {{signedInUser}}&nbsp;</span>
               <i class="fas fa-caret-down submenu-arrow" v-bind:style="{ transform: rotation('user') }"></i>
               <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave">
                  <div v-if="userMenuOpen" class="user-menu"  @keydown.space.prevent.stop>
                     <router-link role="menuitem" tabindex="-1" to="/account" id="accountsub">
                        <div class="submenu">My Information</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/bookmarks" id="bookmarksub" @keyup.native.enter.prevent.stop>
                        <div class="submenu">Bookmarks</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/checkouts" id="checkoutsub" @keyup.native.enter.prevent.stop>
                        <div class="submenu">Checkouts</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/preferences"  id="prefsub" @keyup.native.enter.prevent.stop>
                        <div class="submenu">Preferences</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/requests"  id="requestsub" @keyup.native.enter.prevent.stop>
                        <div class="submenu">Requests</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/searches" id="savesub" @keyup.native.enter.prevent.stop>
                        <div class="submenu">Saved Searches</div>
                     </router-link>
                     <div role="menuitem" tabindex="-1"  id="outsub" class="submenu"
                        @click="signOut" @keyup.stop.enter="signOut" @keydown.space.prevent.stop="signOut" >
                        <span>Sign out</span>
                     </div>
                  </div>
               </transition>
            </span>
            <router-link v-if="itemsOnNotice.length > 0" to="/checkouts">
               <span  class="menu-item notice">
                  <i class="notice fas fa-exclamation-triangle"></i>{{itemsOnNotice.length}}
               </span>
            </router-link>
         </template>
         <template v-else>
            <router-link tabindex="-1" v-if="isKiosk==false" role="menuitem" id="accountmenu" to="/signin" 
                @click.native="closeSubMenus">
               <span tabindex="-1" class="menu-item"><i class="fas fa-user"></i>&nbsp;Sign In</span>
            </router-link>
         </template>
      </span>
   </nav>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"

export default {
   data: function() {
      return {
         menuBar: ["searchmenu", "reservemenu", "feedbackmenu", "servicemenu", "accountmenu"],
         menuBarIdx: 0,
         userMenu: ["accountsub", "bookmarksub", "checkoutsub", "prefsub", "requestsub", "savesub", "outsub"],
         userMenuOpen: false,
         userMenuIdx: 0,
         svcMenuOpen: false,
         svcMenuIdx: 0,
         svcMenu: ["journalsub", "databasesub", "eventsub", "roomrsrvsub", "gissub", "librasub"],

      }
   },
   computed: {
      ...mapState({
         signedInUser: state => state.user.signedInUser,
      }),
      ...mapGetters({
        isKiosk: 'system/isKiosk',
        isSignedIn: 'user/isSignedIn',
        itemsOnNotice: 'user/itemsOnNotice'
      }),
   },
   methods: {
      onMenuFocus() {
         this.menuBarIdx = 0
         this.closeSubMenus()
      },
      rotation( menu) {
         let flag = this.userMenuOpen
         if (menu == 'svc') {
            flag = this.sveMenuOpen
         }
         if (flag) {
            return "rotate(180deg)"
         }
         return "rotate(0deg)"
      },
      nextMenu() {
         this.closeSubMenus()
         this.menuBarIdx++
         if (this.menuBarIdx == this.menuBar.length) {
            this.menuBarIdx = 0
         }
         let menu = document.getElementById(this.menuBar[this.menuBarIdx])
         menu.focus()
      },
      prevMenu() {
         this.closeSubMenus()
         this.menuBarIdx--
         if (this.menuBarIdx < 0) {
            this.menuBarIdx = this.menuBar.length - 1
         }
         let menu = document.getElementById(this.menuBar[this.menuBarIdx])
         menu.focus()
      },
      nextUserMenu( ) {
         if ( this.userMenuOpen) {
            this.userMenuIdx++
            if (this.userMenuIdx == this.userMenu.length) {
               this.userMenuIdx = 0
            }
         } else {
            this.toggleUserMenu()
         }
         this.$nextTick( () => {
            let menu = document.getElementById(this.userMenu[this.userMenuIdx])
            menu.focus()
         })
      },
      nextSvcMenu() {
         if ( this.svcMenuOpen) { 
            this.svcMenuIdx++
            if (this.svcMenuIdx == this.svcMenu.length) {
               this.svcMenuIdx = 0
            }
         } else {
            this.toggleSvcMenu()
         }
         this.$nextTick( () => {
            let menu = document.getElementById(this.svcMenu[this.svcMenuIdx])
            menu.focus()
         })
      },
      prevUserMenu() {
         if ( this.userMenuOpen) {
            this.userMenuIdx--
            if (this.userMenuIdx < 0) {
               this.userMenuIdx = this.userMenu.length-1
            }
         } else {
            this.toggleUserMenu()
            this.userMenuIdx = this.userMenu.length-1
         }
         this.$nextTick( () => {
            let menu = document.getElementById(this.userMenu[this.userMenuIdx])
            menu.focus()
         })
      },
      prevSvcMenu() {
         if ( this.svcMenuOpen) { 
            this.svcMenuIdx--
            if (this.svcMenuIdx < 0) {
               this.svcMenuIdx = this.svcMenu.length-1
            }
         } else {
            this.toggleSvcMenu()
            this.svcMenuIdx = this.svcMenu.length-1
         }
         this.$nextTick( () => {
            let menu = document.getElementById(this.svcMenu[this.svcMenuIdx])
            menu.focus()
         })
      },
      searchClicked() {
         this.closeSubMenus()
         this.$store.commit('resetSearchResults')
         this.$store.commit('filters/reset')
         this.$store.commit('query/clear')
      },
      signinClicked() {
         this.closeSubMenus()
         this.$router.push("/signin")
      },
      toggleUserMenu() {
         this.svcMenuOpen = false
         this.userMenuOpen = !this.userMenuOpen
         this.userMenuIdx = 0
         if (this.userMenuOpen) {
            setTimeout( () => {
               let menu = document.getElementById(this.userMenu[this.userMenuIdx])
               menu.focus()
            },100)
         }
      },
      toggleSvcMenu() {
         this.closeUserMenu()
         this.svcMenuOpen = !this.svcMenuOpen
         this.svcMenuIdx = 0
         if (this.svcMenuOpen) {
            setTimeout( () => {
               let menu = document.getElementById(this.svcMenu[this.svcMenuIdx])
               menu.focus()
            },100)
         }
      },
      closeSubMenus() {
         this.closeSvcMenu()
         this.closeUserMenu()
         this.restoreMenuBarFocus()
      },
      closeSvcMenu() {
         this.svcMenuOpen = false
         this.svcMenuIdx = 0
      },
      closeUserMenu() {
         this.userMenuOpen = false
         this.userMenuIdx = 0
      },
      restoreMenuBarFocus() {
         setTimeout( () => {
            let menu = document.getElementById(this.menuBar[this.menuBarIdx])
            menu.focus()
         },100)
      },
      signOut() {
         this.$store.dispatch("user/signout")
      },
      beforeEnter: function(el) {
         el.style.height = '0'
      },
      enter: function(el) {
         el.style.height = el.scrollHeight + 'px'
         this.expandedItem = el
      },
      beforeLeave: function(el) {
         el.style.height = el.scrollHeight + 'px'
         this.expandedItem = el
      },
      leave: function(el) {
         el.style.height = '0'
      }
   }
}
</script>

<style scoped>
@media only screen and (max-width: 768px) {
   span.menu-item.feedback {
     display: none;
   }
   span.menu-item.account {
     padding-top: 10px;
   }
}
.menu {
   text-align: right;
   padding: 10px;
   background-color: var(--uvalib-blue-alt-darkest);
   color: white;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
}
#app .menu a {
   color: white;
}
#app .menu a:hover {
   text-decoration: none;
}
#app .menu a:first-child .menu-item {
   margin-left:0
}
.menu .menu-item {
   cursor: pointer;
   color: white;
   flex: 0 1 auto;
   display: inline-block;
   margin-left:20px;
}
.menu-item.account, .menu-item.service {
   position: relative;
   display: inline-block;
   font-weight: 500;
}
.user-menu {
  position: absolute;
  z-index: 1000;
  background: white;
  padding: 0 0 5px 0;
  border-radius: 0 0 5px 5px;
  border: 1px solid var(--uvalib-grey-light);
  border-top: none;
  top: 30px;
  right: 0;
  left: 0;
  overflow: hidden;
  transition: 200ms ease-out;
  display: grid;
  grid-auto-rows: auto;
  width: max-content;
}
#app .user-menu a {
   outline: none;
}
#app .user-menu a:focus div.submenu, #app .user-menu div.submenu:focus {
   background-color: var(--uvalib-brand-blue-lightest);
   color: var(--uvalib-text-dark);
}
.submenu {
   margin:0;
   font-weight: normal;
   color: var(--uvalib-text-dark);
   align-items: stretch;
   justify-items: stretch;
   padding: 10px 15px;
   outline: none;
}
#app .menu .submenu a {
   color:white;
}
#app .menu .submenu a:hover {
   text-decoration: none;
   border: none;
   color: white;
}
.submenu:hover {
   background-color: var(--uvalib-brand-blue-lightest);
   color: var(--uvalib-text-dark);
}
.submenu-arrow {
   transform: rotate(0deg);
   transition-duration: 200ms;
}
.menu .menu-item {
   border-bottom:1px solid var(--color-secondary-blue);
}
.menu .menu-item:hover {
   border-bottom:1px solid white;
}
.menu-right {
   margin-left: auto;
}
i.notice {
   color: var(--uvalib-brand-orange);
   margin-right: 5px;
}
</style>
