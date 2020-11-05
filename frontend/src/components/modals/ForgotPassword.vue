<template>
   <V4Modal :id="id" title="Forgot Password" ref="forgotPassword" @opened="opened"
      firstFocusID="userId" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="text" @click="$refs.forgotPassword.show()" :id="`${id}-open`">
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
             <p>An email will be sent to the address on file with a link to reset your password. If you do not receive an email please ask a librarian.</p>
           <div class="message pure-form">
            <div>
                <label for="userId">Library ID</label>
                <input id="userId" ref="userId" v-model="userId"
                    aria-required="true" required="required"/>
                <p>Driver's License Number, eg: A12345678</p>
              </div>

              <p v-if="error" class="error" v-html="error"></p>
            </div>
          </template>
      </template>
      <template v-slot:controls>
         <V4Button  mode="tertiary" :id="`${id}-cancelbtn`" @click="$refs.forgotPassword.hide()" v-if="!emailSent">
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
export default {
   data: function() {
      return {
         id: "forgot-password",
         userId: "",
         emailSent: false,
         error: "",
         okDisabled: false
      }
   },
   props: ['user'],
   methods: {
      opened(){
         this.userId = this.user
         this.emailSent = false
         this.error = ""
         this.okDisabled = false
      },
      backTabCP() {
         this.$refs.forgotPassword.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.forgotPassword.lastFocusTabbed()
      },
      toggleOK(){
         this.okDisabled = !this.okDisabled
      },
      okClicked() {
         if (this.emailSent == true){
           this.$refs.forgotPassword.hide()
           return
         }

        this.toggleOK()
        // Send email
        this.$store.dispatch("user/forgotPassword", this.userId).then(() => {
               this.emailSent = true
            }).catch((e) => {
               this.$refs.userId.focus()
               this.error = "There was a problem sending the password reset email. Please <a href='https://www.library.virginia.edu/askalibrarian' target='_blank'>Ask a Librarian</a> for more help.<br/>"
               if(e.response.data.message){
                  this.error += e.response.data.message
               }
            }).finally(()=>{
               this.toggleOK()
            })
      },
   }
}
</script>

<style lang="scss" scoped>
.v4-button {
  margin-top: 2em;
}
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