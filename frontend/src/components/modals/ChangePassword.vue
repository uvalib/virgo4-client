<template>
   <V4Modal :id="id" title="Change Password" ref="changePassword"  @opened="opened"
      firstFocusID="currPassword" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.changePassword.show()" :id="`${id}-open`">
            Change Password
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="passwordChanged">
            <p>
               Your password has been changed
            </p>
         </template>
         <template v-else>
            <p>New passwords must:</p>
            <ul>
               <li>
                  Not be a previously used password
               </li>
               <li>
                     Contain between 12 and 25 characters
               </li>
               <li>
                  Include at least one lower-case letter
               </li>
               <li>
                  Include at least one upper-case letter
               </li>
               <li>
                  Include at least one numeral (digit)
               </li>
               <li>
                  Optional special characters allowed: ! , @ # $ % & * + ( ) _ - ?
               </li>
            </ul>
            <div class="message pure-form">
               <div>
                  <label for="currpassword">Current PIN/Password</label>
                  <input ref="currPassword" id="currPassword" type="password" v-model="currPassword" @keydown.shift.tab.stop.prevent="backTabCP"
                     aria-required="true" required="required"/>
               </div>
               <div>
                  <label for="newPassword">New Password</label>
                  <input id="newPassword" ref="newPassword" type="password" v-model="newPassword"
                     aria-required="true" required="required"/>
               </div>
               <div>
                  <label for="confirm">Confirm Password</label>
                  <input id="confirm" ref="confirm" type="password" v-model="newPasswordConfirm"
                     aria-required="true" required="required"/>
               </div>

               <p v-if="error" class="error">{{error}}</p>
            </div>
         </template>
      </template>
      <template v-slot:controls>
         <V4Button v-if="passwordChanged == false" mode="tertiary" :id="`${id}-cancelbtn`" @click="$refs.changePassword.hide()">
            Cancel
         </V4Button>
         <V4Button mode="primary" :id="`${id}-okbtn`" @click="okClicked"
            :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Modal>
</template>

<script>
export default {
   data: function() {
      return {
         id: "change-password",
         currPassword: "",
         newPassword: "",
         newPasswordConfirm: "",
         error: "",
         passwordChanged: false
      }
   },
   methods: {
      opened() {
         this.currPassword = ""
         this.newPassword = ""
         this.newPasswordConfirm = ""
         this.error = ""
         this.passwordChanged = false
      },
      backTabCP() {
         this.$refs.changePassword.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.changePassword.lastFocusTabbed()
      },
      okClicked() {
         if ( this.passwordChanged) {
            this.$refs.changePassword.hide()
         } else {
            this.error = ""
            if ( this.currPassword == "" || this.newPassword == "" || this.newPasswordConfirm == "")  {
               this.$refs.currPassword.focus()
               this.error = "All three fields are required"
               return
            }
            if ( this.newPassword != this.newPasswordConfirm)  {
               this.$refs.newPassword.focus()
               this.error = "New password confirmation did not match"
               return
            }
            let data  = {current_pin: this.currPassword, new_pin: this.newPassword}
            this.$store.dispatch("user/changePassword", data).then(() => {
               this.passwordChanged = true
            }).catch((e) => {
               console.log(e)
               this.$refs.currPassword.focus()
               if(e.response.data.message){
                  this.error = e.response.data.message
               } else {
                  this.error = "Password change failed. Please check your current password."
               }
            })
         }
      },
   }
}
</script>

<style lang="scss" scoped>
.message {
   margin-bottom:15px;
}
input[type=password] {
   width: 100%;
}
label {
   display: block;
   margin: 10px 0 2px 0;
   font-weight: bold;
}
p.error {
   padding: 0;
   font-size: 0.8em;
   color: var(  --uvalib-red-emergency);
   text-align: center;
}
</style>
