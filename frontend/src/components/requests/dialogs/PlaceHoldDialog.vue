<template>
   <RequestDialog trigger="Request an item" title="Request Item" request="Place Hold"
      :show="request.activeRequest=='hold'" :showSubmit="submitted == false && user.isSignedIn" :disabled="request.working"
      @opened="dialogOpened" @closed="dialogClosed" @submit="holdForm.node.submit()"
   >
      <SignIn v-if="!user.isSignedIn" />
      <FormKit v-else-if="submitted == false" type="form" ref="holdForm" :actions="false" @submit="placeHold">
         <FormKit v-if="request.items.length > 1" type="select" label="Select the item you want"
            v-model="selectedItem" id="item-sel" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="request.items" validation="required"
         />
         <FormKit type="select" label="Preferred pickup location" v-model="pickupLibrary"
            placeholder="Select a location" @input="pickupLibraryChanged" id="pickup-sel"
            :options="pickupLibraries" validation="required"
         />
         <div class="help">
            <p>This pickup location is where you will go to retrieve items you've requested.</p>
            <p>
               If you cannot pick your item up at the location(s) shown above, please
               <a target="_blank" href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=30">use this form</a>
               to request your item.
            </p>
         </div>

         <div v-if="pickupLibrary == 'LEO' && (user.noILLiadAccount==true || user.accountInfo.leoAddress=='')"
            class="illiad-prompt ra-box ra-fiy"
         >
            It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
            <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank">here</a> and let us know where you would like your item to be delivered.
         </div>
            <div class="medium-rare-message" v-if="pickupLibrary == 'SPEC-COLL' ">
            <p>
               This item does not circulate.<br/>When you request this item from Ivy, it will be delivered to the Small Special Collections Library for you to use in the reading room only.
            </p>
            <p>
               <a target="_blank" href="https://library.virginia.edu/hours#special-collections-hours">Small Special Collections Reading Room Hours</a>
            </p>
         </div>

         <p class="error" v-if="request.errors.item_barcode">{{request.errors.item_barcode.join(', ')}}</p>
         <p class="error" v-if="request.errors.sirsi">{{request.errors.sirsi.join(', ')}}</p>

      </FormKit>
      <ConfirmationPanel v-else />
   </RequestDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import RequestDialog from '@/components/requests/dialogs/RequestDialog.vue'
import ConfirmationPanel from "@/components/requests/panels/ConfirmationPanel.vue"
import SignIn from "@/views/SignIn.vue"
import { useRestoreStore } from "@/stores/restore"
import { useRoute } from "vue-router"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"
import { useRequestStore } from "@/stores/request"
import analytics from '@/analytics'
import { setFocusID } from '@/utils'

const props = defineProps({
   settings: {
      type: Object,
      required: true
   },
})

const user = useUserStore()
const restore = useRestoreStore()
const request = useRequestStore()
const preferences = usePreferencesStore()
const route = useRoute()

const holdForm = ref()
const selectedItem = ref(null)
const pickupLibrary = ref()
const submitted = ref(false)

const pickupLibraries = computed(()=>{
   if ( selectedItem.value && selectedItem.value.label.includes("Ivy limited circulation") ) {
      pickupLibrary.value = "SPEC-COLL"
      return [{value: "SPEC-COLL", label: "Small Special Collections Reading Room"}]
   }
   let libs = []
   user.libraries.forEach( l => {
      libs.push({value: l.id, label: l.name})
   })
   return libs
})

const dialogOpened = (() => {
   selectedItem.value = null
   submitted.value = false
   request.$reset
   request.activeRequest = "hold"
   restore.setActiveRequest( request.activeRequest )
   restore.setURL(route.fullPath)
   restore.save()
   if ( preferences.pickupLibrary && preferences.pickupLibrary.id != "") {
      pickupLibrary.value = preferences.pickupLibrary.id
   }
   if (user.isSignedIn) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "placeHold")
      if ( request.items.length == 1) {
         selectedItem.value = request.items[0].value
         setFocusID("pickup-sel")
      } else {
         setFocusID("item-sel")
      }
   }
})

const dialogClosed = (() =>{
   request.activeRequest = "none"
   restore.setActiveRequest( request.activeRequest )
   restore.save()
})

const pickupLibraryChanged = ((value) => {
   if(value == "SPEC-COLL"){
      // Dont remember Medium Rare Location
      return
   }

   // when pickup library chanegs, also update preferences
   let pl = user.libraries.find( l=>l.id == value)
   preferences.updatePickupLibrary(pl)
})

const placeHold = ( async () => {
   await request.createHold(selectedItem.value, pickupLibrary.value)
   if ( request.failed == false ) {
      submitted.value = true
   }
})

</script>

<style lang="scss" scoped>
form {
   .error {
      color: $uva-red-A;
      font-style: italic;
   }
   p {
      margin: 5px;
   }
   .help {
      margin-top: 5px;
   }

   .illiad-prompt {
      a {
         text-decoration: underline !important;
         font-weight: 500;
      }
   }
   .medium-rare-message {
      border-radius: 4px;
      border: 2px solid $uva-red;
      padding: 5px;
   }
}
</style>