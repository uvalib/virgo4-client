<template>
   <nav class="menu">
      <template v-if="isSignedIn">
         <span @mouseover="showMenu" @mouseleave="hideMenu" class="menu-item account">
            <i class="fas fa-user"></i>&nbsp;Signed in as {{signedInUser}}&nbsp;<i class="fas fa-caret-down"></i>
               <div v-if="menuOpen" class="user-menu" @mouseover="showMenu" >
                  <div class="submenu"><router-link to="/account">Account Info</router-link></div>
                  <!-- <div class="submenu">Bookmarks</div> -->
               </div>
         </span>
         <span class="sep">|</span>
         <span @click="signOut" class="menu-item">Sign out</span>
      </template>   
      <template v-else>
         <router-link to="/signin">
            <span class="menu-item"><i class="fas fa-user"></i>&nbsp;Sign In</span>
         </router-link>
      </template>
      <span class="sep">|</span>
      <Feedback icon/>
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
         signedInUser: state => state.auth.signedInUser,
      }),
      ...mapGetters({
        isSignedIn: 'auth/isSignedIn',
      }),
   },
   data: function() {
      return {
         menuOpen: false
      }
   },
   methods: {
      signinClicked() {
         this.$router.push("/signin")
      },
      showMenu() {
         this.menuOpen = true
      },
      hideMenu() {
         this.menuOpen = false
      },
      accountClick() {
         // this.$router.push("/account")
         this.menuOpen = !this.menuOpen
      },
      signOut() {
         this.$store.dispatch("auth/signout")
      }
   }
}
</script>

<style scoped>
.menu {
   text-align: right;
   padding: 10px;
   background-color: var(--color-secondary-blue);
   color: white;
}
.sep {
   margin: 0 15px;
}
#app .menu a {
   color: white;
}
#app .menu a:hover {
   text-decoration: none;
   border-bottom: 1px solid white;
}
#app .menu .menu-item {
   cursor: pointer;
    color: white;
}
#app .menu .menu-item:hover {
   border-bottom: 1px solid white;
   text-decoration: none;
}
.menu-item.account {
   position: relative;
   display: inline-block;
   border-bottom: 1px solid var(--color-secondary-blue);
}
#app .menu .menu-item.account:hover {
   border-bottom: 1px solid var(--color-secondary-blue);
}
.submenu {
   margin:0;
   padding: 2px 10px;
}
#app .menu .submenu a {
   color: #444;
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
.user-menu {
  position: absolute;
  z-index: 1000;
  color: #444;
  background: white;
  padding: 5px 0;
  border-radius: 0 0 7px 7px;
  border: 1px solid var(--color-secondary-blue);
  border-top: 11px solid var(--color-secondary-blue);
  right: 0;
  left: 0;
  font-size: 0.9em;
}
</style>

