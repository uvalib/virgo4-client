<template>
   <div class="v4-select">
      <button ref="v4select" @click.stop="toggleExpand" class="v4-select" tabindex="0"
           @keyup.up.stop="handleKeypress"
           @keyup.down.stop="handleKeypress"
         :aria-pressed="expanded" aria-haspopup="listbox"
         :style="{ 'background-color': props.background, color: props.color }">
         <div class="wrap-select">
            <span class="selection">
               <span v-if="currVal && currVal.id" v-html="currVal.name"></span>
               <span v-else v-html="props.placeholder"></span>
               <i class="options-arrow fal fa-caret-down" :style="{ transform: rotation, color: props.color }"></i>
            </span>
         </div>
      </button>
      <transition name="grow"
         v-on:before-enter="beforeEnter" v-on:enter="enter"
         v-on:before-leave="beforeLeave" v-on:leave="leave">
         <ul tabindex="-1" ref="selectOptions" class="options" role="listbox" v-show="expanded"
            @keyup.stop='handleKeypress'>
            <li v-for="src in props.selections" @click="optionClicked(src)"
               :class="{disabled: src.disabled, selected: src.id==currVal.id, highlighted: highlightedID == src.id}"
               class="option" tabindex="-1"
               :id="src.id"
               :key="src.id">
               <span v-html="src.name"></span>
            </li>
         </ul>
      </transition>
   </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"
const props = defineProps({
   placeholder: {
      type: String,
      default: "Make a selection"
   },
   background: {
      type: String,
      default: "var(--uvalib-brand-blue-light)"
   },
   color: {
      type: String,
      default: "white"
   },
   selections: {
      type: Array,
      required: true
   },
   modelValue: {
      type: Object
   }
})
const emit = defineEmits(['update:modelValue', 'changed'])

const expanded = ref(false)
const highlightedIdx = ref(0)
const highlightedID = ref(0)
const currVal = ref(props.modelValue)
const v4select = ref(null)

watch( expanded, () => {
   if (expanded.value === false) {
      window.removeEventListener("click", globalClick)
   } else {
      window.addEventListener("click", globalClick)
   }
})

const rotation  = computed(() =>{
   if (expanded.value) {
      return "rotate(180deg)"
   }
   return "rotate(0deg)"
})

function handleKeypress(event) {
   //console.log("KEY "+event.keyCode)
   if (event.keyCode == 38 && highlightedIdx.value > 0) {
      // up arrow
      highlightedIdx.value--
      if ( expanded.value == false ) {
         toggleExpand()
      } else {
         setSelectedItem()
      }
   } else if (event.keyCode == 40 && highlightedIdx.value < props.selections.length-1) {
      // down arrow
      highlightedIdx.value++
      if ( expanded.value == false ) {
         expanded.value = true
      }
         setSelectedItem()

   } else if (event.keyCode == 13 ) {
      // enter toggles expand
      toggleExpand()
   } else if ( event.keyCode == 27 && expanded.value) {
      // esc closes
      expanded.value = false
      v4select.value.focus()
   } else if ( event.keyCode == 36  && expanded.value ) {
      // Home selects the first
      highlightedIdx.value = 0
      setSelectedItem()
   } else if ( event.keyCode == 35 && expanded.value ) {
      // end selects the last
      highlightedIdx.value = props.selections.length - 1
      setSelectedItem()
   }
}
function setSelectedItem() {
   highlightedID.value = props.selections[highlightedIdx.value].id
   let item = document.getElementById(highlightedID.value)
   item.focus()
   currVal.value =  props.selections[highlightedIdx.value]
   emit('update:modelValue', currVal.value)
   emit('changed', currVal.value.id)
}
function optionClicked(src) {
   if (src.disabled ) return
   currVal.value = src
   emit('update:modelValue', currVal.value)
   highlightedIdx.value = props.selections.findIndex( o => o.id == currVal.value.id)
   if (highlightedIdx.value > -1) {
      highlightedID.value = props.selections[highlightedIdx.value].id
      let item = document.getElementById(highlightedID.value)
      item.focus()
   }
   emit('changed', currVal.value.id)
   emit('update:modelValue', currVal.value)
}
function globalClick() {
   expanded.value = false
}
function toggleExpand() {
   expanded.value = !expanded.value
   setTimeout(() => {
      if (expanded.value) {
         if ( currVal.value ) {
            highlightedIdx.value = props.selections.findIndex( o => o.id == currVal.value.id)
            if (highlightedIdx.value > -1) {
               highlightedID.value = props.selections[highlightedIdx.value].id
               let item = document.getElementById(highlightedID.value)
               item.focus()
            }
         }
      } else {
         v4select.value.focus()
      }
   }, 260)
}
function beforeEnter(el) {
   el.style.height = '0'
}
function enter(el) {
   el.style.height = (el.scrollHeight) + 'px'
}
function beforeLeave(el) {
   el.style.height = (el.scrollHeight) + 'px'
}
function leave(el) {
   el.style.height = '0'
}
</script>

<style lang="scss" scoped>
div.v4-select {
   align-self: stretch;
   position: relative;
}
button.v4-select {
  display: inline-block;
  outline: none;
  border-radius: 5px;
  cursor: pointer;
  color: white;
  text-align: left;
  padding: 5px 10px;
  text-align: left;
  height:100%;
  width:100%;
   border: 1px solid var(--uvalib-grey-light);
}
button.v4-select:focus {
@include be-accessible();
   z-index: 10;
}
.wrap-select {
   height: 100%;
   align-items: center;
   justify-content: left;
   display: flex;
}
.v4-select .selection {
   display: inline-block;
   vertical-align: middle;
   white-space: nowrap;
   width: 100%;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
}
.v4-select .options-arrow {
  margin: 0 0 0 5px;
  cursor: pointer;
  color: white;
  transform: rotate(0deg);
  transition-duration: 250ms;
  display: inline-block;
  vertical-align: middle;
}
.v4-select .options {
  min-width: 100%;
  text-align: left;
  background-color: var(--uvalib-brand-blue);
  color: white;
  cursor: pointer;
  padding: 0;
  border-radius: 0 0 7px 7px;
  position: absolute;
  top: 48px;
  border: none;
  border-top: 1px solid var(--uvalib-brand-blue);
  overflow: hidden;
  transition: 200ms ease-out;
  z-index: 5000;
  white-space: nowrap;
  display: grid;
  grid-auto-rows: auto;
  margin:0;
  box-shadow: $v4-box-shadow-light;
}

.v4-select .options.left  {
   left: -1px;
}
.v4-select .options.right  {
   right: 0;
}
.v4-select .option {
  align-items: stretch;
  justify-items: stretch;
  padding: 10px 15px;
  background-color: white;
  color: var(--uvalib-text-dark);
  font-weight: normal;
}
.v4-select .option.disabled {
  background-color:  white;
  cursor: default;
  color: var(--uvalib-grey-light);
}
.v4-select .option.disabled:hover {
  background-color:  initial;
  cursor: default;
  color: var(--uvalib-grey-light);
}
.v4-select .option:hover {
  @include apply-hover();
}
.v4-select .option.highlighted  {
  background-color:  var(--uvalib-blue-alt-light);
  color: var(--uvalib-text-dark);
  outline: none;
}
.v4-select .option.selected {
   background: var(--color-brand-blue);
   color: white;
}
</style>
