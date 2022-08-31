<template>
   <div class="dibs">
      <template v-if="activeIframe">
         <iframe title="Digital reserves viewer"
               :src="systemStore.dibsURL + '/item/' + props.barcode"
               allowfullscreen
         ></iframe>
      </template>
      <div v-else>
         <p>This item is available online for use with electronic course reserves. You may be required to sign in.</p>
         <p>
            <b>Important:</b>
            Course materials delivered through the e-reserves system may not meet all accessibility requirements.
            For information about disability-related alternate course materials please contact the Student Disability Access Center at 434-243-5180
            or <a href="mailto:sdacAT@virginia.edu">sdacAT@virginia.edu</a>.
         </p>

         <div class="button-wrapper">
            <V4Button mode="tertiaty" @click="activeIframe = true">View this item online</V4Button>
         </div>
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
   b {
      margin-right: 5px;
   }

   .button-wrapper{
      display: flex;
      justify-content: center;
   }
}
</style>