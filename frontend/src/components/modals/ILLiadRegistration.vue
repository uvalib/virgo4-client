<template>
   <VirgoButton @click="showForm = true" label="Register for ILLiad account"/>
   <Dialog v-model:visible="showForm" :modal="true" position="top" :style="dialogWidth"
      :draggable="false" header="ILLiad Registration" @show="opened" @hide="hideRegistration"
   >
      <div v-if="submitted">
         Your registration request has been submitted, but you will be unable to
         make ILLiad requests until it has been reviewed and cleared.
      </div>
      <FormKit v-else type="form" id="illiad-register" :actions="false" @submit="submitRegistration" ref="illiadform">
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
            <FormKit type="select" label="State" v-model="registration.state" id="state"
               placeholder="Select a state" :options="states" validation="required"
            />
            <FormKit type="text" label="Zip" v-model="registration.zip" id="zip" validation="required"/>
         </div>
         <FormKit type="select" label="Status" id="status" v-model="registration.status" validation="required"
            placeholder="Select a status" @input="statusSelected"
            :options="['Graduate', 'Faculty', 'Faculty (retired)', 'Staff', 'Undergraduate']" />
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
            <FormKit type="select" label="Preferred delivery method" id="delivery" v-model="registration.deliveryMethod" validation="required"
               placeholder="Select a delivery method" @input="deliveryMethodChanged" :disabled="registration.status == 'Undergraduate'"
               :options="{Dept: 'LEO to Department', Library: 'LEO to Library', Address: 'Send to address'}"
            />
            <div v-if="registration.deliveryMethod == 'Dept'">
               <div class="delivery-info">
                 <div>
                     Choose a building from the drop-down menu below and provide a room number
                     (this may be your own office, a mail room or a central department office).
                     If your building is not in the drop-down menu, contact us.
                  </div>
                  <FormKit type="select" label="Building Name" v-model="registration.buildingName"
                     placeholder="Select a building" id="building" :options="system.buildings" validation="required"
                  />
                  <FormKit type="text" label="Room Number" v-model="registration.roomNumber" id="room"/>
               </div>
            </div>
            <div v-else-if="registration.deliveryMethod == 'Library'">
               <div class="delivery-info">
                  <div>Please choose the library where you would like to pick up your materials.</div>
                  <FormKit type="select" label="Pickup Location" v-model="registration.pickupLocation"
                     placeholder="Select a location" id="pickup-sel" :options="pickupLibraries" validation="required"
                  />
               </div>
            </div>
            <div v-else-if="registration.deliveryMethod == 'Address'">
               <div class="delivery-info">
                  <div>Items will be delivered to the address you entered above. Please ensure it is correct.</div>
                  <address>
                     <div>{{ registration.firstName }} {{ registration.lastName }}</div>
                     <div>{{ registration.address1 }}</div>
                     <div v-if="registration.address2">{{ registration.address2 }}</div>
                     <div>{{ registration.city }}, {{ registration.state }} {{ registration.zip }}</div>
                  </address>
               </div>
            </div>
         </div>
      </FormKit>
      <template #footer>
         <div class="footer-wrap">
            <p v-if="error" class="error">{{ error }}</p>
            <div class="buttons">
               <VirgoButton v-if="submitted" severity="secondary" @click="showForm = false" label="Close"/>
               <template v-else>
                  <VirgoButton severity="secondary" @click="showForm = false" label="Cancel"/>
                  <VirgoButton @click="illiadform.node.submit()" label="Register" :loading="working"/>
               </template>
            </div>
         </div>
      </template>
   </Dialog>
</template>

<script setup>
import { ref,computed,nextTick } from 'vue'
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import Dialog from 'primevue/dialog'
import { useWindowSize } from '@vueuse/core'
import axios from 'axios'

const userStore = useUserStore()
const system = useSystemStore()
const { height } = useWindowSize()

const showForm = ref(false)
const working = ref(false)
const submitted = ref(false)
const error = ref("")
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


const states = computed(() => {
   return [
      {value: "AK", label: "Alaska"}, {value: "AZ", label: "Arizona"}, {value: "AR", label: "Arkansas"}, {value: "CA", label: "California"},
      {value: "CO", label: "Colorado"}, {value: "CT", label: "Connecticut"}, {value: "DE", label: "Delaware"}, {value: "DC", label: "District of Columbia"},
      {value: "FL", label: "Florida"}, {value: "GA", label: "Georgia"}, {value: "HI", label: "Hawaii"}, {value: "ID", label: "Idaho"},
      {value: "IL", label: "Illinois"}, {value: "IN", label: "Indiana"}, {value: "IA", label: "Iowa"}, {value: "KS", label: "Kansas"},
      {value: "KY", label: "Kentucky"}, {value: "LA", label: "Louisiana"}, {value: "ME", label: "Maine"}, {value: "MD", label: "Maryland"},
      {value: "MA", label: "Massachusetts"}, {value: "MI", label: "Michigan"}, {value: "MN", label: "Minnesota"}, {value: "MS", label: "Mississippi"},
      {value: "MO", label: "Missouri"}, {value: "MT", label: "Montana"}, {value: "NE", label: "Nebraska"}, {value: "NV", label: "Nevada"},
      {value: "NH", label: "New Hampshire"}, {value: "NJ", label: "New Jersey"}, {value: "NM", label: "New Mexico"}, {value: "NY", label: "New York"},
      {value: "NC", label: "North Carolina"}, {value: "ND", label: "North Dakota"}, {value: "OH", label: "Ohio"}, {value: "OK", label: "Oklahoma"},
      {value: "OR", label: "Oregon"}, {value: "PA", label: "Pennsylvania"}, {value: "RI", label: "Rhode Island"}, {value: "SC", label: "South Carolina"},
      {value: "SD", label: "South Dakota"}, {value: "TN", label: "Tennessee"}, {value: "TX", label: "Texas"}, {value: "UT", label: "Utah"},
      {value: "VT", label: "Vermont"}, {value: "VA", label: "Virginia"}, {value: "WA", label: "Washington"}, {value: "WV", label: "West Virginia"},
      {value: "WI", label: "Wisconsin"}, {value: "WY", label: "Wyoming"},
   ]
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
   error.value = ""
   working.value = false
   submitted.value = false
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
})

const statusSelected = ( (newStatus) => {
   registration.value.deliveryMethod = ""
   registration.value.buildingName = ""
   registration.value.roomNumber = ""
   registration.value.pickupLocation = ""
   if ( newStatus == "Undergraduate") {
      registration.value.deliveryMethod = "Library"
   }
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
   working.value = true
   error.value = ""
   axios.post("/api/illiad/register", registration.value).then( () => {
      working.value = false
      submitted.value = true
    }).catch ( err => {
      console.log(err)
      error.value = err
      working.value = false
   })
})

const hideRegistration = (() => {
    if (submitted.value == true) {
      userStore.illiadRegistrationSubmitted()
    }
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
      margin-left:20px;
   }
   .delivery-info {
      margin: 15px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
   }
}
.footer-wrap {
   display: flex;
   flex-direction: column;
   gap: 5px;
   flex-grow: 1;
   .error {
      text-align: center;
      color: $uva-red-A;
   }
   .buttons {
      display: flex;
      flex-flow: row wrap;
      gap: 1rem;
      justify-content: flex-end;
   }
}
.columns {
   display: flex;
   flex-flow: row wrap;
   gap: 20px;
   justify-content: flex-start;
   div.formkit-outer {
      flex-grow: 1;
   }
}

</style>