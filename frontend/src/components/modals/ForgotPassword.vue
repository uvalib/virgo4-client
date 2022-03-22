<template>
   <V4Modal :id="id" title="Forgot Password" ref="forgotPassword" @opened="opened" @show-forgot-password="forgotPassword.show()"
      firstFocusID="userId" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="text" @click="forgotPassword.show()" :id="`${id}-open`">
            Forgot your password?
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="emailSent">
            <p>
               An email has been sent to reset your password.
            </p>
         </template>
         <template v-else>
             <p>An email will be sent to the address on file with a link to reset your password. If you need assistance, please <a target="_blank" href="https://www.library.virginia.edu/askalibrarian">Ask a Librarian</a>.</p>
           <div class="password-reset-form pure-form">
              <div>
               <label for="userId">Library ID</label>
               <input id="userId" v-model="userId" />
              </div>
               <p class="hint">Driver's License Number,<br>eg: A12345678</p>
            </div>
            <p v-if="error" class="error" v-html="error"></p>
          </template>
      </template>
      <template v-slot:controls>
         <V4Button  mode="tertiary" :id="`${id}-cancelbtn`" @click="forgotPassword.hide()" v-if="!emailSent">
            Cancel
         </V4Button>
         <V4Button mode="primary" :id="`${id}-okbtn`" @click="okClicked"
            :focusNextOverride="true" @tabnext="nextTabOK" :disabled="okDisabled">
            OK
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
import { ref } from 'vue'

const forgotPassword = ref(null)
const id = ref("forgot-password")
const userId = ref("")
const emailSent = ref(false)
const error = ref("")
const okDisabled = ref(false)

function opened() {
   userId.value = ""
   emailSent.value = false
   error.value = ""
   okDisabled.value = false
}
function nextTabOK() {
   forgotPassword.value.lastFocusTabbed()
}
function toggleOK(){
   okDisabled.value = !okDisabled.value
}
function okClicked() {
   if (emailSent.value == true){
      forgotPassword.value.hide()
      return
   }
   const userStore = useUserStore()
   toggleOK()
   userStore.forgotPassword(userId.value).then(() => {
      emailSent.value = true
   }).catch((e) => {
      error.value = "There's a problem with your account. <a href='https://www.library.virginia.edu/askalibrarian' target='_blank'>Ask a Librarian</a> for help.<br/>"
      if(e.response.data.message){
         error.value += e.response.data.message
      }
   }).finally(()=>{
      toggleOK()
   })
}
</script>

<style lang="scss" scoped>
.v4-button {
  margin-top: 2em;
}
.password-reset-form{
   margin-bottom:15px;
   display: flex;
}
input[type=password] {
   width: 100%;
}
label {
   display: block;
   margin: 10px 0 2px 0;
   padding-bottom: .25em;
   font-weight: bold;
}
.hint {
   margin: 2em auto auto 1em;
}
p.error {
   color: var(--uvalib-red-darker);
}
</style>