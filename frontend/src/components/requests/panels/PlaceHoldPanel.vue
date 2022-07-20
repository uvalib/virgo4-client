<template>
   <div class="place-hold">
      <div v-if="itemOptions.length > 1" class="item-selector">
         <h3>Select the item you want:</h3>
         <select id="hold-select" v-model="selectedItem" @change="itemSelected" aria-required="true" required="required">
            <option :value="{}">Select an item</option>
            <option v-for="l in itemOptions" :key="l.barcode" :value="l">{{l.label}}</option>
         </select>
         <p class="error" v-if="request.errors.item_barcode">{{request.errors.item_barcode.join(', ')}}</p>
      </div>
      <PickupLibrary />
      <V4Button mode="primary" class="request-button" @click="placeHold" :disabled="request.buttonDisabled">Place Hold</V4Button>
      <div v-if="preferences.pickupLibrary.id == 'LEO' && (user.noILLiadAccount==true || user.accountInfo.leoAddress=='')"
         class="illiad-prompt ra-box ra-fiy"
      >
         It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
         <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank">here</a> and let us know where you would like your item to be delivered.
      </div>
      <p class="error" v-if="request.errors.sirsi">{{request.errors.sirsi.join(', ')}}</p>
   </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import PickupLibrary from "@/components/preferences/PickupLibrary.vue"
import { useRequestStore } from "@/stores/request"
import { usePreferencesStore } from "@/stores/preferences"
import { useUserStore } from "@/stores/user"
import analytics from '@/analytics'

const request = useRequestStore()
const preferences = usePreferencesStore()
const user = useUserStore()
const selectedItem = ref({})

const itemOptions = computed(()=>{
  return request.activeOption.item_options
})

onMounted(()=>{
   analytics.trigger('Requests', 'REQUEST_STARTED', "placeHold")
   if (itemOptions.value.length == 1) {
      selectedItem.value = itemOptions.value[0]
      itemSelected()
   }
   setTimeout( () => {
      let ele = document.getElementById("hold-select")
      if ( ele ) {
         ele.focus()
      } else {
         ele = document.getElementById("pickup-sel")
         if ( ele ) {
            ele.focus()
         }
      }
   }, 150)
})

function itemSelected() {
   request.hold.itemLabel = selectedItem.value.label
   request.hold.itemBarcode = selectedItem.value.barcode
   request.errors.item_barcode = null
   request.errors.sirsi = null
}
function placeHold() {
   request.createHold()
}
</script>

<style lang="scss" >
.illiad-prompt {
   margin: 15px;
   min-height: initial !important;
   a {
      text-decoration: underline !important;
      font-weight: 500;
   }
}
div.place-hold {
   display: flex;
   flex-flow: column wrap;
   justify-content: space-around;
   align-items: center;
   align-content: space-around;

   h2 {
      margin: 5px 0 10px 0 !important;
      background: white !important;
      border: 0 !important;
      padding: 0px !important;
   }

   @media only screen and (max-width: 768px) {
      align-items: flex-start;
   }
}
.place-hold > * {
   margin-bottom: 10px;
   min-height: 2em;
}
.item-selector {
   padding-bottom: 20px;
}
.request-button {
   padding: 10px;
}
.error {
  color: var(--color-error)
}

</style>
