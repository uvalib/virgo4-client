<template>
   <div class="place-hold">
      <h2>Request Item</h2>
      <FormKit type="form" id="hold-request" :actions="false" @submit="placeHold">
         <FormKit v-if="itemOptions.length > 1" type="select" label="Select the item you want"
            v-model="selectedItem" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="itemOptions" validation="required" id="scan-select"
         />
         <FormKit type="select" label="Preferred pickup location" v-model="pickupLibrary"
            placeholder="Select a location" @input="pickupLibraryChanged" id="pickup-sel"
            :options="pickupLibraries" validation="required"
         />
         <p>This pickup location is where you will go to retrieve items you've requested.</p>
         <p>
            If you cannot pick your item up at the location(s) shown below, please
            <a target="_blank" href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=30">use this form</a>
            to request your item.
         </p>

         <div v-if="pickupLibrary == 'LEO' && (userStore.noILLiadAccount==true || userStore.accountInfo.leoAddress=='')"
            class="illiad-prompt ra-box ra-fiy"
         >
            It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
            <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank">here</a> and let us know where you would like your item to be delivered.
         </div>

         <p class="error" v-if="requestStore.errors.item_barcode">{{requestStore.errors.item_barcode.join(', ')}}</p>
         <p class="error" v-if="requestStore.errors.sirsi">{{requestStore.errors.sirsi.join(', ')}}</p>
         <V4FormActions :hasCancel="false" submitLabel="Place Hold" submitID="submit-hold" :disabled="requestStore.buttonDisabled" />
      </FormKit>
   </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useRequestStore } from "@/stores/request"
import { usePreferencesStore } from "@/stores/preferences"
import { useUserStore } from "@/stores/user"
import analytics from '@/analytics'

const requestStore = useRequestStore()
const preferences = usePreferencesStore()
const userStore = useUserStore()

const selectedItem = ref(null)
const pickupLibrary = ref(preferences.pickupLibrary.id)

const pickupLibraries = computed(()=>{
   let out = {}
   userStore.libraries.forEach(l => {
      out[l.id] = l.name
   })
   return out
})

const itemOptions = computed(()=>{
   let out = []
   requestStore.activeOption.item_options.forEach( i => {
      out.push( {label: i.label, value: {barcode: i.barcode, label: i.label} })
   })
   return out
})

function pickupLibraryChanged() {
   // when pickup library chanegs, also update preferences
   let pl = userStore.libraries.find( l=>l.id == pickupLibrary.value)
   preferences.updatePickupLibrary(pl)
}

onMounted(()=>{
   analytics.trigger('Requests', 'REQUEST_STARTED', "placeHold")
   if (itemOptions.value.length == 1) {
      selectedItem.value = itemOptions.value[0].value
   }
   let ele = document.getElementById("hold-select")
   if ( ele ) {
      ele.focus()
   } else {
      ele = document.getElementById("pickup-sel")
      if ( ele ) {
         ele.focus()
      }
   }
})

function placeHold() {
   requestStore.createHold(selectedItem.value, pickupLibrary.value)
}
</script>

<style lang="scss" >
.illiad-prompt {
   margin: 15px 0;
   min-height: initial !important;
   a {
      text-decoration: underline !important;
      font-weight: 500;
   }
}
div.place-hold {
   text-align: left;
   width: 50%;
   color: var(--uvalib-text);
   margin: 0 auto;
   .error {
      color: var(--color-error)
   }
}
</style>
