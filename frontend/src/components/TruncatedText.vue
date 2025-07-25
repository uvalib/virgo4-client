<template>
   <div :id="props.id" class="truncated-text">
      <div v-if='isTruncated==false'>
         <div v-html="props.text"></div>
      </div>
      <template v-else>
         <div tabindex="0" class="truncated-content" :id="`truncated-${props.id}`"
            @keydown.prevent.stop.enter="toggle" @keydown.space.prevent.stop="toggle" @keyup.stop.esc="hide"
         >
            <div  v-if="!showFull" :id="`${props.id}-cut`" class="truncated"  aria-live="polite" >
               <span class="text" v-html="truncatedText"></span>
            </div>
            <div v-else class="full" :id="`${props.id}-full`" aria-live="polite" >
               <span class="text" v-html="props.text"></span>
            </div>
            <a href="#" @click="toggle" class="trigger" :aria-expanded="showFull.toString()" aria-controls="`truncated-${props.id}`">
               {{linkLabel}}
            </a>
         </div>
      </template>
   </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { setFocusID } from '@/utils'

const props = defineProps({
   text: {
      type: String,
      required: true,
   },
   limit: {
      type: Number,
      default: 80
   },
   label: {
      type: String,
      default: "",
   },
   id: {
      type: String,
      required: true
   }
})

const showFull = ref(false)

const linkLabel = computed( () => {
   if ( showFull.value) return "show less"
   if ( props.label == "") {
      return "...more"
   }
   return `...more ${props.label}`
})

const isTruncated = computed(()=>{
   return props.text != truncatedText.value
})

const truncatedText = computed(()=>{
   if (props.text.length <= props.limit) return props.text
   var trunc = props.text.substring(0, props.limit-1)
   var out = trunc.substring(0, trunc.lastIndexOf(' ')).trim()
   return out
})

const hide =(() => {
   showFull.value = false
   nextTick( ()=>{
   setFocusID(`${props.id}-cut`, true)
   })
})

const toggle = (( event ) => {
   event.preventDefault()
   event.stopPropagation()
   showFull.value = !showFull.value
   let tgtID = `${props.id}-full`
   if ( showFull.value == false) {
      tgtID = `${props.id}-cut`
   }
   nextTick( ()=>{
   setFocusID(tgtID, true)
   })
   setFocusID(tgtID)
})
</script>

<style lang="scss" scoped>
.truncated-text {
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   text-align: left;
   position: relative;
   box-sizing: border-box;

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
      &:focus {
         outline: 2px dotted $uva-brand-blue-100;
         outline-offset: 5px;
      }
   }

   .trigger {
      font-size: 1em;
   }

}

</style>
