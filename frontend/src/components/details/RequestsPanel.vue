<template>
   <section class="requests" aria-live="polite">
      <div class="options">
         <PlaceHoldDialog v-if="request.hasOption('hold')" :settings="request.option('hold')" />
         <ScanRequestDialog v-if="request.hasOption('scan')"  :settings="request.option('scan')" />
         <VideoReserveDialog v-if="user.canMakeReserves && request.hasOption('videoReserve')"  :settings="request.option('videoReserve')" />
         <AeonRequestDialog v-if="request.hasOption('aeon')"  :settings="request.option('aeon')" />
         <template v-if="request.hasOption('pda')">
            <PDADialog :settings="request.option('pda')" v-if="request.option('pda').create_url" />
            <div  v-else>
               This item is now on order. Learn more about
               <a href="https://library.virginia.edu/about-available-to-order-items" aria-label="Available to Order"
                  style="text-decoration: underline;" target="_blank" title="Available to Order" aria-describedby="new-window"
                  class="piwik_link">Available to Order</a> items.
            </div>
         </template>
         <VirgoButton v-if="request.hasOption('directLink')"  label="Request a scan"
            @click="directLinkClicked(request.option('directLink').create_url)"
         />
      </div>
      <div class="help">
         Other request types and requests for different materials can be made from  <router-link to="/requests">"Requests"</router-link> under <router-link to="/account">"My Account"</router-link>.
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
