<template>
   <nav class="menu">
      <template v-if="isSignedIn">
         <span @click="accountClick" class="menu-item">
            <i class="fas fa-user"></i>&nbsp;My Account ({{signedInUser}})
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
      <a class="ask" target="_blank" href="https://library.virginia.edu/askalibrarian">
         <i class="fas fa-comments"></i>&nbsp;Ask a Librarian
      </a>
   </nav>
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
      }),
   },
   methods: {
      signinClicked() {
         this.$router.push("/signin")
      },
      accountClick() {
         this.$router.push("/account")
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
</style>

