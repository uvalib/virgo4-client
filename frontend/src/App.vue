<template>
   <div id="app">
      <FatalError v-if="fatal.length > 0"/>
      <VirgoHeader/>
      <router-view/>
      <LibraryFooter/>
   </div>
</template>

<script>
import LibraryFooter from "@/components/LibraryFooter"
import VirgoHeader from "@/components/VirgoHeader"
import FatalError from "@/components/FatalError"
import { mapState } from "vuex"
export default {
   components: {
      VirgoHeader,
      LibraryFooter,
      FatalError
   },
   computed: {
      ...mapState({
         fatal: state => state.fatal,
      }),
   }
};
</script>

<style>
/* Color variable definitions */
:root {
   --color-primary-orange: #e57200;
   --color-link: #2979ff;
   --color-primary-blue: #0078e7;
   --color-primary-text: #555;
   --color-dark-blue: rgb(0, 47, 108);
   --color-hover-highight: #f5f5ff;
   --color-error: firebrick;
}

#app .pure-button.pure-button-secondary {
   background: rgb(66, 184, 221); 
   color: white;
   border-radius: 5px;
   opacity: 0.8;
}
#app .pure-button.pure-button-secondary:hover {
  opacity: 1;
}

html, body {
   margin: 0;
   padding: 0;
   background: var(--color-dark-blue);
}

#app {
   font-family: "Avenir", Helvetica, Arial, sans-serif;
   -webkit-font-smoothing: antialiased;
   -moz-osx-font-smoothing: grayscale;
   text-align: center;
   color: var(--color-primary-text);
   margin:0;
   padding:0;
   background: white;
}

#app a {
   color: var(--color-link);
   font-weight: 500;
   text-decoration: none;
}
#app a:hover {
   text-decoration: underline;
}

/* for v-popover styles */
.tooltip {
  display: block !important;
  z-index: 10000;
}
.tooltip .tooltip-inner {
  border-radius: 10px;
  padding: 0px 0px 4px;
}
.tooltip.popover.vue-popover-theme  {
   outline: none;
}
.tooltip .tooltip-arrow {
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 5px;
  border-color: var(--color-primary-orange);
  z-index: 1;
}
.tooltip[x-placement^="top"] {
  margin-bottom: 10px;
}
.tooltip[x-placement^="top"] .tooltip-arrow {
  border-width: 10px 10px 0 10px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  bottom: -6px;
  left: calc(50% - 10px);
  margin-top: 0;
  margin-bottom: 0;
}
.tooltip[x-placement^="bottom"] {
  margin-top: 10px;
}
.tooltip[x-placement^="bottom"] .tooltip-arrow {
  border-width: 0 10px 10px 10px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-top-color: transparent !important;
  top: -10px;
  left: calc(50% - 10px);
  margin-top: 0;
  margin-bottom: 0;
}
.tooltip[x-placement^="right"] {
  margin-left: 10px;
}

.tooltip[x-placement^="right"] .tooltip-arrow {
  border-width: 10px 10px 10px 0;
  border-left-color: transparent !important;
  border-top-color: transparent !important;
  border-bottom-color: transparent !important;
  left: -10px;
  top: calc(50% - 10px);
  margin-left: 0;
  margin-right: 0;
}
.tooltip[x-placement^="left"] {
  margin-right: 10px;
}

.tooltip[x-placement^="left"] .tooltip-arrow {
  border-width: 10px 0 10px 10px;
  border-top-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  right: -10px;
  top: calc(50% - 10px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip[aria-hidden='true'] {
  visibility: hidden;
  opacity: 0;
  transition: opacity .15s, visibility .15s;
}

.tooltip[aria-hidden='false'] {
  visibility: visible;
  opacity: 1;
  transition: opacity .15s;
}
</style>
