<template>
   <VirgoButton @click="showDialog=true" class="trigger" label="Request Item" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" :draggable="false"
      header="Microform Request" @show="dialogOpened" @hide="dialogClosed"
   >
      <SignIn v-if="!user.isSignedIn" :embedded="true"/>
      <FormKit v-else-if="submitted == false" type="form" ref="microform" :actions="false" @submit="submitMicroform">
         <FormKit type="select" label="Preferred pickup location" v-model="pickupLibrary"
            placeholder="Select a location" :options="pickupLibraries"
            validation="required" />
         <FormKit v-if="request.optionItems.length > 1" type="select" label="Select the item you want"
            v-model="selectedItem" id="microform-item-sel" placeholder="Select an item"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="request.optionItems" validation="required"
         />
         <FormKit label="Add additional notes if necessary" type="textarea"
            v-model="notes" :rows="5" id="microform-item-notes"
         />
      </FormKit>
      <div v-else class="confirmation-panel">
         <h2>We have received your request.</h2>
         <p>You will hear from us soon.</p>
         <dl>
            <dt>Email:</dt>
            <dd>{{ user.accountInfo.email }}</dd>
            <dt>Item:</dt>
            <dd>{{ selectedItem.callNumber }}</dd>
            <dt>Pickup Library:</dt>
            <dd>{{ pickupLibrary }}</dd>
            <template v-if="notes">
               <dt>Request Note:</dt>
               <dd>{{ notes }}</dd>
            </template>
         </dl>
      </div>
      <template #footer>
         <template v-if="submitted == false && user.isSignedIn && user.noILSAccount == false">
            <VirgoButton severity="secondary" @click="showDialog=false" label="Cancel"/>
            <VirgoButton label="Submit Request" @click="microform.node.submit()" />
         </template>
         <VirgoButton v-else severity="secondary" id="request-done" @click="showDialog=false" label="Close"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import SignIn from "@/views/SignIn.vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"
import { useRestoreStore } from "@/stores/restore"
import { useRoute } from "vue-router"
import analytics from '@/analytics'

const request = useRequestStore()
const user = useUserStore()
const restore = useRestoreStore()
const preferences = usePreferencesStore()
const route = useRoute()

const selectedItem = ref(null)
const notes = ref("")
const pickupLibrary = ref("")
const submitted = ref(false)
const microform = ref()
const showDialog = ref(false)

onMounted( () => {
   console.log("MICROFORM MOUNTED: ACTIVE="+request.activeRequest)
   if ( request.activeRequest == "microform") {
      showDialog.value = true
   }
})

const pickupLibraries = computed(()=>{
   let libs = []
   user.libraries.forEach( l => {
      libs.push({value: l.id, label: l.name})
   })
   return libs
})

const dialogOpened = (() => {
   submitted.value = false
   selectedItem.value = null
   notes.value = ""
   request.activeRequest = "microform"
   restore.setActiveRequest( request.activeRequest )
   restore.setURL(route.fullPath)
   restore.save()
   if (request.optionItems.length == 1) {
      selectedItem.value = request.optionItems[0].value
   }
   if ( preferences.pickupLibrary && preferences.pickupLibrary.id != "") {
      pickupLibrary.value = preferences.pickupLibrary.id
   }
   analytics.trigger('Requests', 'REQUEST_STARTED', "microform")
})

const dialogClosed = (() => {
   request.activeRequest = "none"
})

const submitMicroform = (() => {
   request.submitMicroform( selectedItem.value, pickupLibrary.value, notes.value, window.location.href )
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
 dl {
   margin-top: 0;
   display: inline-grid;
   grid-template-columns: 1fr 1fr;
   grid-column-gap: 5px;
   width: 100%;
}
dt {
   font-weight: bold;
   text-align: right;
   padding: 4px 8px;
   white-space: nowrap;
   vertical-align: top;
}
dd {
   margin: 0;
   width: 100%;
   text-align: left;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   padding: 4px 0px;
}
</style>