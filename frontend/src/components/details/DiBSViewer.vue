<template>
   <div class="dibs">
      <template v-if="activeIframe">
         <iframe title="Digital reserves viewer" :src="systemStore.dibsURL + '/item/' + props.barcode"></iframe>
      </template>
      <div v-else>
         <p>This item is available with electronic reserves. You may be required to sign in.</p>
         <V4Button @click="activeIframe = true">View</V4Button>
      </div>
   </div>
</template>
<script setup>
import { useSystemStore } from "@/stores/system"
import { ref } from "vue"
import V4Button from "../V4Button.vue";

const systemStore = useSystemStore()

const props = defineProps({
   barcode: {
      type: String,
      required: true,
   }
})
const activeIframe = ref(false)

</script>
<style lang="scss" scoped>
.dibs {
   iframe {
      width: 100%;
      height: 80vh;
   }
}
</style>