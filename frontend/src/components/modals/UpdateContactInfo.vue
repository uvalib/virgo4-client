<template>
   <V4Modal :id="id" title="Update Contact Info" class="update-modal" ref="updateInfo" @opened="opened" @show-forgot-password="refs.updateInfo.show()"
      firstFocusID="firstname" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.updateInfo.show()" :id="`${id}-open`" class="trigger">
            Update Contact Info
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="emailSent">
            <p>
               An email has been sent to library staff requesting an update to your contact information.
            </p>
         </template>
         <div class="scroller" v-else>
            <table class="update-info-form">
               <tr>
                  <td colspan="2"><div class="section">Name</div></td>
               </tr>
               <tr>
                  <td class="label"><label for="firstname">First:</label></td>
                  <td>
                     <input @keydown.shift.tab.stop.prevent="backTabInput" type="text" v-model="contact.firstName" id="firstname">
                  </td>
               </tr>
               <tr>
                  <td class="label"><label for="nickname">Preferred:</label></td>
                  <td>
                     <input type="text" v-model="contact.nickName" id="nickname">
                     <span class="note">We will address you by this name if supplied.</span>
                  </td>
               </tr>
               <tr>
                  <td class="label"><label for="middlename">Middle:</label></td>
                  <td><input type="text" v-model="contact.middleName" id="middlename"></td>
               </tr>
               <tr>
                  <td class="label"><label for="lastname">Last:</label></td>
                  <td><input type="text" v-model="contact.lastName" id="lastname"></td>
               </tr>
                <tr>
                  <td colspan="2"><div class="section">Contact</div></td>
               </tr>
               <tr>
                  <td class="label"><label for="email">Email:</label></td>
                  <td><input type="text" v-model="contact.email" id="email"></td>
               </tr>
               <tr>
                  <td class="label"><label for="phone">Phone:</label></td>
                  <td><input type="text" v-model="contact.phone" id="phone"></td>
               </tr>
               <tr>
                  <td colspan="2"><div class="section">Address</div></td>
               </tr>
               <tr>
                  <td class="label"><label for="address1">Line 1:</label></td>
                  <td><input type="text" v-model="contact.address1" id="address1"></td>
               </tr>
               <tr>
                  <td class="label"><label for="address2">Line 2:</label></td>
                  <td><input type="text" v-model="contact.address2" id="address2"></td>
               </tr>
               <tr>
                  <td class="label"><label for="address3">Line 3:</label></td>
                  <td><input type="text" v-model="contact.address3" id="address3"></td>
               </tr>
               <tr>
                  <td class="label"><label for="city">City:</label></td>
                  <td><input type="text" v-model="contact.city" id="city"></td>
               </tr>
               <tr>
                  <td class="label"><label for="state">State:</label></td>
                  <td>
                     <div class="multivalue">
                        <input type="text" v-model="contact.state" id="state">
                        <span>
                           <label for="city">Zip:</label>
                            <input type="text" v-model="contact.zip" id="zip">
                        </span>
                     </div>
                  </td>
               </tr>

            </table>
            <p v-if="error" class="error" v-html="error"></p>
         </div>
      </template>
      <template v-slot:controls>
         <V4Button  mode="tertiary" :id="`${id}-cancelbtn`" @click="$refs.updateInfo.hide()" v-if="!emailSent">
            Cancel
         </V4Button>
         <V4Button mode="primary" :id="`${id}-okbtn`" @click="okClicked"
            :focusNextOverride="true" @tabnext="nextTabOK" :disabled="okDisabled">
            OK
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
            address1: "",
            address2: "",
            address3: "",
            city: "",
            state: "",
            zip: "",
            phone: "",
            email: ""
         },

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
         let bits = this.account.displayName.split(" ")
         this.contact.firstName = bits[0]
         this.contact.lastName = bits[bits.length - 1]
         this.emailSent = false
         this.error = ""
         this.okDisabled = false
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
         if (this.emailSent == true){
           this.$refs.updateInfo.hide()
           return
         }
         this.toggleOK()
         this.$store.dispatch("user/updateContactInfo", this.contact).then(() => {
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
   max-height: 350px;
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
   td.label {
      padding-right: 5px;
      padding-top: 4px;
   }
   td {
      vertical-align: top;
      label {
         text-align: right;
         margin: 0;
         width: 100%;
         display: inline-block;
      }
      input {
         box-sizing: border-box;
         width: 100%;
         border:1px solid var(--uvalib-grey);
         outline: none;
         border-radius: 4px;
         padding: 4px;
         margin-bottom: .3rem;
      }
      .multivalue {
         display: flex;
         flex-flow: row nowrap;
         justify-content: space-between;
         align-content: flex-start;
         label {
            display: inline-block;
            width: auto;
            vertical-align: top;
            margin: 5px 4px 0 0;
         }
         input {
            width: auto;
         }
      }
   }
   .note {
      font-size: 0.9em;
      font-style: italic;
      color: var(--uvalib-grey-dark);
      text-align: right;
      display: inline-block;
      margin-bottom: 15px;
      width: 100%;
   }

}
</style>