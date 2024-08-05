<template>
   <div :id="props.id" class="links-list">
      <div v-if="props.links.length <= 5 || props.expand == true" class="link-list" :class="{inline: props.inline}" >
         <div  v-for="(val,idx) in truncatedLinks" class="link-wrap" :key="`${props.id}-${idx}`">
            <span v-if="!props.inline" class="number">{{idx+1}}.</span>
            <router-link :to="val.url" class="link">{{val.label}}</router-link>
            <span v-if="props.inline && idx < truncatedLinks.length-1" class="sep">;</span>
         </div>
      </div>
      <div v-else tabindex="0" :aria-expanded="showFull.toString()"
            class="truncated-content" :id="`${props.id}-cut`"
            @keydown.enter="expand"
            @keydown.space="expand" @keyup.stop.esc="hide"
      >
         <div :id="`${props.id}-list`" aria-live="polite" class="truncated-links" :class="{inline: props.inline}">
            <div v-for="(val,idx) in truncatedLinks" class="link-wrap"  :key="`${props.id}-${idx}`">
               <span v-if="!props.inline" class="number">{{idx+1}}.</span>
               <router-link :to="val.url" class="link" :id="`${props.id}-link-${idx+1}`">{{val.label}}</router-link>
               <span v-if="props.inline && idx < truncatedLinks.length-1" class="sep">;</span>
            </div>
         </div>
         <div class="controls">
            <VirgoButton v-if="!showFull" link @click="toggle" class="toggle">...More ({{props.links.length}} items)</VirgoButton>
            <VirgoButton v-else link @click="toggle" class="toggle" label="...Less"/>
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

const toggle = (() => {
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
      border-radius: 4px;
      .truncated-links.inline {
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-start;
         align-items: flex-start;
         gap: 5px;
      }
      &:focus {
         outline: 1px dashed var(--uvalib-accessibility-highlight);
         outline-offset: 2px;
      }
   }
   .controls {
      margin-top: 10px;
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      justify-content: flex-end;
      gap: 5px;
      .toggle {
         font-size: 0.9em;
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

