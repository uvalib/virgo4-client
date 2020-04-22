<template>
   <nav class="menu" role="menubar" aria-label="Virgo Menu" @keyup.right="nextMenu" @keyup.left="prevMenu"  @keyup.down="nextSubMenu" @keyup.up="prevSubMenu">
      <span class="menu-right">
        <router-link tabindex="0" role="menuitem" id="searchmenu" @mousedown.native="searchClicked" to="/search" v-on:focus.native="onMenuFocus">
           <span class="menu-item"><i class="fas fa-search"></i>&nbsp;Search</span>
        </router-link>
        <router-link tabindex="-1" role="menuitem" id="reservemenu" to="/course-reserves">
           <span class="menu-item"><i class="fas fa-university"></i>&nbsp;Course Reserves</span>
        </router-link>
        <span v-if="isKiosk==false" tabindex="-1" id="feedbackmenu" role="menuitem" class="menu-item feedback">
            <a tabindex="-1" href="https://www.library.virginia.edu/askalibrarian/" target="_blank">
               <span><i class="fas fa-comments"></i>&nbsp;</span>
               <span>Questions? Ask a Librarian</span>
            </a>
        </span>
         <template v-if="isSignedIn">
            <span role="menu" id="accountmenu" class="menu-item account" tabindex="-1" :aria-expanded="userMenuOpen"
               @click.stop="toggleMenu" @keyup.stop.enter="toggleMenu" @keydown.space.prevent.stop="toggleMenu" @keyup.stop.esc="closeMenu">
               <span><i class="fas fa-user"></i>&nbsp;Signed in as {{signedInUser}}&nbsp;</span>
               <i class="fas fa-caret-down submenu-arrow" v-bind:style="{ transform: rotation }"></i>
               <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave">
                  <div v-if="userMenuOpen" class="user-menu" 
                     @click.stop @keyup.stop.enter @keydown.space.prevent.stop>
                     <router-link role="menuitem" tabindex="-1" to="/account" id="accountsub">
                        <div class="submenu">Account</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/bookmarks" id="bookmarksub">
                        <div class="submenu">Bookmarks</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/checkouts" id="checkoutsub">
                        <div class="submenu">Checkouts</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/preferences"  id="prefsub">
                        <div class="submenu">Preferences</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/requests"  id="requestsub">
                        <div class="submenu">Requests</div>
                     </router-link>
                     <router-link role="menuitem" tabindex="-1" to="/searches" id="savesub">
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
            <router-link tabindex="-1" v-if="isKiosk==false" role="menuitem" id="accountmenu" to="/signin" >
               <span class="menu-item"><i class="fas fa-user"></i>&nbsp;Sign In</span>
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
         subMenu: ["accountsub", "bookmarksub", "checkoutsub", "prefsub", "requestsub", "savesub", "outsub"],
         subMenuIdx: 0,
         menuBar: ["searchmenu", "reservemenu", "feedbackmenu", "accountmenu"],
         menuIdx: 0
      }
   },
   computed: {
      ...mapState({
         signedInUser: state => state.user.signedInUser,
         userMenuOpen: state => state.system.userMenuOpen
      }),
      ...mapGetters({
        isKiosk: 'system/isKiosk',
        isSignedIn: 'user/isSignedIn',
        itemsOnNotice: 'user/itemsOnNotice'
      }),
      rotation() {
         if (this.userMenuOpen) {
            return "rotate(180deg)"
         }
         return "rotate(0deg)"
      }
   },
   methods: {
      onMenuFocus() {
         let tgtID =  event.target.id 
         this.menuIdx = this.menuBar.findIndex( m => m==tgtID)
         this.subMenuIdx = 0
      },
      nextMenu() {
         this.closeMenu()
         this.subMenuIdx = 0
         this.menuIdx++
         if (this.menuIdx == this.menuBar.length) {
            this.menuIdx = 0
         }
         let menu = document.getElementById(this.menuBar[this.menuIdx])
         menu.focus()
      },
      nextSubMenu() {
         if ( this.userMenuOpen) {
            this.subMenuIdx++
            if (this.subMenuIdx == this.subMenu.length) {
               this.subMenuIdx = 0
            }
            let menu = document.getElementById(this.subMenu[this.subMenuIdx])
            menu.focus()
         } else {
            this.subMenuIdx = 0
            this.toggleMenu()
         }
      },
      prevMenu() {
         this.closeMenu()
         this.subMenuIdx = 0
         this.menuIdx--
         if (this.menuIdx < 0) {
            this.menuIdx = this.menuBar.length-1
         }
         let menu = document.getElementById(this.menuBar[this.menuIdx])
         menu.focus()
      },
      prevSubMenu() {
         if ( this.userMenuOpen) {
            this.subMenuIdx--
            if (this.subMenuIdx < 0) {
               this.subMenuIdx = this.subMenu.length-1
            }
            let menu = document.getElementById(this.subMenu[this.subMenuIdx])
            menu.focus()
         } else {
            this.subMenuIdx = this.subMenu.length-1
            this.toggleMenu()
         }
      },
      searchClicked() {
         this.$store.commit('resetSearchResults')
         this.$store.commit('filters/reset')
         this.$store.commit('query/clear')
         this.$store.commit('restore/clearAll')
      },
      signinClicked() {
         this.$router.push("/signin")
      },
      toggleMenu() {
         this.$store.commit("system/toggleUserMenu")
         setTimeout( () => {
            let menu = document.getElementById(this.subMenu[this.subMenuIdx])
            menu.focus()
         },100)
      },
      closeMenu() {
         this.$store.commit("system/closeUserMenu")
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
.menu-item.account {
   position: relative;
   display: inline-block;
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
