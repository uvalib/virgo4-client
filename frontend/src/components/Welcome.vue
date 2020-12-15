<template>
   <div class="welcome">
      <h3 class="borders">Welcome to the newest version of the Virgo catalog</h3>
      <p>Virgo delivers high-quality search results through an easy-to-use interface that works on any device.</p>
      <p>You can use Virgo to conduct research, make requests, find and create Course Reserves, organize and share bookmarks, and set personal preferences for your own use of the system.</p>
      <template v-if="isKiosk == false">
         <p><b>Need assistance?</b> <a href="https://www.library.virginia.edu/askalibrarian/">Ask a Librarian</a> web chat is happy to help with questions large and small.</p>
      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapGetters({
         isKiosk: 'system/isKiosk',
      }),
   },
}
</script>

<style scoped lang="scss">
@media only screen and (min-width: 768px) {
  .welcome {
     width: 60%;
     padding-bottom:25px;
  }
}
@media only screen and (max-width: 768px) {
  .welcome {
     width: 90%;
  }
}
h3.borders {
   border-bottom: 1px solid var(--uvalib-grey-light);
   border-top: 1px solid var(--uvalib-grey-light);
   margin: 0;
   padding: 5px 0;
}
.welcome {
   margin: 10px auto 50px auto;
   text-align: left;
   color: var(  --uvalib-text);
}

</style>