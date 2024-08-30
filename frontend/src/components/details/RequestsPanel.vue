<template>
   <section class="requests" aria-live="polite">
      <PlaceHoldDialog v-if="request.hasRequestOption('hold')" :settings="request.requestOption('hold')" />
      <ScanRequestDialog v-if="request.hasRequestOption('scan')"  :settings="request.requestOption('scan')" />
      <AeonRequestDialog v-if="request.hasRequestOption('aeon')"  :settings="request.requestOption('aeon')" />
   </section>
</template>

<script setup>
import PlaceHoldDialog from "@/components/requests/PlaceHoldDialog.vue"
import AeonRequestDialog from "@/components/requests/AeonRequestDialog.vue"
import ScanRequestDialog from "@/components/requests/ScanRequestDialog.vue"
import { useRequestStore } from "@/stores/request"

const request = useRequestStore()

</script>

<style lang="scss" scoped>
.requests {
   flex: 1;
   display: flex;
   padding-bottom: 20px;
}

@media only screen and (min-width: 768px) {
   .requests {
      flex-flow: row wrap;
      align-items: flex-start;
      gap: 10px;
   }
}
@media only screen and (max-width: 768px) {
   .requests {
      flex-direction: column;
      align-items: center;
      gap: 5px;
      :deep(button.p-button) {
         width:300px;
      }
   }
}
</style>
