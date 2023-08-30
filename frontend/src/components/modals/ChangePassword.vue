<template>
   <V4Button mode="primary" @click="showDialog = true" v-if="!hasPasswordToken" :disabled="showDialog" >
      Change password
   </V4Button>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Change Password" @hide="showDialog = false" @show="opened">
      <p  v-if="passwordChanged">Your password has been changed.</p>
      <template v-else-if="expiredToken">
         <p class="error" v-html="error"></p>
         <p class="error">Please request a new password reset email.</p>
      </template>
      <template v-else>
         <p>New passwords must:</p>
         <ul>
            <li>
               Contain between 12 and 25 characters
            </li>
            <li>
               Include at least one lower-case letter
            </li>
            <li>
               Include at least one upper-case letter
            </li>
            <li>
               Include at least one numeral (digit)
            </li>
            <li>
               Optional special characters allowed: ! , @ # $ % & * + ( ) _ - ?
            </li>
         </ul>
         <FormKit type="form" id="change-password" :actions="false" @submit="submitPasswordChange">
            <FormKit v-if="!hasPasswordToken" id="curr-password" label="Current Password" type="password" v-model="currPassword" validation="required" />
            <FormKit type="password" name="password" label="New Password" id="new-password"
               :validation="[
                  ['required'],
                  ['length',12,25],
                  ['matches', /^(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[a-z])[A-Za-z0-9-!,@#$%&*+()_? ]*$/]
               ]"
               validation-visibility="blur"
               :validation-messages="{
                  matches: 'Password does not match requirements listed above.',
               }"
               v-model="newPassword"
            />
            <FormKit type="password" name="password_confirm" label="Confirm password" validation="required|confirm"/>
            <div class="form-controls">
               <V4Button mode="tertiary" @click="showDialog = false">Cancel</V4Button>
               <FormKit type="submit" label="Submit" wrapper-class="submit-button" :disabled="okDisabled" />
            </div>
         </FormKit>
      </template>
   </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from "@/stores/user"
import { setErrors } from '@formkit/core'
import Dialog from 'primevue/dialog'

const emit = defineEmits( ['show-forgot-password'])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const showDialog = ref(false)
const currPassword = ref("")
const newPassword = ref("")
const passwordToken = ref("")
const error = ref("")
const passwordChanged = ref(false)
const okDisabled = ref(false)
const expiredToken = ref(false)

onMounted(()=> {
   if (hasPasswordToken.value) {
      passwordToken.value = route.query.token
      showDialog.value = true
   }
})

const hasPasswordToken = computed(() => {
   return route.query.token && route.query.token.length > 0
})

const opened = (() => {
   currPassword.value = ""
   newPassword.value = ""
   error.value = ""
   passwordChanged.value = false
   okDisabled.value = false
})

const submitPasswordChange = (() => {
   if ( passwordChanged.value ) {
      let query = Object.assign({}, route.query);
      delete query.token;
      router.replace({ query });
      showDialog.value = false
      return
   }

   if (expiredToken.value) {
      // called when the change fails. New content is presented suggesting the user request a
      // new forgot password token, When OK is cliicked, clear the token and show the forgot popup.
      let query = Object.assign({}, route.query);
      delete query.token;
      router.replace({ query });
      showDialog.value = false
      emit("show-forgot-password")
      return
   }

   okDisabled.value = true
   if (hasPasswordToken.value) {
      let data = {reset_password_token: passwordToken.value, new_password: newPassword.value}
      userStore.changePasswordWithToken(data).then(() => {
         passwordChanged.value = true
      }).catch((e) => {
         expiredToken.value = true

         if(e.response.data.message){
            error.value = e.response.data.message
         } else {
            error.value = "Password change failed."
         }
      }).finally(()=>{
         okDisabled.value =false
      })
   } else {
      let data  = {current_pin: currPassword.value, new_pin: newPassword.value}
      userStore.changePassword(data).then(() => {
         passwordChanged.value = true
      }).catch((e) => {
         document.getElementById("curr-password").focus()
         error.value = "Password change failed.</br>"
         if ( e.response.data.message ) {
            error.value += e.response.data.message
         } else {
            error.value += "Please check your current password."
         }
         setErrors('change-password', error.value)
      }).finally(()=>{
         okDisabled.value = false
      })
   }
})
</script>

<style lang="scss" scoped>
p {
   margin: 0;
}
input[type=password] {
   width: 100%;
}
label {
   display: block;
   margin: 10px 0 2px 0;
   font-weight: bold;
}
p.error {
   padding: 0;
   font-size: 0.8em;
   color: var(  --uvalib-red-emergency);
   text-align: center;
}
</style>
