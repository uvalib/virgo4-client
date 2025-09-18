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
      <template v-if="userStore.isAdmin">
         <router-link id="preferences-submenu" to="/admin">Admin</router-link>
         <span class="sep">|</span>
      </template>
      <VirgoButton link @click="signOut">Sign Out</VirgoButton>
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

<style scoped lang="scss">
.activities {
   margin-bottom: 15px;
   padding-bottom: 5px;
   margin-top: 0;
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
   align-items: center;
   gap: 2px;
}
#app .activities a {
   padding: 4px 8px;
}
#app .activities a.router-link-active {
   font-weight: bold;
   color: $uva-brand-orange;
   cursor: default;
   &:hover {
      text-decoration: none;
   }
}
</style>