<template>
   <div :id="props.id" class="links-list">
      <div v-if="props.links.length <= 5 || props.expand == true" class="link-list" :class="{inline: props.inline}" >
         <div  v-for="(val,idx) in truncatedLinks" class="link-wrap" :key="`${props.id}-${idx}`">
            <span v-if="!props.inline" class="number">{{idx+1}}.</span>
            <router-link :to="val.url" class="link">{{val.label}}</router-link>
            <span v-if="props.inline && idx < truncatedLinks.length-1" class="sep">;</span>
         </div>
      </div>
      <div v-else tabindex="0"  class="truncated-content" :id="`${props.id}-cut`"
            @keydown.enter="expand" @keydown.space="expand" @keyup.stop.esc="hide"
      >
         <div :id="`${props.id}-list`" aria-live="polite" class="truncated-links" :class="{inline: props.inline}">
            <div v-for="(val,idx) in truncatedLinks" class="link-wrap"  :key="`${props.id}-${idx}`">
               <span v-if="!props.inline" class="number">{{idx+1}}.</span>
               <router-link :to="val.url" class="link" :id="`${props.id}-link-${idx+1}`">{{val.label}}</router-link>
               <span v-if="props.inline && idx < truncatedLinks.length-1" class="sep">;</span>
            </div>
         </div>
         <div class="controls">
            <a href="#" @click="toggle" class="toggle" :aria-expanded="showFull" aria-controls="`${props.id}-cut`">
               {{ expandText }}
            </a>
         </div>
      </div>
   </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { setFocusID } from '@/utils'

const props = defineProps({
   id: {
      type: String,
      required: true
   },
   links: {
      type: Array,
      required: true
   },
   label: {
      type: String,
      default: ""
   },
   inline: {
      type: Boolean,
      default: false
   },
   expand: {
      type: Boolean,
      default: false
   }
})

const showFull = ref(false)

const expandText = computed(() => {
   if ( showFull.value ) return "show less"
   if ( props.label == "") {
      return `...more (${props.links.length} items)`
   }
   return `...more ${props.label} (${props.links.length} items)`
})

const truncatedLinks = computed(()=>{
   if ( showFull.value || props.expand ) {
      return props.links
   }
   return props.links.slice(0,5)
})

const hide = (() => {
   showFull.value = false
   setFocusID(props.id+"-cut", true)
})
const expand = ((event) => {
   if (showFull.value == false ) {
      showFull.value = true
      setFocusID(`${props.id}-link-1`)
      event.preventDefault()
      event.stopPropagation()
   }
})

const toggle = ((event) => {
   event.preventDefault()
   event.stopPropagation()
   showFull.value = !showFull.value
   if ( showFull.value == false ) {
      setFocusID(props.id+"-cut", true)
   } else {
      setFocusID(`${props.id}-link-1`)
   }
})
</script>

<style lang="scss" scoped>
.links-list {
   .link-wrap {
      .number {
         margin-right: 5px;
         display: inline-block;
      }
   }
   .truncated-content {
      display: inline-block;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      cursor: default;
      background: transparent;
      border: none;
      margin: 0;
      padding: 0;
      text-align: left;
      width: 100%;
      box-sizing: border-box;
      border-radius: 0.3rem;
      .truncated-links.inline {
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-start;
         align-items: flex-start;
         gap: 5px;
      }
      &:focus {
         outline: 2px dotted $uva-brand-blue-100;
         outline-offset: 5px;
      }
   }
   .controls {
      padding: 5px 0 0 5px;
      .toggle {
         font-size: 1em;
      }
   }
}
.link-list.inline {
   display: flex;
   flex-flow: row wrap;
   justify-content: flex-start;
   align-items: flex-start;
   gap: 5px;
}
</style>

