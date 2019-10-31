<template>
   <div class="activities">
      <p><b>Activities</b></p>
      <div class="actions">
         <router-link to="/search">Search</router-link>
         <span class="sep">|</span>
         <router-link to="/course-reserves">Course Reserves</router-link>
         <span class="sep">|</span>
         <router-link to="/account">My Account</router-link>
         <span class="sep">|</span>
         <router-link to="/bookmarks">Bookmarks</router-link>
         <span class="sep">|</span>
         <router-link to="/checkouts">Checked Out Items</router-link>
         <span class="sep">|</span>
         <router-link to="/preferences">Preferences</router-link>
         <span class="sep">|</span>
         <div  @click="signOut" class="text-button">Sign Out</div>
      </div>
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
   margin-top: 35px;
   margin-bottom: 35px;
}
.activities p {
   border-bottom: 4px solid var(--color-brand-orange);
   padding-bottom: 5px;
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