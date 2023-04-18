<template>
   <div :id="props.id" class="links-list">
      <div v-if="props.links.length <= 5 || props.expand == true" class="link-list">
         <div  v-for="(val,idx) in truncatedLinks" class="link-wrap" :class="{inline: props.inline}"  :key="`${props.id}-${idx}`">
            <span v-if="!props.inline" class="number">{{idx+1}}.</span>
            <router-link :to="val.url" class="link">{{val.label}}</router-link>
            <span v-if="props.inline && idx < truncatedLinks.length-1" class="sep">;</span>
         </div>
      </div>
      <div v-else tabindex="0" :aria-expanded="showFull.toString()"
            class="truncated-content" :id="`${props.id}-cut`"
            @keydown.prevent.stop.enter="toggle"
            @keydown.space.prevent.stop="toggle" @keyup.stop.esc="hide"
      >
         <div :id="`${props.id}-list`" aria-live="polite">
            <div v-for="(val,idx) in truncatedLinks" class="link-wrap" :class="{inline: props.inline}" :key="`${props.id}-${idx}`">
               <span v-if="!props.inline" class="number">{{idx+1}}.</span>
               <router-link :to="val.url" class="link" :id="`${props.id}-link-${idx+1}`">{{val.label}}</router-link>
               <span v-if="props.inline && idx < truncatedLinks.length-1" class="sep">;</span>
            </div>
            <div class="controls">
               <span tabindex="0" role="button" v-if="!showFull" class="more" @click.prevent.stop="toggle">...More ({{props.links.length}} items)</span>
               <span tabindex="0" role="button" v-else class="less" @click.prevent.stop="toggle">...Less</span>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import { computed, ref, nextTick } from "vue"
import * as utils from '@/utils'

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
   nextTick( () => {
      let tgt = document.getElementById(props.id+"-cut")
      tgt.focus()
      utils.scrollToItem(tgt)
   })
})

const toggle = (() => {
   showFull.value = !showFull.value
   if ( showFull.value == false ) {
         nextTick( () => {
         let tgt = document.getElementById(props.id+"-cut")
         tgt.focus()
         utils.scrollToItem(tgt)
      })
   } else {
      let firstLink = document.getElementById(`${props.id}-link-1`)
      firstLink.focus()
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
      .sep {
         margin: 0 6px 0 2px;
         font-weight: bold;
      }
   }
   .link-wrap.inline {
      display: inline-block;
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
      &:focus {
         @include be-accessible();
      }
   }
   .controls {
      text-align: right;
      margin-top: 10px;
      .more, .less {
         color: var(--color-link);
         cursor: pointer;
         margin-left: 0px;
         font-weight: 500;
         margin-left: 5px;
         font-size: 0.9em;
         &:focus {
            @include be-accessible();
         }
         &:hover {
            text-decoration: underline;
         }
      }
   }
}
</style>

