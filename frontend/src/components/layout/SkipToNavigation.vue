<template>
   <PanelMenu :tabindex="0" class="skip-to"  id="skip-to" ref="skiptomenu"  :model="v4SkipTo"  @keyup.prevent.stop.enter />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PanelMenu from 'primevue/panelmenu'
import { setFocusClass, setFocusID } from '@/utils'

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
   setFocusID("v4-main")
})

const skipToNav = (() => {
   setFocusClass("p-menubar-root-list")
   let  m = document.getElementsByClassName("p-menuitem")[0]
   m.classList.add("p-focus")
})

const skipToSearch = (() => {
   if ( route.query.mode == "advanced" ) {
      setFocusClass("v4-form-input")
   } else {
      setFocusID("search")
   }
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
