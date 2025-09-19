<template>
   <VirgoButton @click="showUpdateDialog = true" :disabled="showUpdateDialog" ref="trigger" label="Register for ILLiad account"/>
   <Dialog v-model:visible="showUpdateDialog" :modal="true" position="top" :style="dialogWidth"
      :draggable="false" header="ILLiad Registration" @hide="closeDialog" @show="opened"
   >
      <FormKit type="form" id="illiad-register" :actions="false" @submit="submitRegistration" ref="illiadform">
         <div class="help">If you have any questions about the completion of this form, please contact the ILS office at (434) 982-2617.</div>
         <FormKit type="text" label="Username" v-model="registration.computeID" id="username" validation="required"/>
         <FormKit type="text" label="First name" v-model="registration.firstName" id="firstname" validation="required"/>
         <FormKit type="text" label="Last name" v-model="registration.lastName" id="lastname" validation="required"/>
         <FormKit type="tel" label="Daytime phone" v-model="registration.phone" id="phone"
            placeholder="xxx-xxx-xxxx" validation="required|matches:/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/"
         />
         <FormKit type="email" label="Email" v-model="registration.email" id="email" validation="required"/>

         <div class="note">If your mailing address changes, please contact us at <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a> to update your account.</div>
         <FormKit type="text" label="Address" v-model="registration.address1" id="address1" validation="required"/>
         <FormKit type="text" label="Address line 2" v-model="registration.address2" id="address2"/>
         <FormKit type="text" label="City" v-model="registration.city" id="city" validation="required"/>
         <div class="columns">
            <FormKit type="text" label="State" v-model="registration.state" id="state" validation="required|length:2,2"/>
            <FormKit type="text" label="Zip" v-model="registration.zip" id="zip" validation="required"/>
         </div>
         <FormKit type="select" label="Status" id="status" v-model="registration.status" validation="required"
            placeholder="Select a status"
            :options="['Community', 'Graduate', 'Faculty', 'Faculty (retired)', 'Staff', 'Undergraduate']" />
         <FormKit type="select" label="Department" id="department" v-model="registration.department" validation="required"
            placeholder="Select a department" :options="system.departments"
         />
         <FormKit type="select" label="School" id="school" v-model="registration.school" validation="required"
            placeholder="Select a school" :options="system.schools"
         />
         <div class="delivery">
            <div>
               Please choose how you would like to pick up your materials.<br/>
               <ul>
                  <li>Users who live inside the Charlottesville/Albemarle County area should pick either 'LEO to Department' or 'LEO to Library'.</li>
                  <li>Users who live outside the Charlottesville/Albemarle County area should Send to Address.</li>
               </ul>
            </div>
            <FormKit type="select" label="Preferred delivery method" id="status" v-model="registration.deliveryMethod" validation="required"
               placeholder="Select a delivery method" @input="deliveryMethodChanged"
               :options="{Dept: 'LEO to Department', Library: 'LEO to Library', Address: 'Send to address'}"
            />
            <div v-if="registration.deliveryMethod == 'Dept'">
               <p>
                  Choose a building from the drop-down menu below and provide a room number
                  (this may be your own office, a mail room or a central department office).
                  If your building is not in the drop-down menu, contact us.
               </p>
               <FormKit type="select" label="Building Name" v-model="registration.buildingName"
                  placeholder="Select a building" id="building" :options="system.buildings" validation="required"
               />
               <FormKit type="text" label="Room Number" v-model="registration.roomNumber" id="room"/>
            </div>
            <div v-else-if="registration.deliveryMethod == 'Library'">
               <p>
                  Please choose the library where you would like to pick up your materials.
               </p>
               <FormKit type="select" label="Pickup Location" v-model="registration.pickupLocation"
                  placeholder="Select a location" id="pickup-sel" :options="pickupLibraries" validation="required"
               />
            </div>
            <div v-else-if="registration.deliveryMethod == 'Address'">
               <p>
                  Items will be delivered to the address you entered above. Please ensure it is correct.<br/>
                  <address>
                     <div>{{ registration.firstName }} {{ registration.lastName }}</div>
                     <div>{{ registration.address1 }}</div>
                     <div v-if="registration.address2">{{ registration.address2 }}</div>
                     <div>{{ registration.city }}, {{ registration.state }} {{ registration.zip }}</div>
                  </address>
               </p>
            </div>
         </div>
      </FormKit>
      <template #footer>
         <VirgoButton severity="secondary" @click="closeDialog" label="Cancel"/>
         <VirgoButton @click="illiadform.node.submit()" label="Register" :disabled="okDisabled"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref,computed,nextTick } from 'vue'
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import Dialog from 'primevue/dialog'
import { setFocusID } from '@/utils'
import { useWindowSize } from '@vueuse/core'

const userStore = useUserStore()
const system = useSystemStore()
const { height } = useWindowSize()

const showUpdateDialog = ref(false)
const okDisabled = ref(false)
const trigger = ref(null)
const illiadform = ref(null)

const registration = ref({
   computeID: "",
   firstName: "",
   lastName: "",
   email: "",
   phone: "",
   address1: "",
   address2: "",
   city: "",
   state: "",
   zip: "",
   status: "",
   department: "",
   school: "",
   deliveryMethod: "",
   buildingName: "",
   roomNumber: "",
   pickupLocation: ""
})

const dialogWidth = computed(() => {
   if ( height.value <= 768) {
      return "width: 95%"
   }
   return "width: 600px"
})

const pickupLibraries = computed(()=>{
   return [
      {value: "SHAN", label: "Shannon"},
      {value: "SEL", label: "Brown Science & Engineering"},
      {value: "CLEM", label: "Clemons"},
      {value: "DARDEN", label: "Darden"},
      {value: "FINE ARTS", label: "Fine Arts"},
      {value: "HSL", label: "Health Sciences"},
      {value: "LAW", label: "Law"},
      {value: "MUSIC", label: "Music"},
   ]
})

const opened = (() => {
   okDisabled.value = false
   registration.value.computeID = userStore.accountInfo.id
   registration.value.firstName = userStore.accountInfo.sirsiProfile.firstName
   registration.value.lastName = userStore.accountInfo.sirsiProfile.lastName
   registration.value.email = userStore.accountInfo.email
   registration.value.phone = ""
   registration.value.address1 = ""
   registration.value.address2 = ""
   registration.value.city = ""
   registration.value.state = "VA"
   registration.value.zip = ""
   registration.value.status = ""
   registration.value.department = ""
   registration.value.school = ""
   registration.value.deliveryMethod = ""
   registration.value.buildingName = ""
   registration.value.roomNumber = ""
   registration.value.pickupLocation = ""
   setFocusID("firstname")
})

const closeDialog = (() => {
   showUpdateDialog.value = false
   trigger.value.$el.focus()
})

const deliveryMethodChanged = ( (newMethod) => {
   if ( newMethod == "Address") {
      // address delivery method must set pickup location to 'Distance Education', which is value SCHED
      registration.value.pickupLocation = "SCED"
      registration.value.roomNumber = ""
      registration.value.buildingName = ""
   } else if ( newMethod == "Library") {
      // library delivery does not use building or room
      registration.value.roomNumber = ""
      registration.value.buildingName = ""
   } else {
      // department delivery does not use pickupLocation
      registration.value.pickupLocation = ""

      // default builing to the builting associated with the selected department
      registration.value.buildingName = system.departmentBuilding(registration.value.department)
   }

   nextTick( () => {
      let body = document.getElementsByClassName("p-dialog-content")[0]
      body.scrollTo(0, body.scrollHeight)
   })
})

const submitRegistration = (() => {

})

</script>

<style lang="scss" scoped>
form.formkit-form {
   .help {
      font-weight: bold;
   }

   .note {
      padding: 0;
      margin: 20px 0 -5px 0;
      white-space: break-spaces;
      font-size: 0.95em;
   }
   address {
      margin:15px;
   }
}
.columns {
   display: flex;
   flex-flow: row wrap;
   gap: 20px;
   justify-content: flex-start;
   .column {
      flex-grow: 1;
   }
}

</style>