<template>
   <div class="header" role="banner">
      <div class="library-link">
         <UvaLibraryLogo v-if="systemStore.isKiosk" />
         <a v-else target="_blank" href="https://library.virginia.edu">
            <UvaLibraryLogo />
         </a>
      </div>
      <div class="site-link">
         <router-link to="/" @mousedown="homeClicked">
          <svg id="VirgoLogo" role="img" aria-label="Virgo" data-name="VirgoLogo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 71 32">
            <defs></defs>
            <path class="cls-1" d="M11.31,24.61H9.18L.86.9H3.24l7.22,20.26L17.49.9h2.1Z"/><path class="cls-1" d="M24.72,3.39H22.3V.9h2.42Zm-.15,21.22h-2.1V7.09h2.1Z"/><path class="cls-1" d="M37.78,8.44a9.49,9.49,0,0,0-1.24-.11,4.37,4.37,0,0,0-3.77,2.1,9,9,0,0,0-1.35,4.62v9.56h-2.1V7.09H31.2v4.05c1.1-3.23,2.67-4.55,5.33-4.55a5.18,5.18,0,0,1,1.24.14V8.44Z"/><path class="cls-1" d="M53.47,6.31h-.53c-1.63,0-2.38.64-2.63,2.35a6.64,6.64,0,0,1,1.46,4.26,6,6,0,0,1-6.33,6.29A8,8,0,0,1,43,18.78c-1.21.28-1.78.85-1.78,1.81,0,1.24.75,1.71,2.63,1.74l4.94.07a8.35,8.35,0,0,1,3.55.68,3.78,3.78,0,0,1,2.13,3.41c0,3-3.27,4.91-8.64,4.91-5,0-7.82-1.67-7.82-4.59a3.43,3.43,0,0,1,2.74-3.45A2.71,2.71,0,0,1,39,20.69a2.89,2.89,0,0,1,2.27-3A6.29,6.29,0,0,1,39,12.8c0-3.66,2.67-6.22,6.54-6.22a6.21,6.21,0,0,1,3.55,1c.5-2.27,1.31-3,3.38-3a3.82,3.82,0,0,1,.89.07ZM42.7,24c-1.74.68-2.45,1.42-2.45,2.67,0,1.92,2,2.95,5.69,2.95,4.12,0,6.29-1.07,6.29-3.09,0-1.71-1.1-2.31-4.26-2.38l-4,0-.6-.07ZM41.28,12.88c0,2.77,1.6,4.58,4.12,4.58s4.12-1.88,4.12-4.55-1.63-4.58-4.16-4.58S41.28,10.14,41.28,12.88Z"/><path class="cls-1" d="M70,15.83c0,5.51-3.06,9.28-7.46,9.28-4.69,0-7.71-3.66-7.71-9.28s3.06-9.24,7.61-9.24S70,10.29,70,15.83Zm-12.94,0c0,4.66,2,7.54,5.26,7.54,3.45,0,5.44-2.81,5.44-7.54s-2-7.5-5.33-7.5S57.06,11.17,57.06,15.83Z"/>
          </svg>
         </router-link>
      </div>
   </div>
</template>

<script setup>
import UvaLibraryLogo from "@/components/UvaLibraryLogo.vue"
import { useSystemStore } from "@/stores/system"
import { useResultStore } from "@/stores/result"

const results = useResultStore()
const systemStore = useSystemStore()

function homeClicked() {
   results.resetSearch()
}

</script>

<style scoped lang="scss">
div.header {
   background-color: var(--uvalib-brand-blue);
   color: white;
   padding: 1vw 20px;
   text-align: left;
   position: relative;
   box-sizing: border-box;
   display: flex;
   flex-direction: row;
   flex-wrap: nowrap;
   justify-content: space-between;
   align-content: stretch;
   align-items: center;
}
#app div.header div.site-link a {
  color: white;
  text-decoration: none;
}

//Virgo Logo color
.cls-1{fill:#fff;}

div.library-link {
  height: 45px;
  width: 220px;
  order: 0;
  flex: 0 1 auto;
  align-self: flex-start;
}
div.site-link {
  height: 35px;
  width: 70px;
  order: 0;
  flex: 0 1 auto;
  align-self: center;
}

svg {
  display: inline-block;
  width: 100%;
  height: 100%;
}
</style>
