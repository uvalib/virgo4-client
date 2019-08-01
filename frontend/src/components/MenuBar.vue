<template>
   <div class="menu">
      <template v-if="isSignedIn">
         <span @click="accountClick" class="menu-item">
            <i class="fas fa-user"></i>&nbsp;My Account ({{signedInUser}})
         </span>
         <span class="sep">|</span>
         <span @click="signOut" class="menu-item">Sign out</span>
      </template>   
      <template v-else>
         <span @click="netbadgeLogin" class="menu-item"><i class="fas fa-user"></i>&nbsp;Sign In</span>
         <span class="sep">|</span>
         <span @click="publicLogin" class="menu-item">Non-UVA User?</span>
      </template>
      <span class="sep">|</span>
      <a class="ask" target="_blank" href="https://library.virginia.edu/askalibrarian">
         <i class="fas fa-comments"></i>&nbsp;Ask a Librarian
      </a>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapState({
         signedInUser: state => state.auth.signedInUser,
      }),
      ...mapGetters({
        isSignedIn: 'auth/isSignedIn',
        hasAuthToken: 'auth/hasAuthToken'
      }),
   },
   methods: {
      netbadgeLogin() {
         if (this.hasAuthToken) {
            this.$store.dispatch("auth/netbadge")
         } else {
            this.$store.dispatch("auth/getAuthToken").then(_response => {
               this.$store.dispatch("auth/netbadge")
            })
         }
      },
      publicLogin() {

      },
      accountClick() {

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
#app .menu a.ask {
   color: white;
}
#app .menu a.ask:hover {
   text-decoration: none;
   border-bottom: 1px solid white;
}
.menu-item {
   cursor: pointer;
}
.menu-item:hover {
   border-bottom: 1px solid white;
}
</style>

