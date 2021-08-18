<template>
   <V4Modal :id="id" title="Change Password" ref="changePassword"  @opened="opened"
      firstFocusID="currPassword" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.changePassword.show()"
            v-if="!hasPasswordToken" :id="`${id}-open`" >
            Change Password
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="passwordChanged">
            <p>
               Your password has been changed.
            </p>
         </template>
         <template v-else-if="expiredToken">
            <p class="error" v-html="error"></p>
            <p class="error">Please request a new password reset email.</p>
         </template>
         <template v-else>
            <p>New passwords must:</p>
            <ul>
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
               <div v-if="!hasPasswordToken">
                  <label for="currpassword">Current Password</label>
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

               <p v-if="error" class="error" v-html="error"></p>
            </div>
         </template>
      </template>
      <template v-slot:controls>
         <V4Button v-if="passwordChanged == false && !expiredToken" mode="tertiary" :id="`${id}-cancelbtn`" @click="$refs.changePassword.hide()">
            Cancel
         </V4Button>
         <V4Button :disabled="okDisabled" mode="primary" :id="`${id}-okbtn`" @click="okClicked"
             :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Modal>
</template>

<script>
export default {
   emits: ['show-forgot-password'],
   data: function() {
      return {
         id: "change-password",
         currPassword: "",
         newPassword: "",
         newPasswordConfirm: "",
         passwordToken: "",
         error: "",
         passwordChanged: false,
         okDisabled: false,
         expiredToken: false
      }
   },
   computed: {
      hasPasswordToken: function(){
         return this.$route.query.token && this.$route.query.token.length > 0
      },
   },
   mounted() {
      if(this.hasPasswordToken){
         this.passwordToken = this.$route.query.token
         this.$refs.changePassword.show()
      }
   },
   methods: {
      opened() {
         this.currPassword = ""
         this.newPassword = ""
         this.newPasswordConfirm = ""
         this.error = ""
         this.passwordChanged = false
         this.okDisabled = false
      },
      backTabCP() {
         this.$refs.changePassword.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.changePassword.lastFocusTabbed()
      },
      toggleOk() {
         this.okDisabled = !this.okDisabled
      },
      okClicked() {
         if ( this.passwordChanged ) {
            let query = Object.assign({}, this.$route.query);
            delete query.token;
            this.$router.replace({ query });
            this.$refs.changePassword.hide()
            return
         }else if(this.expiredToken){
            let query = Object.assign({}, this.$route.query);
            delete query.token;
            this.$router.replace({ query });
            this.$refs.changePassword.hide()
            this.$parent.$children.forEach( (c)=> c.$emit("show-forgot-password") )
            return

         } else {
            this.error = ""
            if ( !this.hasPasswordToken && (this.currPassword == "" ||
                  this.newPassword == "" || this.newPasswordConfirm == ""))  {
               this.$refs.currPassword.focus()
               this.error = "All three fields are required"
               return
            }
            if ( this.newPassword != this.newPasswordConfirm)  {
               this.$refs.newPassword.focus()
               this.error = "New password confirmation did not match"
               return
            }
            if (this.newPassword.length < 12 || this.newPassword.length > 25){
               this.$refs.newPassword.focus()
               this.error = "New password must be between 12 and 25 characters"
               return
            }
            // Check caps & numerals
            const regex = RegExp('^(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[a-z]).*$')
            if(!regex.test(this.newPassword)){
               this.$refs.newPassword.focus()
               this.error = "New password must meet the complexity requirements."
               return
            }
            const restrictedChars = RegExp(/[^a-zA-Z0-9!,@#$%&*+()_\-? ]/)
            if(restrictedChars.test(this.newPassword)){
               this.$refs.newPassword.focus()
               this.error = "Please only use the allowed special characters."
               return
            }

            this.toggleOk()
            if(this.hasPasswordToken){
               let data = {reset_password_token: this.passwordToken, new_password: this.newPassword}
               this.$store.dispatch("user/changePasswordWithToken", data).then(() => {
                  this.passwordChanged = true
               }).catch((e) => {
                  this.expiredToken = true

                  if(e.response.data.message){
                     this.error = e.response.data.message
                  } else {
                     this.error = "Password change failed."
                  }
               }).finally(()=>{
                  this.toggleOk()
               })
            }else{
               let data  = {current_pin: this.currPassword, new_pin: this.newPassword}
               this.$store.dispatch("user/changePassword", data).then(() => {
                  this.passwordChanged = true
               }).catch((e) => {
                  console.log(e)
                  this.$refs.currPassword.focus()
                  this.error = "Password change failed.</br>"
                  if(e.response.data.message){
                     this.error += e.response.data.message
                  }else{
                     this.error += "Please check your current password."
                  }
               }).finally(()=>{
                  this.toggleOk()
               })
            }
            return
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
