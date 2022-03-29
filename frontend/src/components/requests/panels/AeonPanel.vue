<template>
  <div class='request-aeon pure-form'>
    <h2>Special Collections Request</h2>
    <div v-if="itemOptions.length > 1" class="item-selector">
      <h3>Select the item you want:</h3>
      <select v-model="selectedItem" @change="itemSelected">
          <option :value="{}">Select an item</option>
          <option v-for="l in itemOptions" :key="l.barcode" :value="l">{{l.label}}</option>
      </select>
    </div>
    <p class="error" v-if="request.errors.barcode">{{request.errors.barcode}}</p>

    <label class="special-instructions-input">
      <p>Add additional instructions if necessary:</p>
      <textarea v-model="request.aeon.specialRequest" placeholder="250 character limit" maxlength="250" rows="5"/>
    </label>

    <p>Click "Request" to proceed to the Special Collections request system, where you will be asked to select a visit date.</p>

    <V4Button mode="primary" class="request-button" @click="submitAeon" :disabled="request.buttonDisabled">Request</V4Button>

    <p class="notice" v-html="selectedItem.notice" v-if="selectedItem.notice"></p>

    <p>Questions? Please contact the Special Collections Library <br>
      at <a href="mailto:scpubserv@virginia.edu">scpubserv@virginia.edu</a> or <a href="tel:434-924-0896">434-924-0896</a>.
    </p>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useRequestStore } from "@/stores/request"
import analytics from '@/analytics'

const request = useRequestStore()
const selectedItem = ref({})
const itemOptions = computed(()=>{
  return request.activeOption.item_options
})

onMounted(()=>{
  if (itemOptions.value.length == 1){
    selectedItem.value = itemOptions.value[0]
    itemSelected()
  }
  analytics.trigger('Requests', 'REQUEST_STARTED', "aeon")
})

function itemSelected() {
  request.aeon.callNumber = selectedItem.value.label
  request.aeon.barcode = selectedItem.value.barcode
  request.aeon.notes = selectedItem.value.notes
  request.aeon.location = selectedItem.value.location
}
function submitAeon() {
  request.submitAeon()
}
</script>

<style lang="scss" scoped>
div.request-aeon {
   display: flex;
   flex-flow: column wrap ;
   justify-content: space-around;
   align-items: center;
   align-content: space-around;

  h2 {
    margin-top: 2em;
    padding-bottom: 0;
  }
  .item-selector {
    padding:0;
    margin-bottom: 10px;
  }
  .special-instructions-input {
    padding: 15px 0 0 0;
    width: 75%;
    textarea {
      width: 100%;
    }
  }
  p {
    margin: 20px 0;
  }
  .notice {
    color: var(--uvalib-red);
  }
}
</style>
