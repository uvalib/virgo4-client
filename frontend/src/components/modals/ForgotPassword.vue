<template>
   <V4Modal :id="id" title="Forgot Password" ref="forgotPassword" @opened="opened"
      firstFocusID="forgot-id" :lastFocusID="`${id}-okbtn`"
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
             <p>
               An email will be sent to the address on file with a link to reset your password. If you need assistance, please
               <a target="_blank" href="https://www.library.virginia.edu/askalibrarian">Ask a Librarian</a>.
            </p>
            <FormKit type="form" id="forgot-pass" :actions="false" @submit="okClicked">
               <FormKit label="Library ID" type="text" v-model="userId" id="forgot-id" validation="required" help="Driver's License Number, eg: A12345678" />
               <V4FormActions :hasCancel="!emailSent" submitLabel="OK" :submitID="`${id}-okbtn`"
                  :tabNextOverride="true" @tabnext="nextTabOK"
                  :disabled="okDisabled"
                  @canceled="forgotPassword.hide()"/>
            </FormKit>
            <p v-if="error" class="error" v-html="error"></p>
          </template>
      </template>
      <template v-slot:controls>
         <!-- no dialog controls; the V4FormActions are used instead-->
      </template>
   </V4Modal>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
import { ref, watch } from 'vue'

const props = defineProps({
   trigger: {
      type: Boolean,
      default: false,
   },
})

watch(() => props.trigger, (newtrigger) => {
   if ( newtrigger ) {
      forgotPassword.value.show()
   }
})

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
   let ele = document.getElementById("forgot-id")
   ele.focus()
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