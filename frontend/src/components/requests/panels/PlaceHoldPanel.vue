<template>
   <div class="place-hold">
      <h2>Request Item</h2>
      <FormKit type="form" id="hold-request" :actions="false" @submit="placeHold">
         <FormKit v-if="itemOptions.length > 1" type="select" label="Select the item you want"
            v-model="selectedItem" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="itemOptions" validation="required" id="hold-select"
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

         <div  class="medium-rare-message" v-if="pickupLibrary == 'SPEC-COLL' ">
         <p>
            This item does not circulate. When you request this item from Ivy, it will be delivered to the Small Special Collections Library for you to use in the reading room only.
         </p>
         <p><a target="_blank" href="https://library.virginia.edu/hours#special-collections-hours">Small Special Collections Reading Room Hours</a></p>
         </div>

         <p class="error" v-if="requestStore.errors.item_barcode">{{requestStore.errors.item_barcode.join(', ')}}</p>
         <p class="error" v-if="requestStore.errors.sirsi">{{requestStore.errors.sirsi.join(', ')}}</p>
         <V4FormActions :hasCancel="false" submitLabel="Place Hold" submitID="submit-hold" :disabled="requestStore.buttonDisabled" />
      </FormKit>
   </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useRequestStore } from "@/stores/request"
import { usePreferencesStore } from "@/stores/preferences"
import { useUserStore } from "@/stores/user"
import analytics from '@/analytics'
import { setFocusID } from '@/utils'

const requestStore = useRequestStore()
const preferences = usePreferencesStore()
const userStore = useUserStore()

const selectedItem = ref(null)
const pickupLibrary = ref(preferences.pickupLibrary.id)

const pickupLibraries = ref({})

const formattedPickupOptions = computed(()=>{
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

const pickupLibraryChanged = (() => {
   if(pickupLibrary.value == "SPEC-COLL"){
      // Dont remember Medium Rare Location
      return
   }

   // when pickup library chanegs, also update preferences
   let pl = userStore.libraries.find( l=>l.id == pickupLibrary.value)
   preferences.updatePickupLibrary(pl)
})

watch(selectedItem, async (newItem, oldItem) => {
   if( newItem && newItem.label.includes("Ivy limited circulation") ) {
      // Medium rare items only deliver to Special Collections
      let medRareLocation = {}
      medRareLocation["SPEC-COLL"] = "Small Special Collections Reading Room"
      pickupLibraries.value = medRareLocation
      pickupLibrary.value = "SPEC-COLL"

   } else if(oldItem && oldItem.label.includes("Ivy limited circulation")){
      // Reset originals
      pickupLibraries.value = formattedPickupOptions.value
      pickupLibrary.value = {}
   }
})

onMounted(()=>{
   analytics.trigger('Requests', 'REQUEST_STARTED', "placeHold")
   pickupLibraries.value = formattedPickupOptions.value
   if (itemOptions.value.length == 1) {
      selectedItem.value = itemOptions.value[0].value
      setFocusID("pickup-sel")
   } else {
      setFocusID("hold-select")
   }
})

const placeHold = (() => {
   requestStore.createHold(selectedItem.value, pickupLibrary.value)
})
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
.medium-rare-message {
   border: 2px solid var(--uvalib-red);
   padding: 10px;
}
</style>
