<template>
   <V4Modal :id="id" title="Change PIN" ref="changepin"  @opened="opened"
      firstFocusID="currpin" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.changepin.show()" :id="`${id}-open`">
            Change PIN
         </V4Button>
      </template>
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
      <template v-slot:controls>
         <V4Button v-if="pinChanged == false" mode="tertiary" :id="`${id}-cancelbtn`" @click="$refs.changepin.hide()">
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
         id: "change-pin",
         currPin: "",
         newPin: "",
         newPinConfirm: "",
         error: "",
         pinChanged: false
      }
   },
   methods: {
      opened() {
         this.currPin = ""
         this.newPin = ""
         this.newPinConfirm = ""
         this.error = ""
         this.pinChanged = false
      },
      backTabCP() {
         this.$refs.changepin.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.changepin.lastFocusTabbed()
      },
      okClicked() {
         if ( this.pinChanged) {
            this.$refs.changepin.hide()
         } else {
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
