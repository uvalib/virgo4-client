<template>
   <RequestDialog trigger="Request in Special Collections" title="Special Collections Request"
      request="Next step: Go to Special Collections request system"
      :show="request.activeRequest=='aeon'" :showSubmit="submitted == false" :disabled="request.working"
      @opened="dialogOpened" @closed="dialogClosed" @submit="aeonForm.node.submit()"
   >
      <FormKit v-if="submitted == false" type="form" ref="aeonForm" :actions="false" @submit="submitAeon">
         <FormKit v-if="request.items.length > 1" type="select" label="Select the item you want"
            v-model="selectedItem" id="aeon-item-sel" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="request.items" validation="required"
         />
         <FormKit label="Add additional instructions if necessary" type="textarea"
            v-model="specialRequest" :rows="5" id="aeon-item-notes"
            :validation-messages="{length: 'Maximum length is 250 characters.'}"
            help="250 character limit"
            validation="length:0,250"
         />
         <div class="request-footer">
            <p class="notice" v-html="selectedItem.notice" v-if="selectedItem != null && selectedItem.notice"></p>
            <p>
               Questions? Please contact the Special Collections Library
               at <a href="mailto:scpubserv@virginia.edu">scpubserv@virginia.edu</a> or
               <a href="tel:434-924-0896">434-924-0896</a>.
            </p>
         </div>
      </FormKit>
      <ConfirmationPanel v-else />
   </RequestDialog>
</template>

<script setup>
import { ref } from 'vue'
import RequestDialog from '@/components/requests/dialogs/RequestDialog.vue'
import ConfirmationPanel from "@/components/requests/panels/ConfirmationPanel.vue"
import { useRequestStore } from "@/stores/request"
import analytics from '@/analytics'
import { setFocusID } from '@/utils'

const props = defineProps({
   settings: {
      type: Object,
      required: true
   },
})

const request = useRequestStore()
const selectedItem = ref(null)
const specialRequest = ref("")
const submitted = ref(false)
const aeonForm = ref()

const dialogOpened = (() => {
   submitted.value = false
   selectedItem.value = null
   specialRequest.value = ""
   request.activeRequest = "aeon"
   if (request.items.length == 1) {
      selectedItem.value = request.items[0].value
      setFocusID("aeon-item-notes")
   } else {
      setFocusID("aeon-item-sel")
   }
   analytics.trigger('Requests', 'REQUEST_STARTED', "aeon")
})

const dialogClosed = (() => {
   request.activeRequest = "none"
})

const submitAeon = (() => {
   request.submitAeon(selectedItem.value, specialRequest.value)
   submitted.value = true
})
</script>

<style lang="scss" scoped>
.request-footer {
   display: flex;
   flex-direction: column;
   gap: 10px;
   p {
      margin: 0;
   }
}
</style>