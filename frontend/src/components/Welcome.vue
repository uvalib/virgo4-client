<template>
   <div class="welcome">
      <h2 class="borders">
         Virgo is the Library catalog, where you can find books, articles, and more.
      </h2>
      <p>
         You can use Virgo to <router-link to="/requests">make requests</router-link>,
          <router-link to="/coursereserves">find</router-link> and create course reserves,
         <router-link to="/bookmarks">organize and share bookmarks</router-link>,
         and set <router-link to="/preferences">personal preferences</router-link> for your own use of the system.
      </p>
      <p  v-if="systemStore.isKiosk == false">
         Or, find
         <a href="https://guides.lib.virginia.edu/az.php" _targtet="_blank" aria-describedby="new-window">databases</a>,
         <a href="https://guides.lib.virginia.edu/" _targtet="_blank" aria-describedby="new-window">subject guides</a>, and
         <a href="https://guides.lib.virginia.edu/journalfinder" _targtet="_blank" aria-describedby="new-window">journals</a>.
      </p>
   </div>
</template>

<script setup>
import { useSystemStore } from "@/stores/system"
const systemStore = useSystemStore()
</script>

<style scoped lang="scss">
@media only screen and (min-width: 768px) {
   .welcome {
      width: 50%;
      padding-bottom: 25px;
   }
}

@media only screen and (max-width: 768px) {
   .welcome {
      width: 90%;
   }
}

h2.borders {
   border-bottom: 1px solid $uva-grey-100;
   border-top: 1px solid $uva-grey-100;
   margin: 0 !important;
   padding: 5px 0;
}

.welcome {
   margin: 10px auto 50px auto;
   text-align: left;
}
</style>