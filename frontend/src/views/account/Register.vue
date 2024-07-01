<template>
  <div class="account" v-if="!userStore.lookingUp">
    <ul class="info">
      <li>Use this form to register for a Virgo account.</li>
      <li>It is for people <i>other</i> than students, faculty, and staff of the University of Virginia.</li>
      <li>A Virgo Account does not grant access to online material.</li>
      <li>People with UVA NetBadge accounts should instead <router-link to="/signin">sign in with Netbadge.</router-link></li>
      <li>More information:
        <ul>
          <li><a target="_blank" href="https://www.library.virginia.edu/policies/circulation">
              Circulation Policies
            </a></li>
          <li><a target="_blank" href="https://www.library.virginia.edu/services/community-patrons">
              Community Patron Services
            </a>
          </li>
        </ul>
      </li>
    </ul>

    <FormKit type="form" id="account-register" :actions="false" @submit="submitClicked"
      incompleteMessage="Sorry, not all fields are filled out correctly.">
      <FormKit label="First Name" type="text" v-model="userStore.tempAccount.firstName" validation="required" />
      <FormKit label="Last Name" type="text" v-model="userStore.tempAccount.lastName" validation="required" />
      <FormKit label="Phone" type="tel" v-model="userStore.tempAccount.phone" placeholder="###-###-####"
        validation-visibility="blur" validation="required|matches:/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/"
        :validation-messages="{ matches: 'Phone number must be in the format ###-###-####'}" />
      <FormKit label="Address Line 1" type="text" v-model="userStore.tempAccount.address1" validation="required" />
      <FormKit label="Address Line 2" type="text" v-model="userStore.tempAccount.address2" />
      <FormKit label="City" type="text" v-model="userStore.tempAccount.city" validation="required" />
      <FormKit label="State" type="text" v-model="userStore.tempAccount.state" validation="required" />
      <FormKit label="Zip Code" type="text" v-model="userStore.tempAccount.zip" validation="required" />

      <Panel header="Login credentials">
        <p>Once this form is submitted, we will send you a confirmation email with a link to activate your account.</p>
        <FormKit label="Email" type="email" name="email" v-model="userStore.tempAccount.email" validation="required|email" />
        <FormKit label="Confirm Email" type="email" name="email_confirm"

          validation="required|confirm" validation-visibility="blur" validation-label="Confirmation" />
        <p>Passwords must: </p>
        <ul>
          <li>
            Contain between 6 and 25 characters
          </li>
          <li>
            Optional special characters allowed: ! , @ # $ % & * + ( ) _ - ?
          </li>
        </ul>
        <FormKit label="Password" type="password" v-model="userStore.tempAccount.password" name="password" :validation="[
              ['required'],
              ['length',6,25],
              ['matches', /^[A-Za-z0-9-!,@#$%&*+()_? ]*$/]
            ]" validation-visibility="blur" :validation-messages="{
              matches: 'Password does not match requirements listed above.',
            }" />
        <FormKit label="Confirm Password" type="password" name="password_confirm"
          validation="required|confirm" validation-visibility="blur" validation-label="Confirmation" />
      </Panel>


      <V4FormActions :hasCancel="true" cancelLabel="Cancel" @canceled="cancelClicked" submitLabel="Submit"
        submitID="submit-register" buttonAlign="spaced" />
    </FormKit>

  </div>
</template>
<script setup>
import { useUserStore } from "@/stores/user"
import { useRouter } from 'vue-router'
import { onMounted } from "vue";
import Panel from 'primevue/panel';

const userStore = useUserStore()
const router = useRouter()

onMounted(() =>{
  if ( userStore.isSignedIn ) {
    router.push("/account")
  }
})

async function submitClicked() {
  userStore.submitUserRegistration()
}
function cancelClicked() {
  router.push("/signin")
}

</script>
<style lang="scss" scoped>
@media only screen and (min-width: 768px) {
  div.account  {
    width: 60%;
  }
}
@media only screen and (max-width: 768px) {
  div.account  {
    width: 95%;
  }
}
.account {
  min-height: 400px;
  position: relative;
  margin: 2vw auto;
  text-align: left;
  color: var(--color-primary-text);
}
.info{
  margin: 0 auto;
  li{
    padding: 5px 0
  }
}

.p-panel {
  margin-top: 10px;
}

</style>