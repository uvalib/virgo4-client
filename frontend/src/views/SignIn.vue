<template>
   <main class="signin">
      <h1>User Sign In</h1>
      <div class="sign-in-content">
         <div class="netbadge">
            <span class="netbadge">
               <label>UVA Users</label>
               <div class="indent">
                  <span @click="netbadgeLogin" class="pure-button pure-button-primary">Sign In with Netbadge</span>
               </div>
            </span>
         </div>

         <div>
            <label>All Other Users</label>
            <div class="indent">
               <table class="pure-form form">
                  <tr>
                     <td class="label">Library ID</td>
                     <td class="value">
                        <input v-model="user" type="text">
                        <p class="hint">Driver's License Number, eg: A12345678</p>
                     </td>
                  </tr>
                  <tr>
                     <td class="label">PIN</td>
                     <td class="value">
                        <input @keyup.enter="signinClicked" v-model="pin" type="password">
                        <p class="hint">Last four digits of your ID, unless you've updated it</p>
                     </td>
                  </tr>
               </table>
               <span @click="signinClicked" class="pure-button pure-button-primary">Sign In with PIN</span>
            </div>
         </div>
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   name: "signin",
   computed: {
       ...mapGetters({
        hasAuthToken: 'user/hasAuthToken'
      }),
   },
   data: function()  {
      return {
         user: '',
         pin: ''
      }
   },
   methods: {
      signinClicked() {
         this.$store.dispatch("user/signin", {barcode: this.user, password: this.pin})
      },
      netbadgeLogin() {
         this.$store.dispatch("user/netbadge")
      },
   }
}
</script>

<style scoped>
.signin {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
   margin-bottom: 35px;
}
@media only screen and (min-width: 768px) {
   .sign-in-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   .sign-in-content  {
       width: 95%;
   }
}
.sign-in-content {
   width: 60%;
   margin: 0 auto;
   text-align: left;
}

td.label {
  font-weight: 500;
  text-align: right;
  padding: 8px 5px 0 5px;
  width:1%;
  white-space: nowrap;
  vertical-align: text-top;
}
td.value {
   padding: 3px 0 10px 0;
   width: 100%;
}
#app .signin .pure-form input {
   width:100%;
   box-sizing: border-box;
   padding: 6px;
}
p.hint {
   margin: 5px 10px;
   color: #444;
   text-align: left;
}
label {
   color: #444;
   margin-bottom: 15px;
   display: block;
   font-size: 1.25em;
}
span.netbadge .pure-button {
   width:100%;
}
#app .signin .pure-button.pure-button-primary {
   margin: 0;
   width: 100%;
}
.controls {
   margin-top: 5px;
}
div.netbadge {
   padding-bottom: 25px;
   border-bottom: 4px solid var(--color-brand-blue);
   margin: 25px 0;
}
div.indent {
   margin-left: 35px;
}
</style>
