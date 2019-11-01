<template>
   <div class="activities">
      <router-link to="/account">My Account</router-link>
      <span class="sep">|</span>
      <router-link to="/bookmarks">Bookmarks</router-link>
      <span class="sep">|</span>
      <router-link to="/checkouts">Checked Out Items</router-link>
      <span class="sep">|</span>
      <router-link to="/notices">Notices</router-link>
      <span class="sep">|</span>
      <router-link to="/preferences">Preferences</router-link>
      <span class="sep">|</span>
      <div  @click="signOut" class="text-button">Sign Out</div>
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
   margin-top: 20px;
   margin-bottom: 35px;
   padding-top: 15px;
   border-top: 4px solid var(--color-brand-blue);
}
.activities .action {
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
}

#app .activities a.router-link-active {
   font-weight: bold;
   color: var(--color-brand-orange);
}
</style>