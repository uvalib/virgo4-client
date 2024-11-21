<template>
   <VirgoButton link @click="userStore.showForgotPW = true" :disabled="userStore.showForgotPW" ref="trigger" label="Forgot your password?"/>
   <Dialog v-model:visible="userStore.showForgotPW" :modal="true" position="top" header="Forgot Password"
      @hide="closeDialog" @show="opened" :draggable="false"
   >
      <div class="forgot">
         <p>
            An email will be sent to the address on file with a link to reset your password.<br/>If you need assistance, please
            <a target="_blank" href="https://www.library.virginia.edu/askalibrarian">Ask a Librarian</a>.
         </p>
         <label for="forgot-id">Library ID* <span class="required">(required)</span></label>
         <input type="text" v-model="userId" id="forgot-id" @keyup.enter="searchClicked"/>
         <div class="help">Library ID, eg: C001005101 or TEMP001166</div>
         <div v-if="error" class="error" v-html="error"></div>
      </div>
      <template #footer>
         <VirgoButton severity="secondary" @click="closeDialog" label="Cancel"/>
         <VirgoButton label="OK" @click="okClicked" :disabled="okDisabled" />
      </template>
   </Dialog>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import { useToast } from "primevue/usetoast"
import { setFocusID } from '@/utils'

const toast = useToast()
const userStore = useUserStore()
const userId = ref("")
const error = ref("")
const okDisabled = ref(false)
const trigger = ref(null)

const opened = (() => {
   userId.value = ""
   error.value = ""
   okDisabled.value = false
   setFocusID("forgot-id")
})

const closeDialog = (() => {
   userStore.showForgotPW = false
   trigger.value.$el.focus()
})

const okClicked = (() => {
   if  ( userId.value == "" ) {
      error.value = "Library ID is required"
      return
   }
   okDisabled.value = true
   userStore.forgotPassword(userId.value).then(() => {
      userStore.showForgotPW = false
      let msg = "An email has been sent to reset your password."
      toast.add({severity:'success', summary:  "Request Submitted", detail:  msg, life: 5000})
   }).catch((e) => {
      error.value = "There's a problem with your account. <a href='https://www.library.virginia.edu/askalibrarian' target='_blank'>Ask a Librarian</a> for help.<br/>"
      if(e.response.data.message){
         error.value += e.response.data.message
      }
   }).finally(()=>{
      okDisabled.value = false
   })
})
</script>

<style lang="scss" scoped>
.forgot {
   display: flex;
   flex-direction: column;
   gap: 10px;
   label {
      font-weight: bold;
   }
   .required {
      font-weight: 100;
      font-size: .8em;
      color: $uva-grey-50;
   }
   .help {
      font-size: .9em;
      color: $uva-grey-50;
   }
   .error {
      color: $uva-red-A;
   }
}
</style>