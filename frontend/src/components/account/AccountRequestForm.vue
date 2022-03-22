<template>
   <div v-if="userStore.accountRequested == false && userStore.canRequestAccount" class="signup-form pure-form  pure-form-stacked">
      <p>You do not currently have a UVA Library account. Please fill out the form below to request one.</p>
      <p>If you have already requested an account, click Ignore.</p>
      <div class="entry pure-control-group">
         <label for="name">ID<span class="required">*</span></label>
         <input type="text" v-model="userStore.accountRequest.id" id="id">
         <span v-if="hasError('id')" class="error">ID type is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="name">Name<span class="required">*</span></label>
         <input type="text" v-model="userStore.accountRequest.name" id="name">
         <span v-if="hasError('name')" class="error">Name is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="email">Email<span class="required">*</span></label>
         <input type="email" v-model="userStore.accountRequest.email" id="email">
         <span v-if="hasError('email')" class="error">Email is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="phone">Phone<span class="required">*</span></label>
         <input type="text" v-model="userStore.accountRequest.phone" id="phone">
         <span v-if="hasError('phone')" class="error">Phone is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="department">Department<span class="required">*</span></label>
         <input type="text" v-model="userStore.accountRequest.department" id="department">
         <span v-if="hasError('department')" class="error">Department is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="address1">Address Line 1<span class="required">*</span></label>
         <input type="text" v-model="userStore.accountRequest.address1" id="address1">
         <span v-if="hasError('address1')" class="error">Address Line 1 is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="address2">Address Line 2</label>
         <input type="text" v-model="userStore.accountRequest.address2" id="address2">
      </div>
      <div class="entry pure-control-group">
         <label for="city">City<span class="required">*</span></label>
         <input type="text" v-model="userStore.accountRequest.city" id="city">
         <span v-if="hasError('city')" class="error">City is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="state">State<span class="required">*</span></label>
         <input type="text" v-model="userStore.accountRequest.state" id="state">
         <span v-if="hasError('state')" class="error">State is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="zip">Zip Code<span class="required">*</span></label>
         <input type="text" v-model="userStore.accountRequest.zip" id="zip">
         <span v-if="hasError('zip')" class="error">ZIp Code is required</span>
      </div>
      <div class="submit-control">
         <V4Button mode="tertiary" @click="ignoreClicked">Ignore</V4Button>
         <V4Button mode="primary" @click="submitClicked">Submit</V4Button>
      </div>
   </div>
   <div v-else-if="userStore.canRequestAccount == false && userStore.accountRequested == false" class="signup-form no-signup">
      <p class="left">Hello!</p>
      <p class="left">It appears you do not have a UVA Library circulation account.</p>
      <p class="light left">
         The UVA Libraries are open to only current students, staff, and faculty.
         If you are a current student, staff, or faculty and need an account, please contact <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
      </p>
      <p class="light left">
         If you are an alum, we apologize for the inconvenience. Once the libraries reopen to the public,
         please visit one in person and we will be happy to register you. For information about library access,
         please visit
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
import { ref } from 'vue'
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()
const errors = ref([])
const required = ['id', 'name', 'email', 'phone', 'department', 'address1', 'city', 'state', 'zip']

function hasError( val ) {
   return errors.value.includes(val)
}
function submitClicked() {
   errors.value.splice(0, errors.value.length)
   for (let [key, value] of Object.entries(userStore.accountRequest)) {
      if ( required.includes(key) && value == "") {
         errors.value.push(key)
      }
   }
   if (errors.value.length > 0) {
      let tgtID = errors.value[0]
      let first = document.getElementById(tgtID)
      if ( first ) {
         first.focus()
      }
   } else {
      userStore.submitNewAccountRequest()
   }
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
   input{
      width: 100%;
      margin-bottom: 15px !important;
   }
   .submit-control {
      text-align: center;
      margin: 20px 0 50px 0;
   }
   .required {
      margin-left: 5px;
      font-weight: bold;
      color: var(--uvalib-red-emergency);
   }
   span.error {
      margin: 0 0 15px 0;
      font-weight: normal;
      font-style: italic;
      color: var(--color-error);
      display: block;
      position: relative;
      top: -5px;
   }
}
.signup-form.pending {
   margin-top: 45px;
}
.signup-form.no-signup {
   width: 80%;
}
</style>
