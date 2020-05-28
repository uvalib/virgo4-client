<template>
   <V4Popover class="confirm" id="confirmpop" ref="pop" title="Confirm Delete" :alabel="alabel"
      firstFocusID="confirm-cancelbtn" lastFocusID="confirm-okbtn">
      <template v-slot:trigger>
         <span  v-if="label">{{label}}</span>
         <i v-else class="trash fas fa-trash-alt"></i>
      </template>
      <template v-slot:content>
         <slot/>
         <p>Continue?</p>
       </template>
       <template v-slot:controls>
         <V4Button mode="tertiary" id="confirm-cancelbtn" @click="cancelClicked"
            :focusBackOverride="true" @tabback="backTabCancel">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="confirm-okbtn" @click="okClicked"
            :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Popover>
</template>

<script>
export default {
   props: {
      label: String,
      alabel: String,
   },
   methods: {
      backTabCancel() {
         this.$refs.pop.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.pop.lastFocusTabbed()
      },
      okClicked() {
         this.$emit('delete-approved')
         this.$refs.pop.hide()
      },
      cancelClicked() {
         this.$refs.pop.hide()
      }
   }
}
</script>

<style lang="scss" scoped>
i.trash {
   color: var(--uvalib-grey-dark);
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px;
}
</style>
