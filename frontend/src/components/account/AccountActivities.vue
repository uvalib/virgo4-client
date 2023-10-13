<template>
   <div class="activities">
      <router-link id="info-submenu" to="/account">My Information</router-link>
      <span class="sep">|</span>
      <router-link id="checkouts-submenu" to="/checkouts">Checkouts</router-link>
      <span class="sep">|</span>
      <router-link id="digital-submenu" to="/digital-deliveries">Digital Deliveries</router-link>
      <span class="sep">|</span>
      <router-link id="requests-submenu" to="/requests">Requests</router-link>
      <span class="sep">|</span>
      <router-link id="bookmarks-submenu" to="/bookmarks">Bookmarks</router-link>
      <span class="sep">|</span>
      <router-link id="searches-submenu" to="/searches">Searches</router-link>
      <span class="sep">|</span>
      <router-link id="preferences-submenu" to="/preferences">Preferences</router-link>
      <span class="sep">|</span>
      <template v-if="userStore.isAdmin || userStore.isPDAAdmin">
         <router-link id="preferences-submenu" to="/admin">Admin</router-link>
         <span class="sep">|</span>
      </template>
      <VirgoButton text @click="signOut">Sign Out</VirgoButton>
   </div>
</template>

<script setup>
import { useUserStore } from '../../stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
async function signOut() {
   const user = useUserStore()
   user.signout(true)
   router.push("/signedout")
}
</script>

<style scoped>
.sep {
   margin: 0 10px;
}
.activities {
   margin-bottom: 15px;
   padding-bottom: 5px;
   margin-top: 0;
   border-bottom: 2px solid var(--color-brand-blue);
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
    align-items: center;
}

#app .activities a.router-link-active {
   font-weight: bold;
   color: var(--uvalib-brand-orange);
}
</style>