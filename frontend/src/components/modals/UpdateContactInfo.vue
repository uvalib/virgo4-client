<template>
   <V4Modal :id="id" title="Update Contact Info" class="update-modal" ref="updateInfo"
      @opened="opened"
      @show-forgot-password="updateInfo.show()"
      firstFocusID="firstname" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="primary" @click="updateInfo.show()" :id="`${id}-open`" class="trigger">
            Update my Virgo contact information
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="emailSent">
            <p>
               An email has been sent to library staff requesting an update to your contact information.
            </p>
         </template>
         <div class="scroller" v-else>
            <form class="update-info-form pure-form-aligned pure-form"><fieldset>
               <div class="section">Name</div>

               <div class="pure-control-group">
                  <label for="firstname">First:</label>
                  <input @keydown.shift.tab.stop.prevent="backTabInput" type="text" v-model="contact.firstName" id="firstname">
               </div>
               <div class="pure-control-group">
                  <label for="middlename">Middle:</label>
                  <input type="text" v-model="contact.middleName" id="middlename">
               </div>
               <div class="pure-control-group">
                  <label for="lastname">Last:</label>
                  <input type="text" v-model="contact.lastName" id="lastname">
               </div>
               <div class="pure-control-group">
                  <label for="nickname">Preferred:</label>
                  <input type="text" v-model="contact.preferredName" id="nickname">
                  <span class="pure-form-message left">We will address you by this name if supplied.</span>
               </div>

               <div class="section">Contact</div>
               <div class="pure-control-group">
                  <label for="email">Email:</label>
                  <input type="text" v-model="contact.email" id="email">
               </div>
               <div class="pure-control-group">
                  <label for="phone">Phone:</label>
                  <input type="text" v-model="contact.phone" id="phone">
               </div>
            </fieldset></form>
         </div>
         <p v-if="error" class="error" v-html="error"></p>
      </template>
      <template v-slot:controls>
         <V4Button  mode="tertiary" :id="`${id}-cancelbtn`" @click="updateInfo.hide()" v-if="!emailSent">
            Cancel
         </V4Button>
         <V4Button mode="primary" :id="`${id}-okbtn`" @click="okClicked"
            :focusNextOverride="true" @tabnext="nextTabOK" :disabled="okDisabled">
            {{okButtonText()}}
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()

const updateInfo = ref(null)
const contact = ref({
   userID: "",
   firstName: "",
   nickName: "",
   middleName: "",
   lastName: "",
   phone: "",
   email: ""
})
const originalContact = ref({})
const emailSent = ref(false)
const error = ref("")
const okDisabled = ref(false)
const id = ref("update-contact")

function opened(){
   contact.value.userID = userStore.signedInUser
   contact.value.email = userStore.accountInfo.email
   contact.value.preferredName = userStore.accountInfo.sirsiProfile.preferredName
   contact.value.firstName = userStore.accountInfo.sirsiProfile.firstName
   contact.value.middleName = userStore.accountInfo.sirsiProfile.middleName
   contact.value.lastName = userStore.accountInfo.sirsiProfile.lastName
   contact.value.phone = userStore.accountInfo.sirsiProfile.address1.phone
   contact.value.email = userStore.accountInfo.email
   emailSent.value = false
   error.value = ""
   okDisabled.value = false
   // Shallow clone
   originalContact.value = {...contact.value}
}
function okButtonText() {
   if (emailSent.value) return "OK"
   return "Submit"
}
function backTabInput() {
   updateInfo.value.firstFocusBackTabbed()
}
function nextTabOK() {
   updateInfo.value.lastFocusTabbed()
}
function toggleOK(){
   okDisabled.value = !okDisabled.value
}
function okClicked() {
   error.value = ""
   if (emailSent.value == true){
      updateInfo.value.hide()
      return
   }

   let hasChanges = false
   for (const [key, value] of Object.entries(contact.value)) {
      if(value != originalContact.value[key]){
         hasChanges = true
      }
   }
   if (!hasChanges) {
      error.value = "Nothing has changed"
      return
   }

   if ( contact.value.email == "") {
      error.value = "Please enter an email address"
      return
   }

   toggleOK()
   let info = {newContact: contact.value, oldContact: originalContact.value}
   userStore.updateContactInfo(info).then(() => {
      emailSent.value = true
   }).catch((e) => {
      error.value = "Unable to update contact info. <a href='https://www.library.virginia.edu/askalibrarian' target='_blank'>Ask a Librarian</a> for help.<br/>"
      if(e.response.data.message){
         error.value += `: ${e.response.data.message}`
      }
   }).finally(()=>{
      toggleOK()
   })
}

</script>

<style lang="scss" scoped>
.update-modal{
   button.v4-button.trigger {
      margin: 0 !important;
   }
   .pure-form-aligned .pure-control-group label {
      width: 6em;
   }
}
.v4-button {
  margin-top: 2em;
}
p.error {
   text-align: center;
   color: var(--color-error);
   font-style: italic;
   :deep(a) {
      color: var(--color-error) !important;
      font-weight: bold !important;
      text-decoration: underline !important;;
   }
}
.scroller {
   max-height: 55vh;
   overflow: scroll;
   padding: 10px;
    border: 1px solid var(--uvalib-grey-light);
    background: white;
}
.update-info-form{
   margin-bottom:15px;
   font-size: 0.9em;
   div.section {
      font-size: 1em;
      font-weight: bold;
      margin: 10px 0 15px 0;
      border-bottom: 1px solid var(--uvalib-grey);
      padding-bottom: 5px;
   }

   .pure-form-message.left {
      text-align: left;
      margin: 0 0 15px 20px;
      font-style: italic;
   }

   input {
      width: 15em;
   }

}
</style>