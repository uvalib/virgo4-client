<template>
   <div id="app">
      <FatalError v-if="fatal.length > 0"/>
      <AuthorizePanel v-if="authorizing"/>
      <transition name="fade">
        <div class="dimmer" v-if="showDimmer"></div>
      </transition>
      <transition name="fade">
        <AddBookmarkModal v-if="addingBookmark"/>
      </transition>
      <transition name="more-transition"
            enter-active-class="animated faster slideInRight"
            leave-active-class="animated faster slideOutRight">
        <MoreResultsModal v-if="resultsSelected"/>
      </transition>
      <VirgoHeader/>
      <MenuBar/>
      <router-view/>
      <LibraryFooter/>
   </div>
</template>

<script>
import LibraryFooter from "@/components/layout/LibraryFooter"
import VirgoHeader from "@/components/layout/VirgoHeader"
import MenuBar from "@/components/layout/MenuBar"
import FatalError from "@/components/layout/FatalError"
import AuthorizePanel from "@/components/layout/AuthorizePanel"
import MoreResultsModal from "@/components/MoreResultsModal"
import AddBookmarkModal from "@/components/AddBookmarkModal"
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   components: {
      VirgoHeader,
      LibraryFooter,
      FatalError,
      AuthorizePanel,
      MoreResultsModal,
      AddBookmarkModal,
      MenuBar
   },
   computed: {
      ...mapState({
         fatal: state => state.fatal,
         selectedResultsIdx: state => state.selectedResultsIdx,
         authorizing: state => state.user.authorizing,
         addingBookmark: state => state.user.addingBookmark
      }),
      ...mapGetters({
         addingBookmark: 'user/addingBookmark',
      }),
      resultsSelected() {
        return this.selectedResultsIdx > -1
      },
      showDimmer() {
        return (this.selectedResultsIdx > -1 || this.addingBookmark)
      }
   },
   methods: {
   }
};
</script>

<style>
/* Color variable definitions */
:root {
   --color-primary-orange: #E57200;
   --color-link: #007ae7;
   --color-primary-blue: #007ae7;
   --color-pale-blue: #459CED;
   --color-secondary-blue: #002359;
   --color-primary-text: #555;
   --color-dark-blue: rgb(0, 47, 108);
   --color-hover-highight: #f5f5f4;
   --color-error: firebrick;
}

#app .fade-enter-active, .fade-leave-active {
  transition: opacity .25s;
}
#app .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

#app .pure-button.pure-button-secondary {
   background: var(--color-pale-blue);
   color: white;
   border-radius: 5px;
   opacity: 0.9;
}
#app .pure-button.pure-button-secondary:hover {
  opacity: 1;
}

#app .dimmer {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background:rgba(0,0,0,0.5);
}

html, body {
   margin: 0;
   padding: 0;
   background-color: var(--color-dark-blue);
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

#app .pure-form input, #app .pure-form select, #app .pure-form textarea {
   box-shadow: none;
   margin-bottom: .3em;
}

#app span.pure-button {
  margin: 0 0 0 10px;
  border-radius: 5px;
}

#app h1 {
  color: var(--color-primary-orange);
  margin: 8px 0;
  padding-bottom: 5px;
  font-weight: bold;
  font-size: 22px;
  position: relative;
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

.text-button {
  font-weight: bold;
  color:var(--color-link);
  cursor:pointer;
  display: inline-block
}
.text-button:hover {
  opacity:1;
  text-decoration: underline;
}
</style>
