<template>
   <VirgoButton class="trigger" @click="showDialog=true" label="Request an item" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" :draggable="false"
      header="Request Item" @show="dialogOpened" @hide="dialogClosed"
   >
      <SignIn v-if="!user.isSignedIn" :embedded="true"/>
      <div v-else-if="user.noILSAccount" class="no-ils-account">
         <div v-if="user.accountRequested">
            Your UVA Library account is processing and will be created within 1-2 business days.<br/>
            You will be notified via email when the account has been created. Until that time, you cannot make item requests.
         </div>
         <template v-else >
            <div>You do not currently have a UVA Library account and cannot make item requests.</div>
            <VirgoButton @click="requestAccountClicked()" label="Request Account" />
         </template>
         <div>If you have any questions or problems, please contact <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.</div>
      </div>
      <FormKit v-else-if="submitted == false" type="form" ref="holdForm" :actions="false" @submit="placeHold">
         <FormKit v-if="request.optionItems.length > 1" type="select" label="Select the item you want"
            v-model="selectedItem" id="item-sel" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}" :options="request.optionItems"
            validation="required" />
         <FormKit type="select" label="Preferred pickup location" v-model="pickupLibrary"
            placeholder="Select a location" @input="pickupLibraryChanged" id="pickup-sel" :options="pickupLibraries"
            validation="required" />
         <div class="help">
            <p>This pickup location is where you will go to retrieve items you've requested.</p>
            <p>
               If you cannot pick your item up at the location(s) shown above, please
               <a target="_blank" aria-describedby="new-window"
                  href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=30">use this form</a>
               to request your item.
            </p>
         </div>

         <div v-if="pickupLibrary == 'LEO'">
            <div v-if="!user.hasIlliad" class="no-illiad">
               <div>No ILLiad account found.</div>
               <ILLiadRegistration />
            </div>
            <ILLiadMessages v-else-if="user.illiadBlocked" />
            <div v-else-if="user.leoLocation == ''" class="illiad-prompt ra-box ra-fiy">
               It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could
               you please go
               <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank"
                  aria-describedby="new-window">here</a> and let us know where you would like your item to be delivered.
            </div>
         </div>
         <div class="medium-rare-message" v-if="pickupLibrary == 'SPEC-COLL'">
            <p>
               This item does not circulate.<br />When you request this item from Ivy, it will be delivered to the Small
               Special Collections Library for you to use in the reading room only.
            </p>
            <p>
               <a target="_blank" href="https://library.virginia.edu/hours#special-collections-hours">Small Special
                  Collections Reading Room Hours</a>
            </p>
         </div>

         <p class="error" v-if="request.errors.item_barcode">{{request.errors.item_barcode.join(', ')}}</p>
         <p class="error" v-if="request.errors.sirsi">{{request.errors.sirsi.join(', ')}}</p>
      </FormKit>
      <ConfirmationPanel v-else />
      <template #footer>
         <template v-if="submitted == false && user.isSignedIn && user.noILSAccount == false">
            <VirgoButton severity="secondary" @click="showDialog=false" label="Cancel"/>
            <VirgoButton label="Request an item" @click="holdForm.node.submit()" />
         </template>
         <VirgoButton v-else severity="secondary" id="request-done" @click="showDialog=false" label="Close"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import ConfirmationPanel from "@/components/requests/panels/ConfirmationPanel.vue"
import SignIn from "@/views/SignIn.vue"
import { useRestoreStore } from "@/stores/restore"
import { useRoute } from "vue-router"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"
import { useRequestStore } from "@/stores/request"
import analytics from '@/analytics'
import ILLiadRegistration from '@/components/modals/ILLiadRegistration.vue'
import ILLiadMessages from '@/components/ILLiadMessages.vue'

const user = useUserStore()
const restore = useRestoreStore()
const request = useRequestStore()
const preferences = usePreferencesStore()
const route = useRoute()

const holdForm = ref()
const selectedItem = ref(null)
const pickupLibrary = ref()
const submitted = ref(false)
const showDialog = ref(false)

const pickupLibraries = computed(()=>{
   if ( selectedItem.value && selectedItem.value.callNumber.includes("Ivy limited circulation") ) {
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
   request.activeRequest = "hold"
   restore.setActiveRequest( request.activeRequest )
   restore.setURL(route.fullPath)
   restore.save()
   if ( preferences.pickupLibrary && preferences.pickupLibrary.id != "") {
      pickupLibrary.value = preferences.pickupLibrary.id
   }
   if (user.isSignedIn) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "placeHold")
      if ( request.optionItems.length == 1) {
         selectedItem.value = request.optionItems[0].value
      }
   }
})

const dialogClosed = (() =>{
   request.activeRequest = "none"
   request.errors = {}
})

const requestAccountClicked = (() => {
   showDialog.value = false
   user.showRequestDialog = true
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
.no-illiad {
   display: flex;
   flex-direction: column;
   align-items: flex-start;
   gap: 10px;
   margin: 20px 0;
}
.no-ils-account {
   display: flex;
   flex-direction: column;
   gap: 20px;
   button {
      width: fit-content;
   }
}
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
      border-radius: 0.3rem;
      border: 2px solid $uva-red;
      padding: 5px;
   }
}
</style>