<template>
   <div id="app">
      <FatalError v-if="fatal.length > 0" />
      <V4Spinner v-if="authorizing" message="Authorizing..." v-bind:overlay="true" />
      <transition name="fade">
         <div class="dimmer" v-if="showDimmer">
             <MessageBox v-if="error" type="error" />
             <MessageBox v-if="message" type="info" />
             <AddBookmarkModal v-if="addingBookmark" @closed="addBookmarkClosed" />
         </div>
      </transition>
      <VirgoHeader :id="headerID" />
      <MenuBar :id="menuID" v-bind:style="{transform: `translateY(${menuPos}px)`}"/>
      <main class="v4-content">
         <SessionExpired />
         <router-view />
         <div v-if="newVersion" class="update-pop">
            <div class="msg">A new version of Virgo is available.</div>
            <V4Button mode="primary" @click="updateClicked">Update Now</V4Button>
         </div>
         <ScrollToTop />
      </main>
      <LibraryFooter v-if="isKiosk == false"/>
   </div>
</template>

<script>
import ScrollToTop from "@/components/ScrollToTop"
import LibraryFooter from "@/components/layout/LibraryFooter"
import MessageBox from "@/components/layout/MessageBox"
import VirgoHeader from "@/components/layout/VirgoHeader"
import MenuBar from "@/components/layout/MenuBar"
import SessionExpired from "@/components/layout/SessionExpired"
import FatalError from "@/components/layout/FatalError"
import AddBookmarkModal from "@/components/AddBookmarkModal"
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   data: function() {
      return {
         menuHeight: 0,
         menuID: "v4-navbar",
         headerHeight: 0,
         headerID: "v4-header",
         menuPos: 0,
      };
   },
   components: {
      VirgoHeader,
      LibraryFooter,
      FatalError,
      AddBookmarkModal,
      MenuBar,
      ScrollToTop,
      MessageBox,
      SessionExpired
   },
   computed: {
      ...mapState({
         fatal: state => state.system.fatal,
         error: state => state.system.error,
         message: state => state.system.message,
         newVersion: state => state.system.newVersion,
         authorizing: state => state.user.authorizing,
         sessionExpired: state => state.system.sessionExpired,
      }),
      ...mapGetters({
         addingBookmark: "bookmarks/addingBookmark",
         hasTranslateMessage: "system/hasTranslateMessage",
         isKiosk: "system/isKiosk",
      }),
      showDimmer() {
         return this.addingBookmark || this.error != "" || this.message != "" || this.sessionExpired
      }
   },
   methods: {
      updateClicked() {
          window.location.reload(true)
      },
      scrollHandler( ) {
         if ( window.scrollY <= this.headerHeight ) {
            this.menuPos = 0
         } else {
            this.menuPos = (window.scrollY - this.headerHeight)
         }
      },
      addBookmarkClosed( srcID ) {
         let tgt = document.getElementById(srcID)
         if ( tgt ) {
            tgt.focus()
         }
      }
   },
   mounted() {
      setTimeout( ()=>{
         this.menuHeight = document.getElementById(this.menuID).offsetHeight
         this.headerHeight = document.getElementById(this.headerID).offsetHeight
      }, 1)
      window.addEventListener("scroll", this.scrollHandler)
      window.onresize = () => {
         this.$store.commit("system/setDisplayWidth",window.innerWidth)
      }
   },
   destroyed: function() {
      window.removeEventListener("scroll", this.scrollHandler)
   }
};
</script>

<style lang="scss">
/* Color variable definitions */
:root {
   /* OFFICIAL BRAND COLORS */
   --uvalib-brand-blue-lightest: #87b9d9;
   --uvalib-brand-blue-lighter: #3395d4;
   --uvalib-brand-blue-light: #0370b7;
   --uvalib-brand-blue: #232d4b;

   --uvalib-brand-orange-lightest: #ffead6;
   --uvalib-brand-orange: #e57200;
   --uvalib-brand-orange-dark: #b35900;

   --uvalib-blue-alt-light: #bfe7f7;
   --uvalib-blue-alt: #007bac;
   --uvalib-blue-alt-dark: #005679;
   --uvalib-blue-alt-darkest: #141E3C;

   --uvalib-teal-lightest: #c8f2f4;
   --uvalib-teal-light: #5bd7de;
   --uvalib-teal: #1da1a8;
   --uvalib-teal-dark: #16777c;

   --uvalib-green-lightest: #89cc74;
   --uvalib-green: #62bb46;
   --uvalib-green-dark: #4e9737;

   --uvalib-red-lightest: #fbcfda;
   --uvalib-red: #ef3f6b;
   --uvalib-red-emergency: #df1e43;

   --uvalib-yellow-light: #fef6c8;
   --uvalib-yellow: #ecc602;
   --uvalib-yellow-dark: #b99c02;

   --uvalib-beige: #f7efe1;
   --uvalib-beige-dark: #c0b298;

   --uvalib-grey-lightest: #f1f1f1;
   --uvalib-grey-light: #dadada;
   --uvalib-grey: #808080;
   --uvalib-grey-dark: #565656;
   --uvalib-grey-darkest: #2b2b2b;

   --uvalib-text-light: #FFFFFF;
   --uvalib-text: var(--uvalib-grey-dark);
   --uvalib-text-dark: var(--uvalib-grey-darkest);

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
   --color-link-darker: var(--uvalib-blue-alt-dark);
   --color-primary-text: var(--uvalib-grey-dark);
   --color-error: var(--uvalib-red-emergency);

   /*to be phased out*/
   --color-primary-blue: #0052cc;
   --color-pale-blue: #5d7eff;
   --color-secondary-blue: #002359;
   --color-dark-blue: #002f6c;
   /* --color-hover-highight: #f5f5f4; */
}

html,
body {
   margin: 0;
   padding: 0;
   background-color: var(--uvalib-blue-alt-darkest);
}

#app .screen-reader-text {
   clip: rect(1px, 1px, 1px, 1px);
   position: absolute !important;
   height: 1px;
   width: 1px;
   overflow: hidden;
}

#app .screen-reader-text:focus {
   background-color: #f1f1f1;
   border-radius: 3px;
   box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.6);
   clip: auto !important;
   color: #21759b;
   display: block;
   font-size: 14px;
   font-size: 0.875rem;
   font-weight: bold;
   height: auto;
   left: 5px;
   line-height: normal;
   padding: 15px 23px 14px;
   text-decoration: none;
   top: 5px;
   width: auto;
   z-index: 100000;
}

#v4-navbar {
   transition-duration: 0ms;
   position: fixed;
   left: 0;
   right: 0;
   z-index: 500;
   box-sizing: border-box;
}

#app .dimmer {
   position: fixed;
   left: 0;
   top: 0;
   width: 100%;
   height: 100%;
   z-index: 1000;
   background: rgba(0, 0, 0, 0.2);
}

#app {
   font-family: "franklin-gothic-urw", arial, sans-serif;
   -webkit-font-smoothing: antialiased;
   -moz-osx-font-smoothing: grayscale;
   text-align: center;
   color: var(--color-primary-text);
   margin: 0;
   padding: 0;
   background: white;
}

#app .pure-form input,
#app .pure-form select,
#app .pure-form textarea {
   box-shadow: none;
   margin-bottom: 0.3em;
}

#app h1 {
   color: var(--uvalib-brand-orange);
   margin: 8px 0;
   padding-bottom: 5px;
   font-weight: bold;
   position: relative;
}

#app a {
   color: var(--color-link);
   font-weight: 500;
   text-decoration: none;
}
#app a.alt-color-dark {
   color: var(--color-link-darker);
}
#app a:hover {
   text-decoration: underline;
}

/* for v-popover styles */
div.v-popover.inline {
   display: inline-block;
   cursor: pointer;
}
div.v-popover.block {
   display: block !important;
   cursor: pointer;
}
.tooltip {
   display: block !important;
   z-index: 10000;
}
.tooltip .tooltip-inner {
   border-radius: 10px;
   padding: 0 0 0 6px;
}
.tooltip.popover.vue-popover-theme {
   outline: none;
}
.tooltip .tooltip-arrow {
   width: 0;
   height: 0;
   border-style: solid;
   position: absolute;
   margin: 5px;
   border-color: var(--uvalib-grey-dark);
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
   bottom: -10px;
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

.tooltip[aria-hidden="true"] {
   visibility: hidden;
   opacity: 0;
   transition: opacity 0.15s, visibility 0.15s;
}

.tooltip[aria-hidden="false"] {
   visibility: visible;
   opacity: 1;
   transition: opacity 0.15s;
}
.update-pop {
   position: fixed;
   z-index: 5000;
   top: 10px;
   right: 10px;
   background: white;
   padding: 10px;
   border: 4px solid var(--uvalib-brand-orange);
   box-shadow: $v4-box-shadow;
   text-align: right;
   font-size: 0.85em;
}
.update-pop .msg {
   margin-bottom: 10px;
   font-weight: bold;
}
.update-pop span.pure-button.pure-button-primary {
   margin: 0;
   width:100%;
}
@media only screen and (min-width: 768px) {
   div.error-message {
      max-width: 40%;
   }
}
@media only screen and (max-width: 768px) {
   div.error-message {
      max-width: 95%;
   }
}
</style>
