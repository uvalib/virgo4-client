<template>
   <Dialog v-model:visible="userStore.showRequestDialog" :modal="true" position="top" :style="dialogWidth"
      :draggable="false" header="UVA Library Account Registration" @show="opened"
   >
   <div v-if="failed">
      <div>System error, we regret the inconvenience. If this problem persists, <a href='https://search.lib.virginia.edu/feedback' target='_blank'>please contact us.</a></div>
   </div>
   <div v-else-if="userStore.accountRequested == true" class="pending">
      <div v-if="submitted">Your request for a UVA Library account has been submitted and will be created within 1-2 business days.</div>
      <div v-else>Your request for a UVA Library account is pending and will be active within 1-2 business days.</div>
      <div>You will be notified via email when the account has been created. <b>Until that time, you will be unable to request items</b>.</div>
      <div>If you have any questions or problems, please contact <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.</div>
   </div>
   <template v-else>
      <div>You do not currently have a UVA Library account. Please fill out the form below to request one.</div>
      <p><b>Without an account you will be unable to request items from the library.</b></p>
      <FormKit type="form" ref="accountrequest" :actions="false" @submit="submitRequest">
         <FormKit label="ID" type="text" v-model="registration.id" validation="required"/>
         <FormKit label="Name" type="text" v-model="registration.name" validation="required"/>
         <FormKit label="Email" type="email" v-model="registration.email" validation="required"/>
         <FormKit label="Phone" type="text" v-model="registration.phone" validation="required"/>
         <FormKit label="Department" type="text" v-model="registration.department" validation="required"/>
         <FormKit label="Address Line 1" type="text" v-model="registration.address1" validation="required"/>
         <FormKit label="Address Line 2" type="text" v-model="registration.address2"/>
         <FormKit label="City" type="text" v-model="registration.city" validation="required"/>
         <div class="columns">
            <FormKit type="select" label="State" v-model="registration.state" validation="required"
               id="state" placeholder="Select a state" :options="states"
            />
            <FormKit label="Zip Code" type="text" v-model="registration.zip" validation="required"/>
         </div>
      </FormKit>
   </template>
   <template #footer>
      <VirgoButton severity="secondary" @click="userStore.showRequestDialog = false" label="Close"/>
      <VirgoButton v-if="userStore.accountRequested == false && failed == false" @click="accountrequest.node.submit()" label="Submit" :loading="working"/>
   </template>
   </Dialog>
</template>

<script setup>
import { ref,computed} from 'vue'
import { useUserStore } from "@/stores/user"
import Dialog from 'primevue/dialog'
import { useWindowSize } from '@vueuse/core'
import axios from 'axios'

const userStore = useUserStore()
const { width } = useWindowSize()

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

const accountrequest = ref()
const submitted = ref(false)
const failed = ref(false)
const working = ref(false)
const registration = ref({
   id: "",
   name: "",
   email: "",
   phone: "",
   department: "",
   address1: "",
   address2: "",
   city: "",
   state: "",
   zip: ""
})

const dialogWidth = computed(() => {
   if ( width.value <= 768) {
      return "width: 95%"
   }
   return "width: 600px"
})

const opened = ( () => {
   submitted.value = false
   working.value = false
   failed.value = false
   registration.value = {
      id: userStore.signedInUser,
      name: userStore.accountInfo.displayName,
      email: userStore.accountInfo.email,
      phone: "",
      department: userStore.accountInfo.department,
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: ""
   }
})

const submitRequest = (() => {
   working.value = true
   axios.post("/api/requests/account", registration.value ).then( _resp => {
      working.value = false
      userStore.flagAccountRequested()
      submitted.value = true
   }).catch ( () => {
      failed.value = true
      working.value = false
   })
})
</script>

<style lang="scss" scoped>
.pending {
   display: flex;
   flex-direction: column;
   gap: 15px;
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

