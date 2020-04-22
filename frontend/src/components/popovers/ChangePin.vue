<template>
   <v-popover trigger="manual" :open="isOpen" class="inline" @hide="hide">
      <V4Button mode="primary" :aria-pressed="isOpen" @click="openPopover" @esc="hide">
         Change PIN
      </V4Button>
      <div class="pin-container" slot="popover">
         <div class="popover-header">
            <span>Change PIN</span>
         </div>
         <template v-if="pinChanged">
            <div class="message pure-form">
               <p>
                  Your PIN has been changed
               </p>
            </div>
            <div class="edit-controls">
               <V4Button mode="primary" @click="hide">OK</V4Button>
            </div>
         </template>
         <template v-else>
            <div class="message pure-form">
               <div>
                  <span class="label">Current PIN</span>
                  <input ref="currpin" type="password" v-model="currPin"/>
               </div>
               <div>
                  <span class="label">New PIN</span>
                  <input ref="newpin" type="password" v-model="newPin"/>
               </div>
               <div>
                  <span class="label">Confirm PIN</span>
                  <input ref="confirm" type="password" v-model="newPinConfirm"/>
               </div>
               <p class="error">{{error}}</p>
            </div>
            <div class="edit-controls">
               <V4Button mode="tertiary" @click="cancelClicked">Cancel</V4Button>
               <V4Button mode="primary" @click="okClicked">OK</V4Button>
            </div>
         </template>
      </div>
   </v-popover>
</template>

<script>
export default {
   data: function()  {
      return {
         currPin: "",
         newPin: "",
         newPinConfirm: "",
         error: "",
         isOpen: false,
         pinChanged: false
      }
   },
   computed: {
   },
   methods: {
      hide() {
         this.isOpen = false
      },
      cancelClicked() {
         this.isOpen = false
      },
      openPopover() {
         this.pinChanged = false
         this.isOpen = true
         this.error = ""
         this.currPin = ""
         this.newPin = ""
         this.newPinConfirm = ""
         setTimeout(()=>{
            this.$refs.currpin.focus()
         },200)
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

<style scoped>
span.pin.v4-button {
   margin: 0;
}
div.popover-header {
   padding: 10px 15px;
   color: white;
   background-color: var(--uvalib-grey-dark);
   font-weight: 500;
   text-align: center;
   border-radius: 5px 5px 0 0;
}
.pin-container {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
   min-width: 275px;
}
div.message {
   padding: 10px 10px 0 10px;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
}
input[type=password] {
   width: 100%;
}
span.label {
   display: block;
   margin: 10px 0 2px 0;
   font-weight: bold;
}
.edit-controls {
   padding: 10px;
   text-align: right;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
   border-bottom: 1px solid var(--uvalib-grey-dark);
   border-radius: 0 0 5px 5px;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-end;
}
p.error {
   padding: 10px;
   font-size: 0.8em;
   color: var(  --uvalib-red-emergency);
}
.edit-controls .pure-button {
   margin-left: 5px;
}
p {
   text-align: center;
}
</style>
