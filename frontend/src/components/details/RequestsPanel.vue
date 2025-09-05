<template>
   <section class="requests" aria-live="polite">
      <div class="options">
         <PlaceHoldDialog v-if="request.hasOption('hold')" />
         <ScanRequestDialog v-if="request.hasOption('scan')" />
         <VideoReserveDialog v-if="user.canMakeReserves && request.hasOption('videoReserve')" />
         <AeonRequestDialog v-if="request.hasOption('aeon')" />
         <VirgoButton v-if="request.hasOption('directLink')" label="Request a scan"
            @click="directLinkClicked(request.directLink)"
         />
      </div>
      <div class="help">
         Other request types and requests for different materials can be made from
         <router-link @click="helpClicked('requests')" to="/requests">"Requests"</router-link> under
         <router-link @click="helpClicked('account')" to="/account">"My Account"</router-link>.
      </div>
   </section>
</template>

<script setup>
import PlaceHoldDialog from "@/components/requests/dialogs/PlaceHoldDialog.vue"
import AeonRequestDialog from "@/components/requests/dialogs/AeonRequestDialog.vue"
import ScanRequestDialog from "@/components/requests/dialogs/ScanRequestDialog.vue"
import VideoReserveDialog from "@/components/requests/dialogs/VideoReserveDialog.vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import analytics from '@/analytics'

const request = useRequestStore()
const user = useUserStore()

const directLinkClicked = ( (url) => {
   let tab = window.open(url, '_blank')
   tab.focus()
})

const helpClicked = ((tgt) => {
   analytics.trigger('NavigationHelp', 'REQUEST_LINK_CLICKED', tgt)
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
