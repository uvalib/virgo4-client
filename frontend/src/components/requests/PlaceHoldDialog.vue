<template>
   <RequestDialog trigger="Request an item" title="Request Item" request="Place Hold"
      :show="request.activePanel=='hold'" :showSubmit="submitted == false && user.isSignedIn" :disabled="request.working"
      @opened="dialogOpened" @closed="dialogClosed" @submit="placeHold"
   >
      <SignIn v-if="!user.isSignedIn" />
      <div v-else-if="submitted == false" class="hold-request">
         <div class="row" v-if="request.items.length > 1">
            <label for="item-sel">Select an item<span class="required">(required)</span></label>
            <select v-model="selectedItem" id="item-sel">
               <option :value="null">Select an item</option>
               <option v-for="item in request.items" :value="item">{{ item.label }}</option>
            </select>
            <div v-if="missing.item" class="missing"><i class="pi pi-exclamation-triangle"></i>Item selection is required</div>
         </div>
         <div class="row">
            <label for="pickup-sel">Preferred pickup location<span class="required">(required)</span></label>
            <select v-model="pickupLibrary" @change="pickupLibraryChanged" id="pickup-sel">
               <option :value="null">Select a location</option>
               <option v-for="loc in pickLibraries" :value="loc.id">{{ loc.name }}</option>
            </select>
            <div v-if="missing.pickuo" class="missing"><i class="pi pi-exclamation-triangle"></i>Pickup location selection is required</div>
            <div class="help">
               <p>This pickup location is where you will go to retrieve items you've requested.</p>
               <p>
                  If you cannot pick your item up at the location(s) shown above, please
                  <a target="_blank" href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=30">use this form</a>
                  to request your item.
               </p>
            </div>
         </div>

         <div v-if="pickupLibrary == 'LEO' && (user.noILLiadAccount==true || user.accountInfo.leoAddress=='')"
            class="illiad-prompt ra-box ra-fiy"
         >
            It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
            <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank">here</a> and let us know where you would like your item to be delivered.
         </div>
            <div class="medium-rare-message" v-if="pickupLibrary == 'SPEC-COLL' ">
            <p>
               This item does not circulate. When you request this item from Ivy, it will be delivered to the Small Special Collections Library for you to use in the reading room only.
            </p>
            <p>
               <a target="_blank" href="https://library.virginia.edu/hours#special-collections-hours">Small Special Collections Reading Room Hours</a>
            </p>
         </div>

         <p class="error" v-if="request.errors.item_barcode">{{request.errors.item_barcode.join(', ')}}</p>
         <p class="error" v-if="request.errors.sirsi">{{request.errors.sirsi.join(', ')}}</p>

      </div>
      <ConfirmationPanel v-else />
   </RequestDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import RequestDialog from '@/components/requests/RequestDialog.vue'
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

const selectedItem = ref(null)
const pickupLibrary = ref(preferences.pickupLibrary.id)
const submitted = ref(false)
const missing = ref({item: false, pickup: false})

const pickLibraries = computed(()=>{
   if ( selectedItem.value && selectedItem.value.label.includes("Ivy limited circulation") ) {
      pickupLibrary.value = "SPEC-COLL"
      return [{id: "SPEC-COLL", name: "Small Special Collections Reading Room"}]
   }
   pickupLibrary.value = preferences.pickupLibrary.id
   return user.libraries
})

const dialogOpened = (() => {
   missing.value = {item: false, pickup: false}
   selectedItem.value = null
   submitted.value = false
   request.activePanel = "hold"
   restore.setActiveRequest( request.activePanel )
   restore.setURL(route.fullPath)
   restore.save()
   if (user.isSignedIn) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "placeHold")
      if ( request.items.length == 1) {
         selectedItem.value =request.items[0]
         setFocusID("pickup-sel")
      } else {
         setFocusID("item-sel")
      }
   }
})

const dialogClosed = (() =>{
   request.activePanel = "none"
   restore.setActiveRequest( request.activePanel )
})

const pickupLibraryChanged = (() => {
   if(pickupLibrary.value == "SPEC-COLL"){
      // Dont remember Medium Rare Location
      return
   }

   // when pickup library chanegs, also update preferences
   let pl = user.libraries.find( l=>l.id == pickupLibrary.value)
   preferences.updatePickupLibrary(pl)
})

const placeHold = ( async () => {
   missing.value = {item: false, pickup: false}
   if (selectedItem.value == null) {
      missing.value.item = true
      setFocusID("item-sel")
      return
   }
   if (pickupLibrary.value == null || pickupLibrary.value == "") {
      missing.value.pickup = true
      setFocusID("pickup-sel")
      return
   }
   await request.createHold(selectedItem.value, pickupLibrary.value)
   if ( request.failed == false ) {
      submitted.value = true
   }
})

</script>

<style lang="scss" scoped>
.hold-request {
   display: flex;
   flex-direction: column;
   gap: 25px;

   p {
      margin: 5px;
   }
   .required {
      margin-left: 5px;
      color: var(--uvalib-grey);
      font-size: .8em;
   }
   .row {
      display: flex;
      flex-direction: column;
      gap: 5px;
      .help {
         margin-top: 5px;
      }
      .missing {
         color: var(--uvalib-red-emergency);
         margin-left: 10px;
         display: flex;
         flex-flow: row nowrap;
         justify-content: flex-start;
         align-items: center;
         gap: 10px;
         i {
            font-size: 1.15em;
         }
      }
   }
   .illiad-prompt {
      a {
         text-decoration: underline !important;
         font-weight: 500;
      }
   }
   .medium-rare-message {
      border-radius: 4px;
      border: 2px solid var(--uvalib-red);
      padding: 5px;
   }
}
</style>