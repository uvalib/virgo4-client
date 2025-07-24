<template>
   <div class="signout-content" v-if="userStore.isSignedIn == false">
      <div class="message">You must be signed in to access {{props.targetPage}}.</div>
      <VirgoButton label="Sign in now" @click="signInClicked" :aria-label="`Sign in to view ${props.targetPage}`" />
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
   margin: 0 auto;
   min-height: 400px;
   position: relative;
   text-align: center;
   .message {
      margin-bottom: 30px;
      font-size: 1.25rem;
   }
}
@media only screen and (min-width: 768px) {
   div.signout-content  {
       width: 70%;
   }
}
@media only screen and (max-width: 768px) {
   div.signout-content  {
       width: 95%;
   }
}
</style>
