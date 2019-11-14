<template>
   <div id="app" @click=closeUserMenu>
      <FatalError v-if="fatal.length > 0"/>
      <AuthorizePanel v-if="authorizing"/>
      <transition name="fade">
        <div class="dimmer" v-if="showDimmer"></div>
      </transition>
      <transition name="fade">
        <AddBookmarkModal v-if="addingBookmark"/>
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
import AddBookmarkModal from "@/components/AddBookmarkModal"
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   components: {
      VirgoHeader,
      LibraryFooter,
      FatalError,
      AuthorizePanel,
      AddBookmarkModal,
      MenuBar
   },
   computed: {
      ...mapState({
         fatal: state => state.system.fatal,
         authorizing: state => state.user.authorizing,
         addingBookmark: state => state.user.addingBookmark,
      }),
      ...mapGetters({
         addingBookmark: 'user/addingBookmark',
         hasTranslateMessage: 'system/hasTranslateMessage'
      }),
      showDimmer() {
        return this.addingBookmark
      }
   },
   methods: {
     closeUserMenu() {
       this.$store.commit("system/closeUserMenu")
     }
   }
};
</script>

<style>
/* Color variable definitions */
:root {
  /* OFFICIAL BRAND COLORS */
  --uvalib-brand-blue-lightest: #87B9D9;
  --uvalib-brand-blue-lighter: #3395D4;
  --uvalib-brand-blue-light: #0370B7;
  --uvalib-brand-blue: #232D4B;

  --uvalib-brand-orange-lightest: #FFEAD6;
  --uvalib-brand-orange: #E57200;
  --uvalib-brand-orange-dark: #B35900;

  --uvalib-blue-alt-light: #BFE7F7;
  --uvalib-blue-alt: #007BAC;
  --uvalib-blue-alt-dark: #005679;

  --uvalib-teal-lightest: #C8F2F4;
  --uvalib-teal-light: #5BD7DE;
  --uvalib-teal: #1DA1A8;
  --uvalib-teal-dark: #16777C;

  --uvalib-green-lightest: #89CC74;
  --uvalib-green: #62BB46;
  --uvalib-green-dark: #4E9737;

  --uvalib-red-light: #FBCFDA;
  --uvalib-red: #EF3F6B;
  --uvalib-red-emergency: #DF1E43;

  --uvalib-yellow-light: #FEF6C8;
  --uvalib-yellow: #ECC602;
  --uvalib-yellow-dark: #B99C02;

  --uvalib-beige: #F7EFE1;
  --uvalib-beige-dark: #C0B298;

  --uvalib-grey-lightest: #F1F1F1;
  --uvalib-grey-light: #DADADA;
  --uvalib-grey: #808080;
  --uvalib-grey-dark: #565656;
  --uvalib-grey-darkest: #2B2B2B;

  /* Color Remapping */
   --color-brand-blue: var(--uvalib-brand-blue);
   --color-light-blue: var(--uvalib-brand-blue-light);
   --color-lighter-blue: var(--uvalib-brand-blue-lighter);
   --color-lightest-blue: var(--uvalib-brand-blue-lightest);
   --color-brand-orange: var(--uvalib-brand-orange);
   --color-light-orange: var(--uvalib-brand-orange-lightest);
   --color-lighter-orange: var(--uvalib-brand-orange-lightest);
   --color-primary-orange: var(--uvalib-brand-orange);
   --color-dark-orange: var(--uvalib-brand-orange-dark);
   --color-link: var(--uvalib-brand-blue-light);
   --color-primary-text: var(--uvalib-grey-dark);
   --color-error: var(--uvalib-red-emergency);

    /*to be phased out*/
     --color-primary-blue: #0052cc;
     --color-pale-blue: #5d7eff;
     --color-secondary-blue: #002359;
     --color-dark-blue: #002f6c;
   /* --color-hover-highight: #f5f5f4; */

}

html, body {
   margin: 0;
   padding: 0;
   background-color: var(--color-dark-blue);
}

.pure-button.pure-button-primary {
  background-color: var(--color-primary-blue);
}

.pure-button.pure-button-secondary {
   background-color: var(--color-pale-blue);
   color: white;
   border-radius: 5px;
}

.pure-button.pure-button-primary,  .pure-button.pure-button-secondary{
  margin: 0 0 0 10px;
  border-radius: 5px;
}
.pure-button.disabled {
  cursor: default;
  opacity: 0.25;
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
div.v-popover.inline {
  display: inline-block;
  cursor: pointer;
}
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
  font-weight: 500;
  color:var(--color-link);
  cursor:pointer;
  display: inline-block
}
.text-button:hover {
  opacity:1;
  text-decoration: underline;
}
.error {
  font-weight: bold;
  margin: 0;
  color: var(--color-error);
  opacity: 1;
  visibility: visible;
  text-align: center;
}
</style>
