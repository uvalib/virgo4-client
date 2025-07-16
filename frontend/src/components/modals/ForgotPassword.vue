<template>
   <VirgoButton link @click="passwords.showForgotPass = true" :disabled="passwords.showForgotPass" ref="trigger" label="Forgot your password?"/>
   <Dialog v-model:visible="passwords.showForgotPass" :modal="true" position="top" header="Forgot Password"
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
         <div v-if="passwords.error" class="error" v-html="passwords.error"></div>
      </div>
      <template #footer>
         <VirgoButton severity="secondary" @click="closeDialog" label="Cancel"/>
         <VirgoButton label="OK" @click="okClicked" :loading="passwords.working" />
      </template>
   </Dialog>
</template>

<script setup>
import { usePasswordStore } from "@/stores/password"
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import { setFocusID } from '@/utils'

const passwords = usePasswordStore()
const userId = ref("")
const trigger = ref(null)

const opened = (() => {
   userId.value = ""
   setFocusID("forgot-id")
})

const closeDialog = (() => {
   passwords.showForgotPass = false
   trigger.value.$el.focus()
})

const okClicked = ( async () => {
   passwords.forgotPassword( userId.value)
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