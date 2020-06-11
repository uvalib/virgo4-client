<template>
   <V4Modal :id="id" title="Confirm Delete" ref="confirmdel" 
      :firstFocusID="`${id}-cancelbtn`" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button v-if="buttonLabel" mode="text" @click="$refs.confirmdel.show()" :id="`${id}-open`"
             :aria-label="ariaLabel"
         >
            {{buttonLabel}}
         </V4Button>
         <V4Button v-else mode="icon" @click="$refs.confirmdel.show()" :id="`${id}-open`"
             :aria-label="ariaLabel"
         >
            <i class="trash fas fa-trash-alt"></i>
         </V4Button>
      </template>
      <template v-slot:content>
         <slot/>
         <p>Continue?</p>
       </template>
       <template v-slot:controls>
         <V4Button mode="tertiary" :id="`${id}-cancelbtn`" @click="$refs.confirmdel.hide()"
            :focusBackOverride="true" @tabback="backTabCancel">
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
   props: {
      id: {
         type: String,
         required: true
      },
      buttonLabel: {
         type: String,
         default: "" 
      },
      ariaLabel: {
         type: String,
         default: ""    
      }
   },
   methods: {
      backTabCancel() {
         this.$refs.confirmdel.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.confirmdel.lastFocusTabbed()
      },
      okClicked() {
         this.$emit('delete-approved')
         this.$refs.confirmdel.hide()
      },
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
