<template>
   <div :id="props.id" class="disclosure">
      <V4Button mode="text" :aria-expanded="showFull.toString()" :aria-controls="`${props.id}-full`"
         @click="toggle" @esc="hide" @blur="blurred">
         <i class="arrow fas fa-caret-right" :style="{ transform: rotation }"></i>
         <slot name="summary"></slot>
      </V4Button>
      <transition name="fade">
         <div aria-live="polite" v-show="showFull" :id="`${props.id}-full`" class="full-text"
            :class="{inline: props.mode!='overlay', left: props.align=='left'}"
            :style="{background: props.backgroundColor, 'border-color': props.borderColor}"
            @keyup.stop.esc="hide">
            <slot name="content"></slot>
         </div>
      </transition>
   </div>
</template>

<script setup>
import { computed, ref } from 'vue'
const props = defineProps({
   id: {
      type: String,
      required: true
   },
   align: {
      type: String,
      default: "default"
   },
   closeOnBlur: {
      type: Boolean,
      default: true
   },
   backgroundColor: {
      type: String,
      default: "var(--uvalib-blue-alt-light)"
   },
   borderColor: {
      type: String,
      default: "var(--uvalib-blue-alt)"
   },
   mode: {
      type: String,
      default: "overlay"
   }
})
const emit = defineEmits( ['click'] )

const showFull = ref(false)
const rotation = computed(() =>{
   if (showFull.value) {
      return "rotate(90deg)"
   }
   return "rotate(0deg)"
})

function blurred() {
   if (props.closeOnBlur) {
      hide()
   }
}
function hide() {
   showFull.value = false
}
function toggle() {
   showFull.value = !showFull.value
   emit("click")
}
</script>

<style lang="scss" scoped>
.disclosure {
   display: inline-block;
   text-align: left;
   .full-text {
      margin: 0px 10px 5px 15px;
      padding: 0;
      position: absolute;
      box-shadow: $v4-box-shadow;
      font-size:0.95em;
      color: var(--uvalib-text);
      font-weight: normal;
      z-index: 9999;
      min-width: 20%;
      max-width: 75%;
   }
   .full-text.left {
      left: 5px;
   }
   .full-text.inline {
      position: relative;
      box-shadow: none;
      margin: 6px 0 0 15px;
      width:100%;
      min-width: auto;
      max-width: inherit;
      padding: 10px 20px;
      border: 1px solid var(--uvalib-grey-light);
      box-sizing: border-box;
   }
   .arrow {
      padding-left: 2px;
      margin-right: 5px;
      width: 8px;
      transform: rotate(0deg);
      transition-duration: 100ms;
   }
}

</style>
