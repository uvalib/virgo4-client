<template>
   <RequestDialog trigger="Order this Item" title="Order Iten" request="Submit Order"
      :show="request.activeRequest=='pda'" :showSubmit="false" :disabled="request.working"
      @opened="dialogOpened" @closed="dialogClosed"
   >
      <SignIn v-if="!user.isSignedIn" />
      <div v-else-if="submitted==false" class="working">
         <V4Spinner message="Sending Order..."></V4Spinner>
      </div>
      <ConfirmationPanel v-else />
   </RequestDialog>
</template>

<script setup>
import { ref } from 'vue'
import SignIn from "@/views/SignIn.vue"
import RequestDialog from '@/components/requests/dialogs/RequestDialog.vue'
import ConfirmationPanel from "@/components/requests/panels/ConfirmationPanel.vue"
import { useRequestStore } from "@/stores/request"
import { useRestoreStore } from "@/stores/restore"
import { useRoute } from "vue-router"
import { useUserStore } from "@/stores/user"
import analytics from '@/analytics'

const props = defineProps({
   settings: {
      type: Object,
      required: true
   },
})

const route = useRoute()
const request = useRequestStore()
const restore = useRestoreStore()
const user = useUserStore()
const submitted = ref(false)

const dialogOpened = (async () => {
   submitted.value = false
   request.activeRequest = "pda"
   restore.setActiveRequest( request.activeRequest )
   restore.setURL(route.fullPath)
   restore.save()
   if (user.isSignedIn) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "pda")
      await request.submitPDARequest()
      submitted.value = true
   }
})

const dialogClosed = (() => {
   request.activeRequest = "none"
   restore.setActiveRequest( request.activeRequest )
   restore.save()
})
</script>

<style lang="scss" scoped>
.working {
   text-align: center;
   margin: 0 100px 25px 100px;
}
</style>