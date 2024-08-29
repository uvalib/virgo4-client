<template>
   <RequestDialog trigger="Request in Special Collections" title="Special Collections Request" request="Request"
      :show="request.activePanel=='aeon'" :showSubmit="submitted == false" :disabled="request.working"
      @opened="dialogOpened" @closed="dialogClosed" @submit="submitAeon"
   >
      <div v-if="submitted == false" class="aeon-request">
         <div class="row" v-if="request.items.length > 1">
            <label for="aeon-item-sel">Select an item<span class="required">(required)</span></label>
            <select v-model="selectedItem" id="aeon-item-sel">
               <option :value="null">Select an item</option>
               <option v-for="item in request.items" :value="item">{{ item.label }}</option>
            </select>
            <div v-if="missingItem" class="missing"><i class="pi pi-exclamation-triangle"></i>Item selection is required</div>
         </div>
         <div class="row">
            <label for="aeon-item-notes">Add additional instructions if necessary</label>
            <textarea id="aeon-item-notes" rows="5"></textarea>
         </div>
         <p>
            Click "Request" to proceed to the Special Collections request system,
            where you will be asked to select a visit date.
         </p>
         <div class="request-footer">
            <p class="notice" v-html="selectedItem.notice" v-if="selectedItem != null && selectedItem.notice"></p>
            <p>
               Questions? Please contact the Special Collections Library
               at <a href="mailto:scpubserv@virginia.edu">scpubserv@virginia.edu</a> or
               <a href="tel:434-924-0896">434-924-0896</a>.
            </p>
         </div>
      </div>
      <ConfirmationPanel v-else />
   </RequestDialog>
</template>

<script setup>
import { ref } from 'vue'
import RequestDialog from '@/components/requests/RequestDialog.vue'
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
const missingItem = ref(false)

const dialogOpened = (() => {
   submitted.value = false
   selectedItem.value = null
   specialRequest.value = ""
   request.activePanel = "aeon"
   if (request.items.length == 1) {
      selectedItem.value =request.items[0]
      setFocusID("aron-item-notes")
   } else {
      setFocusID("aeon-item-sel")
   }
   analytics.trigger('Requests', 'REQUEST_STARTED', "aeon")
})

const dialogClosed = (() => {
   request.activePanel = "none"
})

const submitAeon = (() => {
   missingItem.value = false
   if (selectedItem.value == null) {
      missingItem.value = true
      setFocusID("aeon-item-sel")
      return
   }
   request.submitAeon(selectedItem.value, specialRequest.value)
   submitted.value = true
})
</script>

<style lang="scss" scoped>
.aeon-request {
   display: flex;
   flex-direction: column;
   gap: 15px;
   p {
      margin:0;
   }
   .row {
      display: flex;
      flex-direction: column;
      gap: 5px;
   }
}
</style>