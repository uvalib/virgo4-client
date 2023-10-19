<template>
   <PanelMenu :tabindex="0" class="skip-to"  id="skip-to" ref="skiptomenu"  :model="v4SkipTo"  @keyup.prevent.stop.enter />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PanelMenu from 'primevue/panelmenu'

const route = useRoute()

const v4SkipTo = computed(() => {
   return [
      {  label: "Skip To",
         items: [
            { label: 'Navigation', command: () => { skipToNav() } },
            { label: 'Main Content', command: () => { skipToMain() } },
            { label: 'Search', visible: route.path == "/search" ||  route.path == "/", command: () => { skipToSearch() } },
         ]
      }
   ]
})

const skipToMain = (() => {
   setTimeout( () => {
      let m = document.getElementById("v4-main")
      m.focus( {preventScroll:true} )
   }, 150)
})

const skipToNav = (() => {
   setTimeout( () => {
      let m = document.getElementsByClassName("p-menubar-root-list")[0]
      m.focus( {preventScroll:true} )
      m = document.getElementsByClassName("p-menuitem")[0]
      m.classList.add("p-focus")
   }, 150)
})

const skipToSearch = (() => {
   setTimeout( () => {
      let s = document.getElementById("search")
      s.focus( {preventScroll:true} )
      if ( s) {
         s.focus( {preventScroll:true} )
      } else {
         s = document.getElementsByClassName("field")[0]
         if ( s ) {
            s.focus( {preventScroll:true} )
         }
      }
   }, 150)
})
</script>

<style scoped lang="scss">
.skip-to {
   background: white;
   color: var(--uvalib-text);
   padding: 0;
   position: absolute;
   transform: translateY(-150%);
   border-radius: 5px;
   z-index: 9000;
   transition: transform 100ms;
   box-shadow: $v4-box-shadow-light;
   width: 130px;
   font-size: 0.9em;
   &:active, &:focus, &:hover, &:focus-within {
      transform: translateY(0%);
   }
}
</style>
