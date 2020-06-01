<template>
   <div class="activities">
      <router-link id="info-submenu" to="/account">My Information</router-link>
      <span class="sep">|</span>
      <router-link id="searches-submenu" to="/searches">My Searches</router-link>
      <span class="sep">|</span>
      <router-link id="bookmarks-submenu" to="/bookmarks">Bookmarks</router-link>
      <span class="sep">|</span>
      <router-link id="checkouts-submenu" to="/checkouts">Checkouts</router-link>
      <span class="sep">|</span>
      <router-link id="preferences-submenu" to="/preferences">Preferences</router-link>
      <span class="sep">|</span>
      <router-link id="requests-submenu" to="/requests">Requests</router-link>
      <span class="sep">|</span>
      <V4Button mode="text"  @click="signOut">Sign Out</V4Button>
   </div>
</template>

<script>
export default {
   methods: {
      signOut() {
         this.$store.dispatch("user/signout")
      },
   },
}
</script>

<style scoped>
.sep {
   margin: 0 10px;
}
.activities {
   text-align: left;
   margin-bottom: 15px;
   padding-bottom: 5px;
   margin-top: 0;
   border-bottom: 2px solid var(--color-brand-blue);
}
.activities {
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
}

#app .activities a.router-link-active {
   font-weight: bold;
   color: var(--color-brand-orange);
}
</style>