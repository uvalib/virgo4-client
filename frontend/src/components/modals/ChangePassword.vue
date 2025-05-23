<template>
   <VirgoButton  @click="showDialog = true" v-if="!hasPasswordToken" :disabled="showDialog" ref="trigger" label="Change password"/>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Change Password"
      @hide="closeChangeDialog" @show="opened" :draggable="false"
   >
      <template v-if="expiredToken">
         <p class="error" v-html="error"></p>
         <p class="error">Please request a new password reset email.</p>
         <div class="form-controls">
            <VirgoButton severity="secondary" @click="closeExpiredChange" label="OK"/>
         </div>
      </template>
      <template v-else>
         <p>New passwords must: </p>
         <ul>
            <li>
               Contain between 6 and 25 characters
            </li>
            <li>
               Optional special characters allowed: ! , @ # $ % & * + ( ) _ - ?
            </li>
         </ul>
         <FormKit type="form" id="change-password" :actions="false" @submit="submitPasswordChange" ref="pwform">
            <FormKit v-if="!hasPasswordToken" label="Current Password" type="password" v-model="currPassword" validation="required" />
            <FormKit type="password" name="password" label="New Password" id="new-password"
               :validation="[
                  ['required'],
                  ['length',6,25],
                  ['matches', /^[A-Za-z0-9-!,@#$%&*+()_? ]*$/]
               ]"
               validation-visibility="blur"
               :validation-messages="{
                  matches: 'Password does not match requirements listed above.',
               }"
               v-model="newPassword"
            />
            <FormKit type="password" name="password_confirm" label="Confirm password" validation="required|confirm" v-model="confirmPassword" />
         </FormKit>
      </template>
      <template #footer>
         <VirgoButton severity="secondary" @click="closeChangeDialog" label="Cancel"/>
         <VirgoButton @click="pwform.node.submit()" label="Submit" :disabled="okDisabled" />
      </template>
   </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from "@/stores/user"
import { setErrors } from '@formkit/core'
import Dialog from 'primevue/dialog'
import { useToast } from "primevue/usetoast"

const toast = useToast()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const showDialog = ref(false)
const currPassword = ref("")
const newPassword = ref("")
const confirmPassword = ref("")
const passwordToken = ref("")
const error = ref("")
const okDisabled = ref(false)
const expiredToken = ref(false)
const trigger = ref(null)
const pwform = ref()

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
   okDisabled.value = false
})

const closeChangeDialog = (() => {
   showDialog.value = false
   if(trigger.value) {
      trigger.value.$el.focus()
   }
   let query = Object.assign({}, route.query)
   if ( query.token )  {
      delete query.token
      router.replace({ query })
   }
})

const closeExpiredChange = (() => {
   showDialog.value = false
   userStore.showForgotPW = true
   let query = Object.assign({}, route.query)
   delete query.token
   router.replace({ query })
})

const submitPasswordChange = (() => {
   okDisabled.value = true
   if (hasPasswordToken.value) {
      let data = {reset_password_token: passwordToken.value, new_password: newPassword.value}
      userStore.changePasswordWithToken(data).then(() => {
         showDialog.value = false
         let msg = "Your password has been changed."
         toast.add({severity:'success', summary:  "Success", detail:  msg, life: 10000})
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
      let data  = {currPassword: currPassword.value, newPassword: newPassword.value}
      userStore.changePassword(data).then(() => {
         showDialog.value = false
         let msg = "Your password has been changed."
         toast.add({severity:'success', summary:  "Success", detail:  msg, life: 6000})
      }).catch((e) => {
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
   color: $uva-red-A;
   text-align: center;
}
</style>
