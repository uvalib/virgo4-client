<template>
   <div class="accordion" :id="props.id">
      <h3 v-if="showHeader" :id="`${props.id}-header`"
         :style="{ background: props.background, color: props.color,
                   borderWidth: props.borderWidth, borderStyle: props.borderStyle,
                   borderColor: props.borderColor }"
         :class="`${expandedClass}`"
      >
         <button  @click="accordionClicked" @keydown.prevent.enter="accordionClicked" @keydown.space.prevent="accordionClicked"
            :class="`title accordion-trigger ${expandedClass}`"
            :aria-expanded="expandedStr"
            :aria-controls="contentID"
            :style="{color: props.color}"
         >
            <slot name="title"></slot>
            <i class="accordion-icon fal" :style="{ transform: rotation }" :class="{'fa-minus': isExpanded,'fa-plus': !isExpanded}"></i>
         </button>
         <button v-if="hasSettings" aria-label="folder settings" class="settings-btn"
            @click="emit('settingsClicked')" @keydown.prevent.enter="emit('settingsClicked')" @keydown.space.prevent="emit('settingsClicked')"
            :aria-expanded="settingsExpandedStr"
            :aria-controls="`${props.id}-settings`"
         >
            <i class="settings-icon fa-cog" :class="{fal: !props.showSettings, fas: props.showSettings}"></i>
         </button>
      </h3>
      <transition
         @before-enter="onBeforeEnter"
         @enter="onEnter"
         @after-enter="onAfterEnter"
         @before-leave="onBeforeLeave"
         @leave="onLeave"
         @after-leave="onAfterLeave"
      >
      <div class="accordion-settings" :id="`${props.id}-settings`" v-show="props.showSettings" role="region">
         <slot name="settings"></slot>
      </div>
      </transition>
      <transition
         @before-enter="onBeforeEnter"
         @enter="onEnter"
         @after-enter="onAfterEnter"
         @before-leave="onBeforeLeave"
         @leave="onLeave"
         @after-leave="onAfterLeave"
      >
         <div :id="contentID" class="accordion-content" v-show="isExpanded"
            :aria-labelledby="`${props.id}-header`" role="region"
            :style="{ background: props.backgroundContent }"
            @click.stop @keyup.stop.enter @keydown.space.stop
         >
            <slot></slot>
            <button v-if="hasFooterSlot" @click="accordionFooterClicked" class="footer"
               :style="{ background: props.background, color: props.color,
                         borderWidth: props.borderWidth, borderStyle: props.borderStyle,
                         borderColor: props.borderColor }" >
               <slot name="footer"></slot>
               <i class="accordion-icon fal" :style="{ transform: rotation }" :class="{'fa-minus': isExpanded,'fa-plus': !isExpanded}"></i>
            </button>
         </div>
      </transition>
   </div>
</template>

<script setup>
import { ref, computed, watch, useSlots, nextTick } from 'vue'
const emit = defineEmits( ['accordion-clicked', 'accordion-expanded', 'accordion-collapsed', 'settingsClicked'])
const props = defineProps({
   id: {
      type: String,
      reqired: true
   },
   closeOthers: {
      type: Number,
      default: null,
   },
   autoExpandID: {
      type: String,
      default: ""
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
      default: "#2B2B2B"
   },
   borderWidth: {
      type: String,
      default: "1px 1px 1px 1px"
   },
   borderColor: {
      type: String,
      default: "#DADADA"
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
   },
   hasSettings: {
      default: false,
      type: Boolean
   },
   showSettings: {
      default: false,
      type: Boolean
   }
})

watch(() => props.closeOthers, () => {
   if ( props.closeOthers.toString() != props.id)
   isExpanded.value = false
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
const animationDone = ref(true)

const expandedClass = computed(() => {
   if ( isExpanded.value) return "expanded"
   return ""
})
const expandedStr = computed(()=>{
   if ( isExpanded.value ) {
      return "true"
   }
   return "false"
})
const settingsExpandedStr = computed(()=>{
   if ( props.showSettings) {
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
   if (hasFooterSlot.value ) {
      if (!animationDone.value) return false
      return !isExpanded.value
   }
   return true
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
}
function onBeforeEnter(el) {
   el.style.height = '0'
   animationDone.value = false
}
function onEnter(el) {
    el.style.height =  `${el.scrollHeight}px`
}
function onAfterEnter(el) {
   el.style.height = null
   nextTick( ()=> {
      animationDone.value = true
      emit('accordion-expanded')
   })
}
function onBeforeLeave(el) {
   animationDone.value = false
   el.style.height = `${el.scrollHeight}px`
}
function onLeave(el) {
    el.style.height = '0'
}
function onAfterLeave(el) {
   el.style.height = '0'
   animationDone.value = true
   emit('accordion-collapsed')
}
</script>

<style lang="scss" scoped>
.accordion {
   margin:0;
   font-size: 1em;

   h3 {
      font-size: 1em;
      font-weight: normal;
      margin: 0;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;

      button {
         flex-grow: 1;
         padding: 0;
         background: transparent;
         border: none;
         outline: none;
         font-size: 1em;
      }
      .settings-btn {
         cursor: pointer;
         margin-right: 5px;
         .settings-icon {
            font-size: 1.25em;
         }
      }
   }

   .accordion-settings {
      padding: 0 10px 10px 10px;
      background: $uva-grey-200;
      border: 1px solid $uva-grey-100;
      text-align: right;
   }

   .title, .footer {
      cursor: pointer;
      margin: 0;
      padding: 5px;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: flex-start;
      position: relative;
      text-align: left;
      font-weight: normal;
      width: 100%;
      &:focus {
         outline: 2px dotted $uva-brand-blue-100;
         outline-offset: 3px;
      }
      .accordion-icon {
         font-size: 1.25em;
         transform: rotate(0deg);
         transition-duration: 250ms;
         margin: 0 5px 0 10px;
         display: inline-block;
         margin-left: auto;
      }
   }

   .title.narrow {
      justify-content: flex-start;
      padding: 0;
   }
   .accordion-content {
      overflow: hidden;
      transition: all 250ms ease-out;
      margin:0;
      padding:0;
      text-align: left;
      background: white;
   }
}
</style>
