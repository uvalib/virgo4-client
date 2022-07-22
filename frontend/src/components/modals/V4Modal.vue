<template>
   <div class="v4-modal-wrapper"
      @keydown.stop.prevent.down
      @keydown.stop.prevent.up
      @keyup.stop.prevent.down
      @keyup.stop.prevent.up
      @keyup.stop.prevent.left
      @keyup.stop.prevent.right
   >
      <slot name="button"></slot>
      <transition name="fade">
         <div class="v4-modal-dimmer" v-if="isOpen">
            <div role="dialog" :aria-labelledby="`${props.id}-title`" :id="props.id" class="v4-modal" @keydown.esc="hide">
               <div :id="`${props.id}-title`" class="v4-modal-title">
                  <span>{{props.title}}</span>
                  <V4Button aria-label="close modal" mode="icon" @click="hide" :id="`${props.id}-close-icon`"
                     :focusBackOverride="true" @tabback="closeIconBackTabbed"
                     :focusNextOverride="true" @tabnext="closeIconTabbed"
                  >
                     <i class="close-icon fal fa-window-close"></i>
                  </V4Button>
               </div>
               <div class="v4-modal-content">
                  <slot name="content"></slot>
               </div>
               <div class="v4-modal-controls" v-if="props.controls">
                  <slot v-if="hasControlSlot()" name="controls"></slot>
                  <V4Button v-else mode="tertiary" :id="`${props.id}-close`" class="close" @click="hide"
                     :focusNextOverride="true" @tabnext="lastFocusTabbed" >
                        Close
                  </V4Button>
               </div>
            </div>
         </div>
      </transition>
   </div>
</template>

<script setup>
import { ref, useSlots } from 'vue'
const props = defineProps({
   id: {
      type: String,
      required: true
   },
   title: {
      type: String,
      required: true
   },
   firstFocusID: {
      type: String,
      default: ""
   },
   lastFocusID: {
      type: String,
      default: ""
   },
   buttonID: {
      type: String,
      required: true
   },
   controls: {
      type: Boolean,
      default: true
   }
})
const emit = defineEmits( ['opened', 'closed'] )

defineExpose({
   show, hide, lastFocusTabbed, firstFocusBackTabbed
})

const slots = useSlots()
const isOpen = ref(false)

function hide() {
   isOpen.value =false
   setFocus(props.buttonID)
   emit('closed')
}
function show() {
   isOpen.value =true
   setTimeout(()=>{
      let tgt = this.firstFocusID
      if (tgt == "") {
         tgt = props.id+"-close"
      }
      setFocus(tgt)
      emit('opened')
   }, 150)
}
function hasControlSlot() {
   return Object.prototype.hasOwnProperty.call(slots, 'controls')
}
function lastFocusTabbed() {
   let tgt = props.id+"-close-icon"
   setFocus(tgt)
}
function closeIconTabbed() {
   let tgt = props.firstFocusID
   if (tgt == "") {
      tgt = props.id+"-close-icon"
   }
   setFocus(tgt)
}
function closeIconBackTabbed() {
   let tgt = props.lastFocusID
   if (tgt == "") {
      tgt = props.id+"-close-icon"
   }
   setFocus(tgt)
}
function firstFocusBackTabbed() {
   let tgt = props.id+"-close-icon"
   setFocus(tgt)
}
function setFocus(id) {
   let ele = document.getElementById(id)
   if (ele ) {
      ele.focus()
   } else {
      let tgt = props.id+"-close"
      ele = document.getElementById(tgt)
      if (ele) {
         ele.focus()
      }
   }
}
</script>

<style lang="scss" scoped>
.v4-modal-dimmer {
   position: fixed;
   left: 0;
   top: 0;
   width: 100%;
   height: 100%;
   z-index: 1000;
   background: rgba(0, 0, 0, 0.2);
}
div.v4-modal {
   color: var(--uvalib-text);
   position: fixed;
   height: auto;
   z-index: 8000;
   background: white;
   top: 15%;
   left: 50%;
   transform: translate(-50%, -15%);
   box-shadow: $v4-box-shadow;
   border-radius: 5px;
   min-width: 300px;
   word-break: break-word;

   div.v4-modal-content {
      padding: 10px 10px 0 10px;
      text-align: left;
      font-weight: normal;
   }
   div.v4-modal-title {
      background:  var(--uvalib-blue-alt-light);
      font-size: 1.1em;
      color: var(--uvalib-text-dark);
      font-weight: 500;
      padding: 10px;
      border-radius: 5px 5px 0 0;
      border-bottom: 2px solid  var(--uvalib-blue-alt);
      text-align: left;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
   }
   div.v4-modal-controls {
      padding: 10px;
      font-size: 0.9em;
      margin: 0;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-end;
   }
}
@media only screen and (min-width: 768px) {
   div.v4-modal {
      max-width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.v4-modal {
      width: 95%;
   }
}
</style>
