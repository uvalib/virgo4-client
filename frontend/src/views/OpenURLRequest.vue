<template>
   <div class="request">
      <h1>Request an Item</h1>
      <component v-bind:is="request" @canceled="cancelRequest" @submitted="requestSubmitted"/>
   </div>
</template>

<script>

import { mapState } from "vuex"
import Article from "@/components/requests/openurl/Article"
import BookChapter from "@/components/requests/openurl/BookChapter"
export default {
   name: "openurl",
   components: {
      Article,BookChapter
   },
   computed: {
      ...mapState({
         sysError: state => state.system.error,
         buttonDisabled: state => state.requests.buttonDisabled,
         preferredPickupLibrary: state => state.preferences.pickupLibrary,
         request: state=> state.requests.openurl.documentType
      }),
   },
   watch: {
      $route() {
         this.initForm(this.$route.query)
      }
   },
   methods: {
      initForm( queryParams ) {
         let genre = queryParams['rtf.genre']
         if ( !genre ) {
            genre = queryParams['genre']
            if (!genre) {
               this.$router.push("/not_found")
               return
            }
         }
         if (Array.isArray(genre) ) {
            genre = genre[0]
         }
         this.$store.commit("requests/setOpenURLRequestGenre", genre)
      },
      cancelRequest() {
         this.$router.push("/")
      },
      requestSubmitted() {
         alert("submit")
      }
   },
   created() {
      this.initForm(this.$route.query)
   }
}
</script>
<style lang="scss" scoped>
.request {
   min-height: 400px;
   position: relative;
   margin: 0 auto;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
@media only screen and (min-width: 768px) {
   div.request  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.request  {
       width: 95%;
   }
}
</style>
