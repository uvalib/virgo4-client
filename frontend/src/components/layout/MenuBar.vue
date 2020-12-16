<template>
   <nav class="menu" role="menubar" aria-label="Virgo Menu" @keyup.right="nextMenu" @keyup.left="prevMenu" @keyup.esc="closeSubMenus">
      <span class="menu-right">
        <router-link role="menuitem" id="searchmenu" @click.native="searchClicked" to="/" v-on:focus.native="onMenuFocus">
           <span class="menu-item"><i class="icon fas fa-search"></i>Search</span>
        </router-link>
        <!-- <router-link tabindex="-1" role="menuitem" id="reservemenu" to="/course-reserves" @mousedown.native="closeSubMenus">
           <span class="menu-item"><i class="icon fas fa-university"></i>Course Reserves</span>
        </router-link> -->
        <div v-if="isKiosk==false" tabindex="-1" id="feedbackmenu" role="menuitem" class="menu-item feedback" @mousedown="closeSubMenus">
            <a tabindex="-1" href="https://www.library.virginia.edu/askalibrarian/" target="_blank">
               <span><i class="icon fas fa-comments"></i></span>
               <span>Questions? Ask a Librarian</span>
            </a>
         </div>
         <span v-if="isKiosk==false" role="menu" id="servicemenu" class="menu-item service" tabindex="-1" :aria-expanded="svcMenuOpen.toString()"
            @click.stop="toggleSvcMenu" @keyup.prevent.stop.enter="toggleSvcMenu" @keydown.space.prevent.stop="toggleSvcMenu"
            @keyup.down="nextSvcMenu" @keyup.up="prevSvcMenu">
            <span>Library Services&nbsp;</span>
            <i class="fas fa-caret-down submenu-arrow" v-bind:style="{ transform: rotation('svc') }"></i>
            <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave">
               <div v-if="svcMenuOpen" class="user-menu" @keydown.space.prevent.stop>
                  <a @click="libServiceClicked('Subject Guides')"
                     href="https://www.library.virginia.edu/research/" target="_blank" role="menuitem"
                     tabindex="-1" id="guides">
                     <div class="submenu">Subject&nbsp;Guides</div>
                  </a>
                  <a @click="libServiceClicked('Journal Finder')"
                     href="https://guides.lib.virginia.edu/journalfinder" target="_blank" role="menuitem"
                     tabindex="-1" id="journalsub">
                     <div class="submenu">Journal&nbsp;Finder</div>
                  </a>
                  <a @click="libServiceClicked('Databases A-Z')"
                     href="https://guides.lib.virginia.edu/az.php" target="_blank" role="menuitem"
                     tabindex="-1" id="databasesub">
                     <div class="submenu">Databases A-Z</div>
                  </a>
                  <a @click="libServiceClicked('Spaces & Equipment')"
                     href="https://cal.lib.virginia.edu/" target="_blank" role="menuitem"
                     tabindex="-1" id="spacesub">
                     <div class="submenu">Spaces & Equipment</div>
                  </a>
                  <a @click="libServiceClicked('More Library Services')"
                     href="https://www.library.virginia.edu/services" target="_blank" role="menuitem"
                     tabindex="-1" id="moresub">
                     <div class="submenu">More Library Services</div>
                  </a>
               </div>
            </transition>
         </span>
         <template v-if="!fatal">
            <template v-if="isSignedIn">
               <span role="menu" id="accountmenu" class="menu-item account" tabindex="-1" :aria-expanded="userMenuOpen.toString()"
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
                        <router-link role="menuitem" tabindex="-1" to="/checkouts" id="checkoutsub" @keyup.native.enter.prevent.stop>
                           <div class="submenu">Checkouts</div>
                        </router-link>
                        <router-link role="menuitem" tabindex="-1" to="/digital-deliveries" id="digitalsub" @keyup.native.enter.prevent.stop>
                           <div class="submenu">Digital Deliveries</div>
                        </router-link>
                        <router-link role="menuitem" tabindex="-1" to="/requests"  id="requestsub" @keyup.native.enter.prevent.stop>
                           <div class="submenu">Requests</div>
                        </router-link>
                        <router-link role="menuitem" tabindex="-1" to="/bookmarks" id="bookmarksub" @keyup.native.enter.prevent.stop>
                           <div class="submenu">Bookmarks</div>
                        </router-link>
                        <router-link role="menuitem" tabindex="-1" to="/searches" id="savesub" @keyup.native.enter.prevent.stop>
                           <div class="submenu">Searches</div>
                        </router-link>
                        <router-link role="menuitem" tabindex="-1" to="/preferences"  id="prefsub" @keyup.native.enter.prevent.stop>
                           <div class="submenu">Preferences</div>
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
                  <span tabindex="-1" class="menu-item"><i class="icon fas fa-user"></i>Sign In</span>
               </router-link>
            </template>
         </template>
         <div v-if="!isKiosk && alertsReady" class="alert-wrap" tabindex="-1" role="menuitem" id="alertmenu"
            v-bind:class="{dim: alertCount==0}"
            @click="alertClicked" @keydown.prevent.stop.enter="alertClicked"
            @keydown.space.prevent.stop="alertClicked"
         >
            <div class="alert-bell icon fas fa-bell">
               <span v-if="alertCount" class="alert-count">{{alertCount}}</span>
            </div>
         </div>
      </span>
      <uvalib-alerts v-if="!isKiosk && alertsReady" id="alerts"></uvalib-alerts>
   </nav>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"

export default {
   data: function() {
      return {
         //menuBar: ["searchmenu", "reservemenu", "feedbackmenu", "servicemenu", "accountmenu", "alertmenu"],
         menuBar: ["searchmenu", "feedbackmenu", "servicemenu", "accountmenu", "alertmenu"],
         menuBarIdx: 0,
         userMenu: ["accountsub", "checkoutsub", "digitalsub",  "requestsub", "bookmarksub", "savesub", "prefsub","outsub"],
         userMenuOpen: false,
         userMenuIdx: 0,
         svcMenuOpen: false,
         svcMenuIdx: 0,
         svcMenu: ["guides", "journalsub", "databasesub", "spacesub", "moresub"],
         alertCount: 0,
         alertsReady: false,
      }
   },
   computed: {
      ...mapState({
         signedInUser: state => state.user.signedInUser,
         fatal: state => state.system.fatal,
      }),
      ...mapGetters({
        isKiosk: 'system/isKiosk',
        isSignedIn: 'user/isSignedIn',
        itemsOnNotice: 'user/itemsOnNotice'
      }),
   },
   created() {
      (async () => {
         if (this.isKiosk == false) {
            await import ('@uvalib/uvalib-alerts')
            document.addEventListener('seen-count-changed', (e)=>{ this.alertCount = e.detail.seenCount })
            this.alertsReady = true
         }
      })()
      window.addEventListener("click", this.globalClick)
   },
   destroyed() {
      window.removeEventListener("click", this.globalClick)
   },
   methods: {
      libServiceClicked(serviceName) {
         this.$analytics.trigger('Navigation', 'LIBRARY_SERVICE_CLICKED', serviceName)
      },
      globalClick() {
         this.userMenuOpen = false
         this.svcMenuOpen = false
      },
      alertClicked() {
         if ( this.alertCount > 0) {
            document.querySelector('#alerts').unseeAll()
         }
      },
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
         this.$store.dispatch('resetSearch')
         window.scrollTo({
            top: 0,
            behavior: "auto"
         })
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
      async signOut() {
         await this.$store.dispatch("user/signout")
         this.$router.push("/signedout")
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

<style lang="scss" scoped>
#app .menu {
   text-align: right;
   padding: 0px;
   background-color: var(--uvalib-blue-alt-darkest);
   color: white;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
   position: relative;

   .menu-right {
      margin-left: auto;
      padding: 10px;
   }

   .icon {
      font-size: 1.3em;
      margin-right: 5px;
   }
   #alerts {
      width: 100%;
   }

   a {
      color: white;
   }

   a:hover {
      text-decoration: none;
   }

   a:first-child .menu-item {
      margin-left:0
   }

   .menu-item {
      cursor: pointer;
      color: white;
      flex: 0 1 auto;
      display: inline-block;
      margin-left:20px;
      border-bottom:1px solid var(--color-secondary-blue);

      .notice {
         color: var(--uvalib-yellow);
         margin-right: 2px;
      }

      &:focus {
         @include be-accessible-light();
      }
   }
   .menu-item.notice {
      font-weight: normal;
   }

   .menu-item:hover {
      border-bottom:1px solid white;
   }

   .submenu {
      margin:0;
      font-weight: normal;
      color: var(--uvalib-text-dark);
      align-items: stretch;
      justify-items: stretch;
      padding: 10px 15px;
      outline: none;

      a {
         color:white;
      }
      a:hover {
         text-decoration: none;
         border: none;
         color: white;
      }
   }
   .submenu:hover {
      background-color: var(--uvalib-brand-blue-lightest);
      color: var(--uvalib-text-dark);
   }

   .submenu-arrow {
      transform: rotate(0deg);
      transition-duration: 200ms;
   }

   .menu-item.account, .menu-item.service {
      position: relative;
      display: inline-block;
      font-weight: 500;
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
      opacity: 0.6;
      cursor: default;
   }
   .alert-wrap {
      cursor: pointer;
      color: white;
      display: inline-block;
      margin-left:20px;
      &:focus {
         @include be-accessible-light();
      }
   }
   .alert-wrap:hover {
      border-bottom:1px solid white;
   }
   .alert-wrap.dim:hover {
      border-bottom: none;
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
      overflow: hidden;
      transition: 200ms ease-out;
      display: grid;
      grid-auto-rows: auto;
      width: max-content;

      a {
         outline: none;
      }

      a:focus div.submenu, div.submenu:focus {
         background-color: var(--uvalib-brand-blue-lightest);
         color: var(--uvalib-text-dark);
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
