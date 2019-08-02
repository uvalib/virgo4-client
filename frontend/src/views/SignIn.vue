<template>
   <div class="signin">
      <h4>Non-UVA User Sign In</h4>
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
               <input v-model="pin" type="password">
               <p class="hint">Last four digits of your ID, unless you've updated it</p>
            </td>
        </tr>
      </table>
      <div class="controls">
         <span @click="cancelClicked" class="pure-button pure-button-primary">Cancel</span>
         <span @click="signinClicked" class="pure-button pure-button-primary">Sign In</span>
      </div>
   </div>
</template>

<script>
export default {
   name: "signin", 
   data: function()  {
      return {
         user: '',
         pin: ''
      }
   },
   methods: {
      cancelClicked() {
         this.$router.push("/")
      },
      signinClicked() {
         this.$store.dispatch("auth/signin", {barcode: this.user, password: this.pin})
      }
   }
}
</script>

<style scoped>
.signin {
   min-height: 400px;
   position: relative;
   margin: 4vw auto;
   width:40%;
   color: #444;
   min-width: 350px;
   font-size: 1.1em;
}
td.label {
  font-weight: 500;
  text-align: right;
  padding: 8px 5px 0 5px;
  width:1%;
  white-space:nowrap;
  vertical-align: text-top;
}
td.value {
   padding: 2px 5px;
   width: 100%;
}
#app .signin .pure-form input {
   width:100%;
   box-sizing: border-box;
   padding: 6px;
}
p.hint {
   font-size: 0.8em;
   margin: 2px 0;
   color: #666;
   text-align: left;
}
.controls {
   margin-top: 25px;
}
</style>

