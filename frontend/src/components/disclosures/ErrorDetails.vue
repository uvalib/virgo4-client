<template>
   <div class="error-details">
      <DisclosureButton @clicked="clicked">Details</DisclosureButton>
      <OverlayPanel ref="details">
         <div class="content" v-html="props.details"></div>
      </OverlayPanel>
   </div>
</template>

<script setup>
import { ref } from 'vue'
import OverlayPanel from 'primevue/overlaypanel'
import DisclosureButton from "@/components/disclosures/DisclosureButton.vue"

const details = ref(null)

const props = defineProps({
   details: {
      type: String,
      required: true
   }
})

const clicked = ((event) => {
   details.value.toggle(event)
})
</script>

<style lang="scss" scoped>
.error-details {
   margin: 10px 0 0 20px;
}
</style>
