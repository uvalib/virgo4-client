<template>
   <div class="accordion" :id="props.id"
      @click="accordionClicked" @keyup.stop.enter="accordionClicked" @keydown.space.prevent="accordionClicked">
      <div v-if="showHeader" :id="`${props.id}-header`"
         tabindex="0"
         :class="props.layout" class="title" role="button"
         :style="{ background: props.background, color: props.color,
                   borderWidth: props.borderWidth, borderStyle: props.borderStyle,
                   borderColor: props.borderColor }"
         :aria-expanded="expandedStr" :aria-controls="contentID">
         <slot name="title"></slot>
         <i class="accordion-icon fal" :style="{ transform: rotation }" :class="{'fa-minus': isExpanded,'fa-plus': !isExpanded}"></i>
      </div>
      <transition name="accordion"
            v-on:before-enter="beforeEnter" v-on:enter="enter"
            v-on:before-leave="beforeLeave" v-on:leave="leave">
         <div :id="contentID" class="accordion-content" v-show="isExpanded"
            :aria-labelledby="`${props.id}-header`" role="region"
            :style="{ background: props.backgroundContent, color: props.color }"
            @click.stop @keyup.stop.enter @keydown.space.stop>
            <slot></slot>
            <div v-if="hasFooterSlot" @click="accordionFooterClicked" class="footer"
               :style="{ background: props.background, color: props.color,
                         borderWidth: props.borderWidth, borderStyle: props.borderStyle,
                         borderColor: props.borderColor }" >
               <slot name="footer"></slot>
               <i class="accordion-icon fal" :style="{ transform: rotation }" :class="{'fa-minus': isExpanded,'fa-plus': !isExpanded}"></i>
            </div>
         </div>
      </transition>
   </div>
</template>

<script setup>
import { ref, computed, watch, useSlots } from 'vue'
const emit = defineEmits( ['accordion-clicked', 'accordion-expanded', 'accordion-collapsed'])
const props = defineProps({
   id: {
      type: String,
      reqired: true
   },
   layoutChange: {
      default: null,
   },
   closeOthers: {
      type: Number,
      default: null,
   },
   autoExpandID: {
      type: String,
      default: ""
   },
   layout: {
      type: String,
      default: "normal"
   },
   background: {
      type: String,
      default: "#fff"
   },
   backgroundContent: {
      type: String,
      default: "#fff"
   },
   color: {
      type: String,
      default: "var(--uvalib-text-dark)"
   },
   borderWidth: {
      type: String,
      default: "1px 1px 1px 1px"
   },
   borderColor: {
      type: String,
      default: "var(--uvalib-grey-light)"
   },
   borderStyle: {
      type: String,
      default: "solid"
   },
   expanded: {
      default: false,
      type: Boolean
   },
   invert: {
      default: false,
      type: Boolean
   }
})

watch(() => props.closeOthers, () => {
   if ( props.closeOthers > -1) {
      if ( props.closeOthers.toString() != props.id)
      isExpanded.value = false
   }
})
watch(() => props.layoutChange, () => {
   if (isExpanded.value && props.id) {
      setTimeout( ()=> {
         let content = document.getElementById(props.id)
         if ( content) {
            content.setAttribute("style", "height: inherit;")
         }
      })
   }
})
watch(() => props.autoExpandID, (newVal) => {
   if (isExpanded.value === false && props.id && newVal != "") {
      if (props.id == newVal) {
         isExpanded.value = true
      }
   }
})

const slots = useSlots()
const isExpanded = ref(props.expanded)

const expandedStr = computed(()=>{
   if ( isExpanded.value ) {
      return "true"
   }
   return "false"
})
const rotation = computed(()=>{
   if ( props.invert) {
      if (isExpanded.value) {
         return "rotate(0deg)"
      }
      return "rotate(180deg)"
   }
   if (isExpanded.value) {
      return "rotate(180deg)"
   }
   return "rotate(0deg)"
})
const showHeader = computed(()=>{
   return !isExpanded.value ||  isExpanded.value && !hasFooterSlot.value
})
const contentID = computed(()=>{
   return `accordion-conttent-${props.id}`
})
const hasFooterSlot = computed(()=>{
   return Object.prototype.hasOwnProperty.call(slots, 'footer')
})

function accordionClicked() {
   emit('accordion-clicked')
   isExpanded.value = !isExpanded.value
}
function accordionFooterClicked() {
   accordionClicked()
   setTimeout( ()=> {
      let hdr = document.getElementById(`${props.id}-header`)
      if (hdr) {
         hdr.focus()
      }
   }, 250)
}
function beforeEnter(el) {
   document.getElementById(contentID.value).style.overflow = "hidden"
   el.style.height = '0'
}
function enter(el) {
   el.style.height = `${el.scrollHeight}px`
   setTimeout( ()=> {
      emit('accordion-expanded')
         document.getElementById(contentID.value).style.overflow = "visible"
   }, 250)
}
function beforeLeave(el) {
   el.style.height = `${el.scrollHeight}px`
}
function leave(el) {
   document.getElementById(contentID.value).style.overflow = "hidden"
   el.style.height = '0'
   setTimeout( ()=> {
      emit('accordion-collapsed')
   }, 250)
}
</script>

<style lang="scss" scoped>
.accordion {
   margin:0;
   font-size: 1em;

   .header-wrap {
      display: flex;
      flex-flow: row nowrap;
      align-content: center;
      justify-content: space-between;
      align-items: stretch;
      height: 100%;
   }

   .title, .footer {
      cursor: pointer;
      margin: 0;
      padding: 5px 10px;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: space-between;
      position: relative;
      flex-grow: 1;
      text-align: left;

      .accordion-icon {
         margin-left: auto;
         font-size: 1.25em;
         transform: rotate(0deg);
         transition-duration: 250ms;
      }
   }

   .footer {
      padding: 3px 12px 3px 5px;
      font-weight: normal;
   }

   .title.narrow {
      justify-content: flex-start;
      padding: 0;
   }

   .accordion-content {
      overflow: hidden;
      transition: 250ms ease-out;
      margin:0;
      padding:0;
      text-align: left;
   }
}
.title {
   &:focus {
      @include be-accessible();
   }
}
</style>
