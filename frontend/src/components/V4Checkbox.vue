<template>
   <div tabindex="0" role="checkbox" class="v4-checkbox"
      :class="{inline: props.label == '', disabled: props.disabled}"
      :aria-checked="isChecked"
      :aria-disabled="props.disabled"
      @click.stop="clicked" @keyup.stop.enter="clicked" @keydown.space.prevent.stop="clicked">
      <i class="box" :class="checkClass"></i>
      <label v-if="props.label">{{props.label}}</label>
   </div>
</template>

<script setup>
import { computed } from 'vue'

const emit = defineEmits( ['update:modelValue', 'click'] )
const props = defineProps({
   // If the component is passed a v-model, modelValue non-null
   // otherwise use the checked property
   modelValue: {
      type: Boolean,
      default: null
   },
   checked: {
      type: Boolean,
      default: false
   },
   disabled: {
      type: Boolean,
      default: false
   },
   label: {
      type: String,
      default: ""
   }
})

const checkClass = computed(() =>{
   if ( isChecked.value )  {
      return "fal fa-check-square"
   } else {
      return "fal fa-square"
   }
})
const isChecked = computed(() =>{
   if ( props.modelValue != null ) {
      return props.modelValue
   }
   return props.checked
})

function clicked() {
   if ( props.disabled) {
      return
   }

   if ( props.modelValue != null ) {
      let state = !props.modelValue
      emit('update:modelValue', state)
   }
   emit('click')
}
</script>

<style lang="scss" scoped>
div.v4-checkbox.inline {
   display: inline-block;
   i.box {
      margin-right:0 !important;
   }
}
div.v4-checkbox {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   cursor: pointer;
   outline:none;
   padding: 1px;

   label {
      font-weight: normal;
      font-size: 1em;
      cursor: pointer;
   }
   i.box {
      margin-right: 10px;
      color: var(--uvalib-text);
      font-size: 1.2em;
   }
   &:focus {
      @include be-accessible();
   }
   &:hover {
      text-decoration: underline;
   }
}
div.v4-checkbox.disabled {
   opacity: 0.6;
   cursor: default;
   label {
      cursor: default;
   }
}
</style>