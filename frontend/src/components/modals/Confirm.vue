<template>
   <V4Modal :id="props.id" :title="props.title" ref="confirmdlg"
      :firstFocusID="`${props.id}-cancelbtn`" :lastFocusID="`${props.id}-okbtn`"
      :buttonID="`${props.id}-open`"
   >
      <template v-slot:button>
         <V4Button v-if="props.buttonLabel" :mode="props.buttonMode" @click="confirmdlg.show()" :id="`${props.id}-open`"
             :aria-label="props.ariaLabel"
         >
            {{props.buttonLabel}}
         </V4Button>
         <V4Button v-else mode="icon" @click="confirmdlg.show()" :id="`${props.id}-open`"
             :aria-label="props.ariaLabel"
         >
            <i class="trash fal fa-trash-alt"></i>
         </V4Button>
      </template>
      <template v-slot:content>
         <slot/>
         <p>Continue?</p>
       </template>
       <template v-slot:controls>
         <V4Button mode="tertiary" :id="`${props.id}-cancelbtn`" class="cancelbtn" @click="confirmdlg.hide()"
            :focusBackOverride="true" @tabback="backTabCancel">
            Cancel
         </V4Button>
         <V4Button mode="primary" :id="`${props.id}-okbtn`" @click="okClicked"
            :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits( ['confirmed'] )
const props = defineProps({
   title: {
      type: String,
      required: true
   },
   id: {
      type: String,
      required: true
   },
   buttonLabel: {
      type: String,
      default: ""
   },
   buttonMode: {
      type: String,
      default: "text"
   },
   ariaLabel: {
      type: String,
      default: ""
   }
})

const confirmdlg = ref(null)

function backTabCancel() {
   confirmdlg.value.firstFocusBackTabbed()
}
function nextTabOK() {
   confirmdlg.value.lastFocusTabbed()
}
function okClicked() {
   emit('confirmed')
   setTimeout( () => {
      if ( confirmdlg.value ) {
         confirmdlg.value.hide()
      }
   }, 300)
}
</script>

<style lang="scss" scoped>
.cancelbtn {
   margin-right: 5px;
}
i.trash {
   color: black;
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px;
}
</style>
