<template>
   <section class="requests" aria-live="polite">
      <PlaceHoldDialog v-if="request.hasOption('hold')" :settings="request.option('hold')" />
      <ScanRequestDialog v-if="request.hasOption('scan')"  :settings="request.option('scan')" />
      <VideoReserveDialog v-if="request.hasOption('videoReserve')"  :settings="request.option('videoReserve')" />
      <AeonRequestDialog v-if="request.hasOption('aeon')"  :settings="request.option('aeon')" />
      <template v-if="request.hasOption('pda')">
         <PDADialog v-if="request.option('pda').create_url" :settings="request.option('pda')" />
         <div v-else v-html="request.option('pda').description"></div>
      </template>
      <VirgoButton v-if="request.hasOption('directLink')"  label="Request a scan"
         @click="directLinkClicked(request.option('directLink').create_url)"
      />
   </section>
</template>

<script setup>
import PlaceHoldDialog from "@/components/requests/dialogs/PlaceHoldDialog.vue"
import AeonRequestDialog from "@/components/requests/dialogs/AeonRequestDialog.vue"
import ScanRequestDialog from "@/components/requests/dialogs/ScanRequestDialog.vue"
import VideoReserveDialog from "@/components/requests/dialogs/VideoReserveDialog.vue"
import PDADialog from "@/components/requests/dialogs/PDADialog.vue"
import { useRequestStore } from "@/stores/request"

const request = useRequestStore()

const directLinkClicked = ( (url) => {
   let tab = window.open(url, '_blank')
   tab.focus()
})

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
      gap: 1rem;
   }
}
@media only screen and (max-width: 768px) {
   .requests {
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      :deep(button.p-button) {
         width:300px;
      }
   }
}
</style>
