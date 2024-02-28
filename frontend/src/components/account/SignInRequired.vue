<template>
   <div class="signout-content" v-if="userStore.isSignedIn == false">
      <h3>You must be signed in to access {{props.targetPage}}.</h3>
      <p>
         <VirgoButton text label="Sign in now" @click="signInClicked" :aria-label="`Sign in to view ${props.targetPage}`" />
      </p>
   </div>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const props = defineProps({
   targetPage: {
      type: String,
      required: true
   },
})

function signInClicked() {
   router.push("/signin")
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
