<template>
   <div class='request-aeon'>
      <h2>Special Collections Request</h2>
      <FormKit type="form" id="aeon-request" :actions="false" @submit="submitAeon">
         <FormKit v-if="itemOptions.length > 1" type="select" label="Select the item you want"
            v-model="selectedItem" id="item-select" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="itemOptions" validation="required"
         />
         <FormKit label="Add additional instructions if necessary" type="textarea"
            v-model="specialRequest" :rows="5" id="item-notes"
            :validation-messages="{length: 'Maximum length is 250 characters.'}"
            help="250 character limit"
            validation="length:0,250"
         />

         <p>
            Click "Request" to proceed to the Special Collections request system,
            where you will be asked to select a visit date.
         </p>

         <V4FormActions :hasCancel="false"  buttonAlign="center" submitLabel="Request"
            submitID="submit-aeon" :disabled="request.buttonDisabled"/>
      </FormKit>
      <div class="request-footer">
         <p class="notice" v-html="selectedItem.notice" v-if="selectedItem != null && selectedItem.notice"></p>
         <p>
            Questions? Please contact the Special Collections Library <br>
            at <a href="mailto:scpubserv@virginia.edu">scpubserv@virginia.edu</a> or
            <a href="tel:434-924-0896">434-924-0896</a>.
         </p>
      </div>
   </div>
</template>

<script setup>
import { onMounted, computed, ref } from "vue"
import { useRequestStore } from "@/stores/request"
import analytics from '@/analytics'
import { setFocusID } from '@/utils'

const request = useRequestStore()

const selectedItem = ref(null)
const specialRequest = ref("")

const itemOptions = computed(() => {
   let out = []
   request.activeOption.item_options.forEach( i => {
      out.push( {label: i.label, value: i} )
   })
   return out
})

onMounted(() => {
   if (itemOptions.value.length == 1) {
      selectedItem.value = itemOptions.value[0].value
      setFocusID("item-notes")
   } else {
      setFocusID("item-select")
   }
   analytics.trigger('Requests', 'REQUEST_STARTED', "aeon")
})

const submitAeon = (() => {
   request.submitAeon(selectedItem.value, specialRequest.value)
})
</script>

<style lang="scss" scoped>
div.request-aeon {
   display: flex;
   flex-flow: column wrap;
   justify-content: space-around;
   align-items: center;
   align-content: space-around;
   gap: 15px;

   .request-footer {
      text-align: center;
   }
}
</style>
