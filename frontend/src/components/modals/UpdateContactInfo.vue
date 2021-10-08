<template>
   <V4Modal :id="id" title="Update Contact Info" class="update-modal" ref="updateInfo" @opened="opened" @show-forgot-password="refs.updateInfo.show()"
      firstFocusID="firstname" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.updateInfo.show()" :id="`${id}-open`" class="trigger">
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

               <!--<div class="section">Address</div>
               <div class="pure-control-group">
                  <label for="address1">Line 1:</label>
                  <input type="text" v-model="contact.address1" id="address1" placeholder="Street Address">
               </div>
               <div class="pure-control-group">
                  <label for="address2">Line 2:</label>
                  <input type="text" v-model="contact.address2" id="address2" placeholder="Street Address Line 2">
               </div>
               <div class="pure-control-group">
                  <label for="address3">Line 3:</label>
                  <input type="text" v-model="contact.address3" id="address3" placeholder="City, State">
               </div>
               <div class="pure-control-group">
                  <label for="zip">Zipcode:</label>
                  <input type="text" v-model="contact.zip" id="zip">
               </div>-->

            </fieldset></form>
         </div>
         <p v-if="error" class="error" v-html="error"></p>
      </template>
      <template v-slot:controls>
         <V4Button  mode="tertiary" :id="`${id}-cancelbtn`" @click="$refs.updateInfo.hide()" v-if="!emailSent">
            Cancel
         </V4Button>
         <V4Button mode="primary" :id="`${id}-okbtn`" @click="okClicked"
            :focusNextOverride="true" @tabnext="nextTabOK" :disabled="okDisabled">
            Submit
         </V4Button>
      </template>
   </V4Modal>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         userID: state => state.user.signedInUser,
         account: state => state.user.accountInfo,
      })
   },
   data: function() {
      return {
         contact: {
            userID: "",
            firstName: "",
            nickName: "",
            middleName: "",
            lastName: "",
           //address1: "",
           //address2: "",
           //address3: "",
           // zip: "",
            phone: "",
            email: ""
         },
         originalContact: {},

         emailSent: false,
         error: "",
         okDisabled: false,
         id: "update-contact",
      }
   },
   props: ['user'],
   methods: {
      opened(){
         this.contact.userID = this.userID
         this.contact.email = this.account.email
         this.contact.preferredName = this.account.sirsiProfile.preferredName
         this.contact.firstName = this.account.sirsiProfile.firstName
         this.contact.middleName = this.account.sirsiProfile.middleName
         this.contact.lastName = this.account.sirsiProfile.lastName

         //this.contact.address1 = this.account.sirsiProfile.address1.line1
         //this.contact.address2 = this.account.sirsiProfile.address1.line2
         //this.contact.address3 = this.account.sirsiProfile.address1.line3
         //this.contact.zip = this.account.sirsiProfile.address1.zip
         this.contact.phone = this.account.sirsiProfile.address1.phone

         this.contact.email = this.account.email
         this.emailSent = false
         this.error = ""
         this.okDisabled = false
         // Shallow clone
         this.originalContact = {...this.contact}

      },
      backTabInput() {
         this.$refs.updateInfo.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.updateInfo.lastFocusTabbed()
      },
      toggleOK(){
         this.okDisabled = !this.okDisabled
      },
      okClicked() {
         this.error = ""
         if (this.emailSent == true){
           this.$refs.updateInfo.hide()
           return
         }

         let hasChanges = false
         for (const [key, value] of Object.entries(this.contact)) {
            if(value != this.originalContact[key]){
               hasChanges = true
            }
         }
         if (!hasChanges) {
            this.error = "Nothing has changed"
            return
         }

         if ( this.contact.email == "") {
            this.error = "Please enter an email address"
            return
         }

         this.toggleOK()
         let info = {newContact: this.contact, oldContact: this.originalContact}
         this.$store.dispatch("user/updateContactInfo", info).then(() => {
            this.emailSent = true
         }).catch((e) => {
            this.error = "Unable to update contact info. <a href='https://www.library.virginia.edu/askalibrarian' target='_blank'>Ask a Librarian</a> for help.<br/>"
            if(e.response.data.message){
               this.error += `: ${e.response.data.message}`
            }
         }).finally(()=>{
            this.toggleOK()
         })
      },
   }
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