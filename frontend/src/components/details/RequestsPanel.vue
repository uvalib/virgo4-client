<template>
   <section class="requests" aria-live="polite">
      <PlaceHoldDialog v-if="request.hasRequestOption('hold')" :settings="request.requestOption('hold')" />
      <VirgoButton v-if="request.hasRequestOption('scan')" label="Request a scan" size="small" />
      <AeonRequestDialog v-if="request.hasRequestOption('aeon')"  :settings="request.requestOption('aeon')" />
   </section>
</template>

<script setup>
import PlaceHoldDialog from "@/components/requests/PlaceHoldDialog.vue"
import AeonRequestDialog from "@/components/requests/AeonRequestDialog.vue"
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
      align-items: stretch;
      gap: 5px;
      :deep(button.p-button) {
         max-width:350px !important;
      }
   }
}
</style>
