<template>
   <VirgoButton @click="showUpdateDialog = true" label="Update my Virgo contact information"/>
   <Dialog v-model:visible="showUpdateDialog" :modal="true" position="top"
      style="max-width: 600px" :draggable="false"
      header="Update Contact Info" @show="opened"
   >
      <FormKit type="form" id="update-contact" :actions="false" @submit="submitUpdate" ref="contactform">
         <div class="scroller">
            <div class="section">
               <p class="section-name">Name</p>
               <div class="content">
                  <p :v-if="userStore.isUVA">Virgo pulls your name, shown below, from UVA's Identity and Access Management system.
                     Visit <a target="_blank" aria-describedby="new-window" href="https://in.virginia.edu/profile">https://in.virginia.edu/profile</a> to change your preferred name.
                  </p>
                  <FormKit type="text" label="First" :disabled="userStore.isUVA" v-model="contact.firstName" id="firstname"/>
                  <FormKit type="text" label="Middle" :disabled="userStore.isUVA" v-model="contact.middleName"/>
                  <FormKit type="text" label="Last" :disabled="userStore.isUVA" v-model="contact.lastName"/>
               </div>
            </div>
            <div class="section">
               <p class="section-name pad-top">Contact</p>
               <div class="content">
                  <FormKit type="group">
                     <FormKit type="email" name="email" label="Email" v-model="contact.email" validation="required" id="email"/>
                     <FormKit type="email" name="email_confirm" label="Email Confirmation" validation="confirm" />
                     <FormKit type="text" label="Phone" v-model="contact.phone"/>
                  </FormKit>
               </div>
            </div>
         </div>
         <p v-if="error" class="error" v-html="error"></p>
      </FormKit>
      <template #footer>
         <VirgoButton severity="secondary" @click="showUpdateDialog=false" label="Cancel"/>
         <VirgoButton @click="contactform.node.submit()" label="Update" :disabled="okDisabled"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import Dialog from 'primevue/dialog'

const system = useSystemStore()
const userStore = useUserStore()

const showUpdateDialog = ref(false)
const contact = ref({
   userID: "",
   firstName: "",
   middleName: "",
   lastName: "",
   phone: "",
   email: ""
})
const originalContact = ref({})
const error = ref("")
const okDisabled = ref(false)
const contactform = ref()

const opened = (() => {
   contact.value.userID = userStore.signedInUser
   contact.value.email = userStore.accountInfo.email
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
      system.setToast("Request Submitted", msg)
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
   color:$uva-red-A;
   font-style: italic;
   :deep(a) {
      color :$uva-red-A !important;
      font-weight: bold !important;
      text-decoration: underline !important;;
   }
}
.scroller {
   max-height: 400px;
   overflow-y: scroll;
   border: 1px solid $uva-grey-100;
   .content {
      p {
         margin: 0;
      }
   }
   .section-name {
      border-bottom: 1px solid $uva-grey;
      margin: 5px;
   }
}
</style>