<template>
   <section class="requests" aria-live="polite">
      <div class="options">
         <PlaceHoldDialog v-if="request.options.hold" />
         <ScanRequestDialog v-if="request.options.scan" />
         <VideoReserveDialog v-if="user.canMakeReserves && request.options.videoReserve" />
         <AeonRequestDialog v-if="request.options.aeon"  />
         <template v-if="request.options.pda">
            <PDADialog v-if="request.options.pda.create_url" />
            <div  v-else>
               This item is now on order. Learn more about
               <a href="https://library.virginia.edu/about-available-to-order-items" aria-label="Available to Order"
                  style="text-decoration: underline;" target="_blank" title="Available to Order" aria-describedby="new-window"
                  class="piwik_link">Available to Order</a> items.
            </div>
         </template>
         <VirgoButton v-if="request.options.directLink"  label="Request a scan"
            @click="directLinkClicked(request.options.directLink.create_url)"
         />
      </div>
   </section>
</template>

<script setup>
import PlaceHoldDialog from "@/components/requests/dialogs/PlaceHoldDialog.vue"
import AeonRequestDialog from "@/components/requests/dialogs/AeonRequestDialog.vue"
import ScanRequestDialog from "@/components/requests/dialogs/ScanRequestDialog.vue"
import VideoReserveDialog from "@/components/requests/dialogs/VideoReserveDialog.vue"
import PDADialog from "@/components/requests/dialogs/PDADialog.vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"

const request = useRequestStore()
const user = useUserStore()

const directLinkClicked = ( (url) => {
   let tab = window.open(url, '_blank')
   tab.focus()
})

</script>

<style lang="scss" scoped>
.requests {
   flex: 1;
   display: flex;
   flex-direction: column;
   gap: 15px;
   padding-bottom: 20px;
}

@media only screen and (min-width: 768px) {
   .requests {
      .options {
         display: flex;
         flex-flow: row wrap;
         gap: 1rem;
      }
   }
}
@media only screen and (max-width: 768px) {
   .requests {
      .options {
         display: flex;
         flex-direction: column;
         align-items: center;
         gap: 1rem;
      }
   }
}
</style>
