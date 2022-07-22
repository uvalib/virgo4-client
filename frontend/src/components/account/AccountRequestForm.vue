<template>
   <div v-if="userStore.accountRequested == false && userStore.canRequestAccount" class="signup-form">
      <p>You do not currently have a UVA Library account. Please fill out the form below to request one.</p>
      <p>If you have already requested an account, click Ignore.</p>
      <FormKit type="form" id="account-request" :actions="false" @submit="submitClicked" incompleteMessage="Sorry, not all fields are filled out correctly.">
         <FormKit label="ID" type="text" v-model="userStore.accountRequest.id" validation="required"/>
         <FormKit label="Name" type="text" v-model="userStore.accountRequest.name" validation="required"/>
         <FormKit label="Email" type="email" v-model="userStore.accountRequest.email" validation="required"/>
         <FormKit label="Phone" type="text" v-model="userStore.accountRequest.phone" validation="required"/>
         <FormKit label="Department" type="text" v-model="userStore.accountRequest.department" validation="required"/>
         <FormKit label="Address Line 1" type="text" v-model="userStore.accountRequest.address1" validation="required"/>
         <FormKit label="Address Line 2" type="text" v-model="userStore.accountRequest.address2"/>
         <FormKit label="City" type="text" v-model="userStore.accountRequest.city" validation="required"/>
         <FormKit label="State" type="text" v-model="userStore.accountRequest.state" validation="required"/>
         <FormKit label="Zip Code" type="text" v-model="userStore.accountRequest.zip" validation="required"/>
         <V4FormActions :hasCancel="true" cancelLabel="Ignore"  @canceled="ignoreClicked" submitLabel="Submit" submitID="submit-borrow-av"/>
      </FormKit>
   </div>
   <div v-else-if="userStore.canRequestAccount == false && userStore.accountRequested == false" class="signup-form no-signup">
      <p class="left">Hello!</p>
      <p class="left">It appears you do not have a UVA Library circulation account.</p>
      <p class="light left">
         The UVA Libraries are open to only current students, staff, and faculty.
         If you are a current student, staff, or faculty and need an account, please contact <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
      </p>
      <p class="light left">
         If you are an alum, we apologize for the inconvenience. Please visit a library in person with a state ID to create an account.
         For information about library access, please visit
         <a target="_blank" href="https://www.library.virginia.edu/news/covid-19/#access">
            https://www.library.virginia.edu/news/covid-19/#access</a>.
      </p>
   </div>
   <div v-else-if="userStore.accountRequested == true" class="signup-form pending">
      <p>Your request for a UVA Library account has been submitted and will be created within 1-2 business days.</p>
      <p class="light">You will be notified via email when the account has been created.</p>
      <p class="light">If you have any questions or problems, please contact <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.</p>
   </div>
</template>

<script setup>
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()

function submitClicked() {
   userStore.submitNewAccountRequest()
}
function ignoreClicked() {
   userStore.flagAccountRequested()
}
</script>

<style lang="scss" scoped>
@media only screen and (min-width: 768px) {
   .signup-form {
      width:60%;
   }
}
@media only screen and (max-width: 768px) {
   .signup-form {
      width:100%;
   }
}
.signup-form {
   width:60%;
   margin: 0 auto;
   p {
      margin: 10px 0;
      text-align: center;
      font-weight: bold;
   }
   p.light {
      font-weight: normal;
   }
   p.left {
      text-align: left;
   }
}
.signup-form.pending {
   margin-top: 45px;
}
.signup-form.no-signup {
   width: 80%;
}
</style>
