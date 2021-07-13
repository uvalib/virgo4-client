<template>
   <div class="signout-content" v-if="isSignedIn == false">
      <h3>You must be signed in to access {{targetPage}}.</h3>
      <p>
         <V4Button mode="text" id="link" @click="signInClicked" :aria-label="`Sign in to view ${targetPage}`">
            Sign in now
         </V4Button>
      </p>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      targetPage: {
         type: String,
         required: true
      },
   },
   computed: {
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
   },
   methods: {
      signInClicked() {
         this.$router.push("/signin")
      },
   }
}
</script>

<style lang="scss" scoped>

.signout-content {
   width: 60%;
   margin: 0 auto;
   position: relative;
   text-align: center;
}
@media only screen and (min-width: 768px) {
   div.signout-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.signout-content  {
       width: 95%;
   }
}
</style>
