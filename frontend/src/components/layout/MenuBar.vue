<template>
   <nav class="menu">
      <span class="menu-left">
         <router-link to="/">
            <span class="menu-item"><i class="fas fa-search"></i>&nbsp;Search</span>
         </router-link>
         <router-link to="/course-reserves">
            <span class="menu-item"><i class="fas fa-university"></i>&nbsp;Course Reserves</span>
         </router-link>
         <span class="menu-item feedback">
            <Feedback icon/>
         </span>
      </span>
      <span class="menu-right">
         <template v-if="isSignedIn">
            <span @click="toggleMenu" class="menu-item account">
               <span><i class="fas fa-user"></i>&nbsp;Signed in as {{signedInUser}}&nbsp;</span>
               <i class="fas fa-caret-down submenu-arrow" v-bind:style="{ transform: rotation }"></i>
               <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave">
                  <div @click="blockToggle" v-if="userMenuOpen" class="user-menu" >
                     <router-link to="/account">
                        <div class="submenu">My Account</div>
                     </router-link>
                     <router-link to="/bookmarks">
                        <div class="submenu">Bookmarks</div>
                     </router-link>
                     <router-link to="/checkouts">
                        <div class="submenu">Checked-Out Items</div>
                     </router-link>
                     <router-link to="/preferences">
                        <div class="submenu">Preferences</div>
                     </router-link>
                     <div  @click="signOut" class="submenu">
                        <span>Sign out</span>
                     </div>
                  </div>
               </transition>
            </span>
         </template>   
         <template v-else>
            <router-link to="/signin">
               <span class="menu-item"><i class="fas fa-user"></i>&nbsp;Sign In</span>
            </router-link>
         </template>
      </span>
   </nav>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import Feedback from "@/components/popovers/Feedback"
export default {
   components: {
      Feedback
   },
   computed: {
      ...mapState({
         signedInUser: state => state.user.signedInUser,
         userMenuOpen: state => state.system.userMenuOpen
      }),
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
      rotation() {
         if (this.userMenuOpen) {
            return "rotate(180deg)"
         }
         return "rotate(0deg)"
      }
   },
   methods: {
      signinClicked() {
         this.$router.push("/signin")
      },
      blockToggle(e) {
         e.stopPropagation()
      },
      toggleMenu(e) {
         e.stopPropagation()
         this.$store.commit("system/toggleUserMenu")
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
}
.menu {
   text-align: right;
   padding: 10px;
   background-color: var(--color-secondary-blue);
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
.submenu {
   margin:0;
   padding: 5px 10px;
   margin: 0;
   font-size: 1.2em;
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
   background-color: var(--color-primary-blue);
   color: white;
}
.submenu-arrow {
   transform: rotate(0deg);
   transition-duration: 200ms;
}
.user-menu {
  position: absolute;
  z-index: 1000;
  background: var(--color-secondary-blue);
  padding: 0 0 5px 0;
  border-radius: 0 0 5px 5px;
  border: 1px solid var(--color-secondary-blue);
  border-top: 11px solid var(--color-secondary-blue);
  right: 0;
  left: 0;
  font-size: 0.9em;
  overflow: hidden;
  transition: 200ms ease-out;
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
</style>

