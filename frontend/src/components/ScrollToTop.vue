<template>
   <transition name="message-transition"
         enter-active-class="animated faster fadeIn"
         leave-active-class="animated faster fadeOut">
      <button v-if="smallScreen == false && showScrollTop && systemStore.hideScrollToTop == false"
         @click.stop="backToTop" class="scroll-to-top"
      >
         Top
      </button>
   </transition>
</template>

<script setup>
import { useSystemStore } from "@/stores/system"
import { ref, computed, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useWindowScroll } from '@vueuse/core'

const { width } = useWindowSize()
const { y } = useWindowScroll()
const systemStore = useSystemStore()
const showScrollTop = ref(false)

watch(y, (newY) => {
   if ( newY > 300 ) {
      showScrollTop.value = true
   } else {
      showScrollTop.value = false
   }
})

const smallScreen = computed( () => {
   return width.value <= 810
})

const backToTop = (()=> {
   window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<style scoped lang="scss">
.scroll-to-top {
   position: fixed;
   bottom: 20px;
   right: 30px;
   z-index: 99;
   border: 2px solid #fff;
   background-color: $uva-brand-blue;
   color: #fff;
   cursor: pointer;
   padding: 1.25rem 1rem;
   border-radius: 50%;
   font-size: 18px;
   font-weight: 400;
   &:hover {
      color: white;
      background-color: $uva-grey-A;
   }
   &:focus {
      outline: 2px dotted $uva-brand-orange;
      outline-offset: 3px;
   }
}
</style>
