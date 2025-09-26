<template>
   <VirgoButton @click="showDialog=true" class="trigger" label="Request in Special Collections" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" :draggable="false"
      header="Special Collections Request" @show="dialogOpened" @hide="dialogClosed"
   >
      <FormKit v-if="submitted == false" type="form" ref="aeonForm" :actions="false" @submit="submitAeon">
         <FormKit v-if="request.optionItems.length > 1" type="select" label="Select the item you want"
            v-model="selectedItem" id="aeon-item-sel" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="request.optionItems" validation="required"
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
      <template #footer>
         <template v-if="submitted == false">
            <VirgoButton severity="secondary" @click="showDialog=false" label="Cancel"/>
            <VirgoButton label="Next step: Go to Special Collections request system" @click="aeonForm.node.submit()" />
         </template>
         <VirgoButton v-else severity="secondary" id="request-done" @click="showDialog=false" label="Close"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import ConfirmationPanel from "@/components/requests/panels/ConfirmationPanel.vue"
import { useRequestStore } from "@/stores/request"
import analytics from '@/analytics'

const request = useRequestStore()
const selectedItem = ref(null)
const specialRequest = ref("")
const submitted = ref(false)
const aeonForm = ref()
const showDialog = ref(false)

const dialogOpened = (() => {
   submitted.value = false
   selectedItem.value = null
   specialRequest.value = ""
   request.activeRequest = "aeon"
   if (request.optionItems.length == 1) {
      selectedItem.value = request.optionItems[0].value
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
@media only screen and (min-width: 768px) {
   .trigger {
      width: auto;
   }
}
@media only screen and (max-width: 768px) {
   .trigger {
      width: 100%;
   }
}
.request-footer {
   display: flex;
   flex-direction: column;
   gap: 10px;
   p {
      margin: 0;
   }
}
</style>