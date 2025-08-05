<template>
   <VirgoButton  @click="passwords.showChangePass = true" v-if="passwords.isPasswordReset == false" :disabled="passwords.showChangePass" ref="trigger" label="Change password"/>
   <Dialog v-model:visible="passwords.showChangePass" :modal="true" position="top" header="Change Password"
      @hide="closeChangeDialog" @show="opened" :draggable="false"
   >
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
         <FormKit v-if="!passwords.isPasswordReset" label="Current Password" type="password" v-model="currPassword" validation="required" />
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
      <div v-if="passwords.error" class="error" v-html="passwords.error"></div>
      <template #footer>
         <VirgoButton severity="secondary" @click="closeChangeDialog" label="Cancel"/>
         <VirgoButton @click="pwform.node.submit()" label="Submit" :loading="passwords.working"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from "@/stores/user"
import { usePasswordStore } from "@/stores/password"
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const passwords = usePasswordStore()

const currPassword = ref("")
const newPassword = ref("")
const confirmPassword = ref("")
const trigger = ref(null)
const pwform = ref()

onMounted(()=> {
   passwords.resetForgotSession()
   if ( route.query.token && route.query.token.length > 0 ) {
      passwords.initForgotSession( route.query.token )
   }
})

const opened = (() => {
   currPassword.value = ""
   newPassword.value = ""
   confirmPassword.value = ""
})

const closeChangeDialog = (() => {
   passwords.showChangePass = false
   if(trigger.value) {
      trigger.value.$el.focus()
   }
   let query = Object.assign({}, route.query)
   if ( query.token )  {
      delete query.token
      router.replace({ query })
   }
})

const submitPasswordChange = (() => {
   if ( passwords.isPasswordReset ) {
      passwords.resetPassword( newPassword.value )
   } else {
      passwords.changePassword( userStore.accountInfo['barcode'], currPassword.value, newPassword.value )
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
.error {
   margin-top: 10px;
   color: $uva-red-A;
}
</style>
