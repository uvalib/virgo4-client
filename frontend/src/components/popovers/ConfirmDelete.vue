<template>
   <v-popover  trigger="manual" :open="isOpen" @hide="hide" @show="opened">
      <V4Button mode="primary" v-if="label" :aria-pressed="isOpen" @click="toggle" @esc="hide">
         {{label}}
      </V4Button>
      <V4Button v-else mode="icon" :aria-pressed="isOpen" @click="toggle" @esc="hide">
         <i class="trash fas fa-trash-alt"></i>
      </V4Button>
      <div class="confirm-container" slot="popover">
         <div class="popover-header">
            <span>Confirm Delete</span>
         </div>
         <div class="message">
            <slot/>
            <p>Continue?</p>
         </div>
         <div class="confirm-controls">
            <V4Button mode="tertiary" id="cancelbtn" @click="hide">Cancel</V4Button>
            <V4Button mode="primary" @click="okClicked">OK</V4Button>
         </div>
      </div>
   </v-popover>
</template>

<script>
export default {
   props: {
      label: String,
   },
   data: function() {
      return {
         isOpen: false
      }
   },
   methods: {
      okClicked() {
         this.$emit('delete-approved')
         this.isOpen = false
      },
      hide() {
         this.isOpen = false
      },
      toggle() {
         this.isOpen = !this.isOpen
      },
      opened() {
         setTimeout(()=>{
            document.getElementById("cancelbtn").focus()
         },260);
      },
   }
}
</script>

<style scoped>
i.trash {
   color: var(--uvalib-grey-dark);
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px 8px 2px 0;
   margin-right: 5px;
}
div.popover-header {
   padding: 10px 15px;
   color: white;
   background-color: var(--uvalib-grey-dark);
   font-weight: 500;
   text-align: center;
   border-radius: 5px 5px 0 0;
}
.confirm-container {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
div.message {
   padding: 10px 10px 0 10px;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
}
.message p {
   margin: 0;
   padding: 5px 0;
   text-align: right;
}
.confirm-controls {
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
.confirm-controls .pure-button {
   margin-left: 5px;
}
</style>
