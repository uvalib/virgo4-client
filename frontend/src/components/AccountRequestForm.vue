<template>
   <div v-if="noILSAccount == true && accountRequested == false && publicLDAP"
      class="signup-form pure-form  pure-form-stacked"
   >
      <p>You do not currently have a UVA Library account. Please fill out the form below to request one.</p>
      <p>If you have already requested an account, click Ignore.</p>
      <div class="entry pure-control-group">
         <label for="name">ID<span class="required">*</span></label>
         <input type="text" v-model="id" id="id">
         <span v-if="hasError('id')" class="error">ID type is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="name">Name<span class="required">*</span></label>
         <input type="text" v-model="name" id="name">
         <span v-if="hasError('name')" class="error">Name is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="email">Email<span class="required">*</span></label>
         <input type="email" v-model="email" id="email">
         <span v-if="hasError('email')" class="error">Email is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="phone">Phone<span class="required">*</span></label>
         <input type="text" v-model="phone" id="phone">
         <span v-if="hasError('phone')" class="error">Phone is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="department">Department<span class="required">*</span></label>
         <input type="text" v-model="department" id="department">
         <span v-if="hasError('department')" class="error">Department is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="address1">Address Line 1<span class="required">*</span></label>
         <input type="text" v-model="address1" id="address1">
         <span v-if="hasError('address1')" class="error">Address Line 1 is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="address2">Address Line 2</label>
         <input type="text" v-model="address2" id="address2">
      </div>
      <div class="entry pure-control-group">
         <label for="city">City<span class="required">*</span></label>
         <input type="text" v-model="city" id="city">
         <span v-if="hasError('city')" class="error">City is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="state">State<span class="required">*</span></label>
         <input type="text" v-model="state" id="state">
         <span v-if="hasError('state')" class="error">State is required</span>
      </div>
      <div class="entry pure-control-group">
         <label for="zip">Zip Code<span class="required">*</span></label>
         <input type="text" v-model="zip" id="zip">
         <span v-if="hasError('zip')" class="error">ZIp Code is required</span>
      </div>
      <div class="submit-control">
         <V4Button mode="tertiary" @click="ignoreClicked">Ignore</V4Button>
         <V4Button mode="primary" @click="submitClicked">Submit</V4Button>
      </div>
   </div>
   <div v-else-if="noILSAccount == true && accountRequested == true" class="signup-form pending">
      <p>Your request for a UVA Library account has been submitted and will be created within 1-2 business days.</p>
      <p class="light">You will be notified via email when the account has been created.</p>
      <p class="light">If you have any questions or problems, please contact <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.</p>
   </div>
   <div v-else-if="noILSAccount == true && publicLDAP == false" class="signup-form pending">
      <p class="light">
         You have access to Virgo features such as bookmarks, search history, and preferences,
         but don't have borrowing privileges.
      </p>
      <p class="light">
         Contact <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a> for more information.
      </p>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapFields } from "vuex-map-fields"
export default {
   data: function()  {
      return {
         error: "",
         errors: [],
         required: ['id', 'name', 'email', 'phone', 'department', 'address1', 'city', 'state', 'zip'],
      }
   },
   computed: {
      ...mapState({
         lookingUp: state => state.user.lookingUp,
         accountRequest: state => state.user.accountRequest,
         accountRequested: state => state.user.accountRequested,
         noILSAccount: state => state.user.noILSAccount,
         privateLDAP: state => state.user.accountInfo.private,
      }),
      ...mapFields({
         id: "user.accountRequest.id",
         name: "user.accountRequest.name",
         email: "user.accountRequest.email",
         phone: "user.accountRequest.phone",
         department: "user.accountRequest.department",
         address1: "user.accountRequest.address1",
         address2: "user.accountRequest.address2",
         city: "user.accountRequest.city",
         state: "user.accountRequest.state",
         zip: "user.accountRequest.zip",
      }),
      publicLDAP() {
         return (this.privateLDAP == "false" || this.privateLDAP == false)
      }
   },
   methods: {
      hasError( val) {
         return this.errors.includes(val)
      },
      submitClicked() {
         this.errors.splice(0, this.errors.length)
         for (let [key, value] of Object.entries(this.accountRequest)) {
            if ( this.required.includes(key) && value == "") {
               this.errors.push(key)
            }
         }
         if (this.errors.length > 0) {
            let tgtID = this.errors[0]
            let first = document.getElementById(tgtID)
            if ( first ) {
               first.focus()
            }
         } else {
            this.$store.dispatch("user/submitNewAccountRequest")
         }
      },
      ignoreClicked() {
         this.$store.commit("user/flagAccountRequested")
      }
   },
}
</script>
<style lang="scss" scoped>
@media only screen and (min-width: 768px) {
   .signup-form {
      width:60%;
   }
}
@media only screen and (max-width: 768px) {
   .signup-form {
      width:100%;
   }
}
.signup-form {
   width:60%;
   margin: 0 auto;
   p {
      margin: 10px 0;
      text-align: center;
      font-weight: bold;
   }
   p.light {
      font-weight: normal;
   }
   input{
      width: 100%;
      margin-bottom: 15px !important;
   }
   .submit-control {
      text-align: center;
      margin: 20px 0 50px 0;
   }
   .required {
      margin-left: 5px;
      font-weight: bold;
      color: var(--uvalib-red-emergency);
   }
   span.error {
      margin: 0 0 15px 0;
      font-weight: normal;
      font-style: italic;
      color: var(--color-error);
      display: block;
      position: relative;
      top: -5px;
   }
}
.signup-form.pending {
   margin-top: 45px;
}
</style>
