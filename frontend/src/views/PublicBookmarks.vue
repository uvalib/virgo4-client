<template>
   <div class="public-bookmarks">
      <h1>Bookmarks</h1>
      <div class="bookmarks-content">
         <h2>Under construction</h2>
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
export default {
   name: "public-bookmarks",
   computed: {
      ...mapState({
         authTriesLeft: state => state.user.authTriesLeft,
         authMessage: state => state.user.authMessage,
         lockedOut: state => state.user.lockedOut,
      }),
      ...mapGetters({
        hasAuthToken: 'user/hasAuthToken'
      }),
   },
   data: function()  {
      return {
         user: '',
         pin: ''
      }
   },
   watch: {
      authTriesLeft (newVal, oldVal) {
         if (newVal < oldVal ) {
            this.pin = ""
         }
      }
   },
   methods: {
      signinClicked() {
         this.$store.dispatch("user/signin", {barcode: this.user, password: this.pin})
      },
      netbadgeLogin() {
         this.$store.dispatch("user/netbadge")
      },
   }
}
</script>

<style scoped>
.public-bookmarks {
   min-height: 400px;
   position: relative;
   margin: 2vw auto 6vw;
   color: var(--uvalib-text);
}
.bookmarks-content {
   width: 60%;
   margin: 0 auto;
   text-align: left;
}
h2 {
   text-align: center;
}
@media only screen and (min-width: 768px) {
   .public-bookmarks {
     max-width: 55vw;
   }
   .bookmarks-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   .public-bookmarks {
     max-width: 95vw;
   }
   .bookmarks-content  {
       width: 95%;
   }
}
</style>