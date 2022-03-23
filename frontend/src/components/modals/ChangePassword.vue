<template>
   <V4Modal :id="id" title="Change Password" ref="changePassword"  @opened="opened"
      firstFocusID="currPassword" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.changePassword.show()"
            v-if="!hasPasswordToken" :id="`${id}-open`" >
            Change Password
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="passwordChanged">
            <p>
               Your password has been changed.
            </p>
         </template>
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
            <div class="message pure-form">
               <div v-if="!hasPasswordToken">
                  <label for="currpassword">Current Password</label>
                  <input ref="currPassword" id="currPasswordInput" type="password" v-model="currPassword" @keydown.shift.tab.stop.prevent="backTabCP"
                     aria-required="true" required="required"/>
               </div>
               <div>
                  <label for="newPassword">New Password</label>
                  <input id="newPassword" ref="newPasswordInput" type="password" v-model="newPassword"
                     aria-required="true" required="required"/>
               </div>
               <div>
                  <label for="confirm">Confirm Password</label>
                  <input id="confirm" ref="confirm" type="password" v-model="newPasswordConfirm"
                     aria-required="true" required="required"/>
               </div>

               <p v-if="error" class="error" v-html="error"></p>
            </div>
         </template>
      </template>
      <template v-slot:controls>
         <V4Button v-if="passwordChanged == false && !expiredToken" mode="tertiary" :id="`${id}-cancelbtn`" @click="$refs.changePassword.hide()">
            Cancel
         </V4Button>
         <V4Button :disabled="okDisabled" mode="primary" :id="`${id}-okbtn`" @click="okClicked"
             :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from "@/stores/user"

const emit = defineEmits( ['show-forgot-password'])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// html element refs
const changePassword = ref(null)
const currPasswordInput = ref(null)
const newPasswordInput = ref(null)

// data
const id = ref("change-password")
const currPassword = ref("")
const newPassword = ref("")
const newPasswordConfirm = ref("")
const passwordToken = ref("")
const error = ref("")
const passwordChanged = ref(false)
const okDisabled = ref(false)
const expiredToken = ref(false)

const hasPasswordToken = computed(() => {
   return route.query.token && route.query.token.length > 0
})

 onMounted(()=> {
   if (hasPasswordToken.value) {
      passwordToken.value = route.query.token
      changePassword.value.show()
   }
})

function opened() {
   currPassword.value = ""
   newPassword.value = ""
   newPasswordConfirm.value = ""
   error.value = ""
   passwordChanged.value = false
   okDisabled.value = false
}
function backTabCP() {
   changePassword.value.firstFocusBackTabbed()
}
function nextTabOK() {
   changePassword.value.lastFocusTabbed()
}
function toggleOk() {
   okDisabled.value = !okDisabled.value
}
function okClicked() {
   if ( passwordChanged.value ) {
      let query = Object.assign({}, route.query);
      delete query.token;
      router.replace({ query });
      changePassword.value.hide()
      return
   } else if (expiredToken.value) {
      // called when the change fails. New content is presented suggesting the user request a
      // new forgot password token, When OK is cliicked, clear the token and show the forgot popup.
      let query = Object.assign({}, route.query);
      delete query.token;
      router.replace({ query });
      changePassword.value.hide()
      emit("show-forgot-password")
      return

   } else {
      error.value = ""
      if ( !hasPasswordToken.value && (currPassword.value == "" ||
            newPassword.value == "" || newPasswordConfirm.value == ""))  {
         currPasswordInput.value.focus()
         error.value = "All three fields are required"
         return
      }
      if ( newPassword.value != newPasswordConfirm.value )  {
         newPasswordInput.value.focus()
         error.value = "New password confirmation did not match"
         return
      }
      if (newPassword.value.length < 12 || newPassword.value.length > 25){
         newPasswordInput.value.focus()
         error.value = "New password must be between 12 and 25 characters"
         return
      }
      // Check caps & numerals
      const regex = RegExp('^(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[a-z]).*$')
      if (!regex.test(newPassword.value)) {
         newPasswordInput.value.focus()
         error.value = "New password must meet the complexity requirements."
         return
      }
      const restrictedChars = RegExp(/[^a-zA-Z0-9!,@#$%&*+()_\-? ]/)
      if ( restrictedChars.test(newPassword.value) ) {
         newPasswordInput.value.focus()
         error.value = "Please only use the allowed special characters."
         return
      }

      toggleOk()
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
            toggleOk()
         })
      } else {
         let data  = {current_pin: currPassword, new_pin: newPassword.value}
         userStore.changePassword(data).then(() => {
            passwordChanged.value = true
         }).catch((e) => {
            currPassword.value.focus()
            error.value = "Password change failed.</br>"
            if ( e.response.data.message ) {
               error.value += e.response.data.message
            } else {
               error.value += "Please check your current password."
            }
         }).finally(()=>{
            toggleOk()
         })
      }
      return
   }
}
</script>

<style lang="scss" scoped>
.message {
   margin-bottom:15px;
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
