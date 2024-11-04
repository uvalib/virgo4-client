<template>
   <transition name="message-transition"
         enter-active-class="animated faster fadeIn"
         leave-active-class="animated faster fadeOut">
      <div v-if="showScrollTop && systemStore.hideScrollToTop == false" role="button"
         @click.stop="backToTop" tab-index="0" aria-label="scroll to top of page"
         class="scroll-to-top" :class="{mobile: smallScreen}"
      >
         <i class="fal fa-angle-up"></i>
      </div>
   </transition>
</template>

<script setup>
import { useSystemStore } from "@/stores/system"
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()
const systemStore = useSystemStore()
const showScrollTop = ref(false)

const smallScreen = computed( () => {
   return width.value <= 810
})

function backToTop() {
   var scrollStep = -window.scrollY / (500 / 10),
   scrollInterval = setInterval(()=> {
      if ( window.scrollY != 0 ) {
         window.scrollBy( 0, scrollStep )
      } else {
         clearInterval(scrollInterval)
      }
   },10)
}
function scrollChecker() {
   if (window.window.scrollY > 150) {
      showScrollTop.value = true
   } else {
      showScrollTop.value = false
   }
}

onMounted(() => {
   window.addEventListener("scroll", scrollChecker)
}),
onUnmounted(() => {
   window.removeEventListener("scroll", scrollChecker)
})
</script>

<style scoped lang="scss">
.scroll-to-top {
   display: flex;
   flex-basis: auto;
   flex-direction: column;
   position: fixed;
   background-color: white;
   color: $uva-brand-orange;
   font-size: 2.9em;
   font-weight: 100;
   border: 2px solid $uva-brand-orange;
   border-radius: 50%;
   cursor: pointer;
   align-items: center;
   bottom: 30px;
   right: 25px;
   box-shadow: rgba(0, 0, 0, 0.14) 0px 2px 2px 0px;
   box-sizing: border-box;
   justify-content: center;
   min-width: 0px;
   padding: 0px 0px 4px 0px;
   width: 56px;
   height: 56px;
   z-index: 9999;
   &:hover {
      color: white;
      background-color: $uva-brand-orange;
   }
}
.scroll-to-top.mobile {
   position: fixed;
   background-color: white;
   color: $uva-brand-orange;
   border: 3px solid $uva-brand-orange;
   font-size: 2em;
   font-weight: 100;
   padding: 0px 12px;
   right: 5px;
   bottom: 5px;
   cursor: pointer;
}
</style>
