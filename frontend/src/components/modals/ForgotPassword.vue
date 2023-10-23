<template>
   <VirgoButton link @click="userStore.showForgotPW = true" :disabled="userStore.showForgotPW" ref="trigger" label="Forgot your password?"/>
   <Dialog v-model:visible="userStore.showForgotPW" :modal="true" position="top" header="Forgot Password" @hide="closeDialog" @show="opened">
      <p>
         An email will be sent to the address on file with a link to reset your password. If you need assistance, please
         <a target="_blank" href="https://www.library.virginia.edu/askalibrarian">Ask a Librarian</a>.
      </p>
      <FormKit type="form" id="forgot-pass" :actions="false" @submit="okClicked">
         <FormKit label="Library ID" type="text" v-model="userId" id="forgot-id" validation="required" help="Library ID, eg: C001005101 or TEMP001166" />
         <div class="form-controls" >
            <VirgoButton severity="secondary" @click="closeDialog" label="Cancel"/>
            <FormKit type="submit" label="OK" wrapper-class="submit-button" :disabled="okDisabled" />
         </div>
      </FormKit>
      <p v-if="error" class="error" v-html="error"></p>
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