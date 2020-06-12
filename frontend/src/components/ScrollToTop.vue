<template>
   <transition name="message-transition"
         enter-active-class="animated faster fadeIn"
         leave-active-class="animated faster fadeOut">
      <div v-if="showScrollTop" role="button" 
         @click.stop="backToTop" 
         class="scroll-to-top" :class="{mobile: smallScreen}"
      >
         <i class="fas fa-angle-up"></i>
      </div>
   </transition>
</template>

<script>
import { mapState } from "vuex"
export default {
   data: function() {
      return {
         showScrollTop: false,
      }
   },
   computed: {
      ...mapState({
         displayWidth: state => state.system.displayWidth,
      }),
      smallScreen() {
         return this.displayWidth <= 810
      },
   },
   methods: {
      backToTop: function() {
         var scrollStep = -window.scrollY / (500 / 10),
         scrollInterval = setInterval(()=> {
            if ( window.scrollY != 0 ) {
               window.scrollBy( 0, scrollStep )
            } else {
               clearInterval(scrollInterval)
            }
         },10)
      },
      scrollChecker() {
         if (window.window.scrollY > 150) {
            this.showScrollTop = true
         } else {
            this.showScrollTop = false
         }
      }
   },
   created: function() {
      window.addEventListener("scroll", this.scrollChecker)
   },
   destroyed: function() {
      window.removeEventListener("scroll", this.scrollChecker)
   }
}
</script>

<style scoped>
.scroll-to-top {
   display: flex;
   flex-basis: auto;
   flex-direction: column;
   position: fixed;
   background-color: white;
   color: var(--uvalib-brand-orange);
   font-size: 2.5em;
   font-weight: 100;
   border: 3px solid var(--uvalib-brand-orange);
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
}
.scroll-to-top.mobile {
   position: fixed;
   background-color: white;
   color: var(--color-brand-orange);
   border: 3px solid var(--color-brand-orange);
   font-size: 2em;
   font-weight: 100;
   padding: 0px 12px;
   right: 5px;
   bottom: 45px;
   cursor: pointer;
}
.scroll-to-top:hover, .scroll-to-top.mobile:hover {
  color: white;
  background-color: var(--uvalib-brand-orange);
}
</style>
