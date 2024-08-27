<template>
   <VirgoButton @click="showDialog=true" ref="trigger" label="Request an item" size="small" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Request Item"
      @show="dialogOpened" @hide="dialogClosed">
      <SignIn v-if="!user.isSignedIn" />
      <div v-else-if="submitted == false" class="hold-request">
         <div class="row" v-if="requestStore.items.length > 1">
            <label>Select an item<span class="required">(required)</span></label>
            <select v-model="selectedItem" id="hold-sel">
               <option :value="null">Select an item</option>
               <option v-for="item in requestStore.items" :value="item">{{ item.label }}</option>
            </select>
         </div>
         <div class="row">
            <label>Preferred pickup location<span class="required">(required)</span></label>
            <select v-model="pickupLibrary" @change="pickupLibraryChanged" id="pickup-sel">
               <option :value="null">Select a location</option>
               <option v-for="loc in pickLibraries" :value="loc.id">{{ loc.name }}</option>
            </select>
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
                  This item does not circulate. When you request this item from Ivy, it will be delivered to the Small Special Collections Library for you to use in the reading room only.
               </p>
               <p>
                  <a target="_blank" href="https://library.virginia.edu/hours#special-collections-hours">Small Special Collections Reading Room Hours</a>
               </p>
            </div>

            <p class="error" v-if="requestStore.errors.item_barcode">{{requestStore.errors.item_barcode.join(', ')}}</p>
            <p class="error" v-if="requestStore.errors.sirsi">{{requestStore.errors.sirsi.join(', ')}}</p>

         </div>
      </div>
      <ConfirmationPanel v-else />
      <template #footer>
         <VirgoButton v-if="submitted" severity="secondary" @click="showDialog=false" label="OK"/>
         <template v-else>
            <VirgoButton severity="secondary" @click="showDialog=false" label="Cancel"/>
            <VirgoButton label="Place Hold" :disabled="requestStore.working" @click="placeHold" />
         </template>
      </template>
   </Dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import ConfirmationPanel from "./panels/ConfirmationPanel.vue"
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
   show: {
      type: Boolean,
      default: false
   }
})

const user = useUserStore()
const restore = useRestoreStore()
const requestStore = useRequestStore()
const preferences = usePreferencesStore()
const route = useRoute()

const selectedItem = ref(null)
const pickupLibrary = ref(preferences.pickupLibrary.id)
const showDialog = ref(props.show)
const submitted = ref(false)

watch(() => props.show, (newVal) => {
   if ( newVal == true ) {
      showDialog.value = true
   }
})

const pickLibraries = computed(()=>{
   if ( selectedItem.value && selectedItem.value.label.includes("Ivy limited circulation") ) {
      pickupLibrary.value = "SPEC-COLL"
      return [{id: "SPEC-COLL", name: "Small Special Collections Reading Room"}]
   }
   pickupLibrary.value = preferences.pickupLibrary.id
   return user.libraries
})

const dialogOpened = (() =>{
   selectedItem.value = null
   submitted.value = false
   requestStore.activePanel = "hold"
   restore.setActiveRequest( requestStore.activePanel )
   restore.setURL(route.fullPath)
   restore.save()
   if (user.isSignedIn) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "placeHold")
      if ( requestStore.items.length == 1) {
         selectedItem.value =requestStore.items[0]
         setFocusID("pickup-sel")
      } else {
         setFocusID("hold-sel")
      }
   }
})

const dialogClosed = (() =>{
   requestStore.activePanel = "none"
   restore.setActiveRequest( requestStore.activePanel )
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
   await requestStore.createHold(selectedItem.value, pickupLibrary.value)
   if ( requestStore.failed == false ) {
      submitted.value = true
   }
})

</script>

<style lang="scss" scoped>
.hold-request {
   display: flex;
   flex-direction: column;
   gap: 15px;

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