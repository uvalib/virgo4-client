<template>
   <V4Button mode="primary" @click="showUpdateDialog = true" :disabled="showUpdateDialog" ref="trigger">
      Update my Virgo contact information
   </V4Button>
   <Dialog v-model:visible="showUpdateDialog" :modal="true" position="top" header="Update Contact Info" @hide="closeDialog" @show="opened">
      <FormKit type="form" id="update-contact" :actions="false" @submit="submitUpdate">
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

         <div class="form-controls" >
            <V4Button mode="tertiary" @click="closeDialog">Cancel</V4Button>
            <FormKit type="submit" label="Update" wrapper-class="submit-button" :disabled="okDisabled" />
         </div>
      </FormKit>
   </Dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useUserStore } from "@/stores/user"
import Dialog from 'primevue/dialog'
import { useToast } from "primevue/usetoast"

const toast = useToast()
const userStore = useUserStore()

const showUpdateDialog = ref(false)
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
const error = ref("")
const okDisabled = ref(false)
const trigger = ref(null)

const opened = (() => {
   contact.value.userID = userStore.signedInUser
   contact.value.email = userStore.accountInfo.email
   contact.value.preferredName = userStore.accountInfo.sirsiProfile.preferredName
   contact.value.firstName = userStore.accountInfo.sirsiProfile.firstName
   contact.value.middleName = userStore.accountInfo.sirsiProfile.middleName
   contact.value.lastName = userStore.accountInfo.sirsiProfile.lastName
   contact.value.phone = userStore.accountInfo.sirsiProfile.address1.phone
   contact.value.email = userStore.accountInfo.email
   error.value = ""
   okDisabled.value = false
   // Shallow clone
   originalContact.value = {...contact.value}
})

const closeDialog = (() => {
   showUpdateDialog.value = false
   // document.getElementById("update-trigger").focus()
   trigger.value.$el.focus()
})

const submitUpdate = (() => {
   error.value = ""
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

   okDisabled.value = true
   let info = {newContact: contact.value, oldContact: originalContact.value}
   userStore.updateContactInfo(info).then(() => {
      showUpdateDialog.value = false
      let msg = "An email has been sent to library staff requesting an update to your contact information."
      toast.add({severity:'success', summary:  "Request Submitted", detail:  msg, life: 6000})
   }).catch((e) => {
      error.value = "Unable to update contact info. <a href='https://www.library.virginia.edu/askalibrarian' target='_blank'>Ask a Librarian</a> for help.<br/>"
      if(e.response.data.message){
         error.value += `: ${e.response.data.message}`
      }
   }).finally(()=>{
      okDisabled.value = false
   })
})

</script>

<style lang="scss" scoped>
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
   width: 100%;
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