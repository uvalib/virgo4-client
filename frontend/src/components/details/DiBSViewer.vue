<template>
   <div class="dibs">
      <template v-if="userStore.isSignedIn">
         <iframe :src="'https://reserves-dev.library.virginia.edu/item/' + props.barcode"></iframe>
      </template>
      <SignInRequired v-else targetPage="electronic reserves">


      </SignInRequired>
   </div>
</template>
<script setup>
import { useUserStore } from "@/stores/user"
import SignInRequired from "../account/SignInRequired.vue";

const userStore = useUserStore()

const props = defineProps({
   barcode: {
      type: String,
      required: true,
   }
})
</script>
<style lang="scss" scoped>
.dibs {
   iframe {
      width: 100%;
      height: 80vh;
   }
}
</style>