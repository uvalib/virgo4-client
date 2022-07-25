<template>
   <V4Modal :id="id" title="Update Contact Info" class="update-modal" ref="updateInfo"
      @opened="opened" :controls="emailSent"
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
         <FormKit v-else type="form" id="update-contact" :actions="false" @submit="okClicked">
            <div class="scroller">
               <div class="section">
                 <p class="section-name">Name</p>
                 <div class="content">
                     <FormKit type="text" label="First" v-model="contact.firstName" id="firstname"/>
                     <FormKit type="text" label="Middle" v-model="contact.middleName"/>
                     <FormKit type="text" label="Last" v-model="contact.lastName"/>
                     <FormKit type="text" label="Preferred" v-model="contact.preferredName" help="We will address you by this name if supplied."/>
                  </div>
               </div>
               <div class="section">
                  <p class="section-name pad-top">Contact</p>
                  <div class="content">
                     <FormKit type="email" label="Email" v-model="contact.email" validation="required"/>
                     <FormKit type="text" label="Phone" v-model="contact.phone"/>
                  </div>
               </div>
            </div>
            <p v-if="error" class="error" v-html="error"></p>
            <V4FormActions :hasCancel="true" submitLabel="OK" :submitID="`${id}-okbtn`"
               :tabNextOverride="true" @tabnext="nextTabOK"
               @canceled="updateInfo.hide()"
            />
         </FormKit>
      </template>
      <template v-if="emailSent"  v-slot:controls>
         <V4Button mode="tertiary" :id="`${id}-okbtn`" @click="okClicked"
             :focusNextOverride="true" @tabnext="nextTabOK">
            OK
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
   let ele = document.getElementById("firstname")
   ele.focus()
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
   width: 400px;
   max-height: 55vh;
   overflow: scroll;
   padding: 10px;
   border: 1px solid var(--uvalib-grey-light);
   background: white;
   font-size: 0.9em;
    div.section {
      font-size: 1em;
      font-weight: bold;
      margin: 0;
      .section-name {
         border-bottom: 1px solid var(--uvalib-grey);
         padding: 0 0 5px 0;
         margin:0;
      }
      .content {
         margin-left: 15px;
      }
   }
   .pad-top {
      margin-top: 15px;
   }
}
</style>