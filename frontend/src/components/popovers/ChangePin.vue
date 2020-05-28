<template>
   <V4Popover class="pin inline" id="pinpop" ref="pop" title="Change PIN" alabel="Change PIN"
      firstFocusID="currpin" lastFocusID="okpin" triggerType="primary" @opened="popoverOpened">
      <template v-slot:trigger>Change PIN</template>
      <template v-slot:content>
         <template v-if="pinChanged">
            <p>
               Your PIN has been changed
            </p>
         </template>
         <template v-else>
            <div class="message pure-form">
               <div>
                  <label for="currpin">Current PIN</label>
                  <input ref="currpin" id="currpin" type="password" v-model="currPin" @keydown.shift.tab.stop.prevent="backTabCP"
                     aria-required="true" required="required"/>
               </div>
               <div>
                  <label for="newpin">New PIN</label>
                  <input id="newpin" ref="newpin" type="password" v-model="newPin"
                     aria-required="true" required="required"/>
               </div>
               <div>
                  <label for="confirm">Confirm PIN</label>
                  <input id="confirm" ref="confirm" type="password" v-model="newPinConfirm"
                     aria-required="true" required="required"/>
               </div>
               <p v-if="error" class="error">{{error}}</p>
            </div>
         </template>
      </template>
      <template v-if="pinChanged == false" v-slot:controls>
         <V4Button mode="tertiary" id="cancelpin" @click="cancelClicked">Cancel</V4Button>
         <V4Button mode="primary" id="okpin" @click="okClicked" :focusNextOverride="true" @tabnext="nextTabOK">OK</V4Button>
      </template>
   </V4Popover>
</template>

<script>
export default {
   data: function()  {
      return {
         currPin: "",
         newPin: "",
         newPinConfirm: "",
         error: "",
         pinChanged: false
      }
   },
   computed: {
   },
   methods: {
      popoverOpened() {
         this.currPin = ""
         this.newPin = ""
         this.newPinConfirm = ""
         this.error = ""
         this.pinChanged = false
      },
      backTabCP() {
         this.$refs.pop.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.pop.lastFocusTabbed()
      },
      cancelClicked() {
         this.$refs.pop.hide()
      },
      okClicked() {
         this.error = ""
         if ( this.currPin == "" || this.newPin == "" || this.newPinConfirm == "")  {
            this.$refs.currpin.focus()
            this.error = "All three fields are required"
            return
         } 
         if ( this.newPin != this.newPinConfirm)  {
            this.$refs.newpin.focus()
            this.error = "New PIN confirmation mismatch"
            return
         } 
         if ( this.newPin.length != 4) {
            this.$refs.newpin.focus()
            this.error = "New PIN must be 4 digits"
            return   
         }
         let data  = {current_pin: this.currPin, new_pin: this.newPin}
         this.$store.dispatch("user/changePIN", data).then(() => {
            this.pinChanged = true
         }).catch(() => {
            this.$refs.currpin.focus()
            this.error = "PIN change failed"
         })
      }
   }
};
</script>

<style lang="scss" scoped>
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
