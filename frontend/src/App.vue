<template>
   <div id="app" @click="closeUserMenu">
      <FatalError v-if="fatal.length > 0" />
      <V4Spinner v-if="authorizing" message="Authorizing..." v-bind:overlay="true" />
      <transition name="fade">
         <div class="dimmer" v-if="showDimmer"></div>
      </transition>
      <transition name="fade">
         <AddBookmarkModal v-if="addingBookmark" />
      </transition>
      <VirgoHeader :id="headerID" />
      <MenuBar :id="menuID" v-bind:style="{transform: `translateY(-${scrollPos}px)`}"/>
      <main class="v4-content" v-bind:style="{'padding-top': menuHeight+'px'}">
         <div v-if="sessionExpired" class="session">
            <div class="session-message">
               <div class="bar">
                  <span>Notice</span>
                  <i @click="dismissSession" class="close fas fa-times-circle"></i>
               </div>
               <div class="message-body">
                  Your Virgo session has expired.<br/>Click 
                  <router-link to="/signin">here</router-link> 
                  to sign in again.
               </div>
            </div>
         </div>
         <router-view />
         <div v-if="newVersion" class="update-pop">
            <div class="msg">A new version of Virgo is available.</div>
            <span @click="updateClicked" class="pure-button pure-button-primary">Update Now</span>
         </div>
         <transition name="message-transition"
            enter-active-class="animated faster fadeIn"
            leave-active-class="animated faster fadeOut">
            <div v-if="error" class="error">
               <div class="error-message">
                  <div class="bar">
                     <span>Error</span>
                     <i @click="dismissError" class="close fas fa-times-circle"></i>
                  </div>
                  <div class="error-body">
                     {{error}}
                  </div>
               </div>
            </div>
         </transition>
      </main>
      <LibraryFooter v-if="isKiosk == false"/>
   </div>
</template>

<script>
import LibraryFooter from "@/components/layout/LibraryFooter"
import VirgoHeader from "@/components/layout/VirgoHeader"
import MenuBar from "@/components/layout/MenuBar"
import FatalError from "@/components/layout/FatalError"
import V4Spinner from "@/components/V4Spinner"
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
         scrollPos: 0,
      };
   },
   components: {
      VirgoHeader,
      LibraryFooter,
      FatalError,
      V4Spinner,
      AddBookmarkModal,
      MenuBar
   },
   computed: {
      ...mapState({
         fatal: state => state.system.fatal,
         error: state => state.system.error,
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
         return this.addingBookmark;
      }
   },
   methods: {
      dismissSession() {
         this.$store.commit("system/clearSessionExpired")
      },
      dismissError() {
         this.$store.commit("system/setError", "")
      },
      updateClicked() {
          window.location.reload(true)
      },
      closeUserMenu() {
         this.$store.commit("system/closeUserMenu")
      },
      scrollHandler( ) {
         if ( window.scrollY <= this.headerHeight ) {
            this.scrollPos = window.scrollY
         } else {
            this.scrollPos = this.headerHeight
         }
      }
   },
   mounted() {
      setTimeout( ()=>{
         this.menuHeight = document.getElementById(this.menuID).offsetHeight
         this.headerHeight = document.getElementById(this.headerID).offsetHeight
      }, 250)
      window.addEventListener("scroll", this.scrollHandler)
      window.onresize = () => {
         this.$store.commit("system/setDisplayWidth",window.innerWidth)
      };
   },
   destroyed: function() {
      window.removeEventListener("scroll", this.scrollHandler)
   }
};
</script>

<style>
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
   background-color: var(--color-dark-blue);
}

#v4-navbar {
   transition-duration: 0ms;
   position: fixed;
   left: 0;
   right: 0;
   z-index: 500;
   box-sizing: border-box;
}
.pure-button.pure-button-primary {
   background-color: var(--uvalib-brand-blue-light);
   border: 1px solid var(--uvalib-brand-blue-light);
}
.pure-button.pure-button-primary:hover {
   background-color: var(--uvalib-brand-blue-lighter);
   border: 1px solid var(--uvalib-brand-blue-lighter);
}
.pure-button.pure-button-secondary {
   background-color: var(--uvalib-brand-blue-lighter);
   color: black;
}
.pure-button.pure-button-secondary:hover {
   background-color: var(--uvalib-brand-blue-lightest);
}
.pure-button.pure-button-tertiary {
   background-color: var(--uvalib-grey-lightest);
   border: 1px solid var(--uvalib-grey);
   color: black;
}
.pure-button.pure-button-tertiary:hover {
   background-color: var(--uvalib-grey-light);
}
.pure-button.pure-button-primary,
.pure-button.pure-button-secondary,
.pure-button.pure-button-tertiary {
   margin: 0 0 0 10px;
   border-radius: 5px;
   font-weight: normal;
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
   background: rgba(0, 0, 0, 0.5);
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

.text-button {
   font-weight: 500;
   color: var(--color-link);
   cursor: pointer;
   display: inline-block;
}
.text-button:hover {
   opacity: 1;
   text-decoration: underline;
}
.update-pop {
   position: fixed;
   z-index: 5000;
   top: 10px;
   right: 10px;
   background: white;
   padding: 10px;
   border: 4px solid var(--uvalib-brand-orange);
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
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
div.session {
   position: fixed;
   left: 0; 
   right: 0;
   z-index: 5000;
   top: 30%;
}
div.session .bar {
   padding: 5px;
   background-color: var(--uvalib-brand-blue-light);
   color: white;
   font-weight: bold;
   text-align: left;
}
div.session i {
   float:right;
   font-size: 1.3em;
   cursor: pointer;
   margin-left: 10px;
}
div.session .message-body {
   padding: 10px 15px;
}
div.session-message {
   display: inline-block;
   text-align: center;
   background: white;
   padding: 0px;
   border: 2px solid var(--uvalib-brand-blue-light);
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
}

div.error {
   position: fixed;
   left: 0; 
   right: 0;
   z-index: 5000;
   top: 30%;
}
div.error .bar {
   padding: 5px;
   background-color: var(--uvalib-red-emergency);
   color: white;
   font-weight: bold;
   text-align: left;
}
div.error i.close {
   float:right;
   font-size: 1.3em;
   cursor: pointer;
   margin-left: 10px;
}
div.error .message-body {
   padding: 10px 15px;
}
.error-body {
   text-align: center;
   margin: 10px 15px;
   font-weight: normal;
   color: var(--uvalib-red-emergency);
   opacity: 1;
   visibility: visible;
   text-align: center;
}
div.error-message {
   display: inline-block;
   text-align: center;
   background: white;
   padding: 0px;
   border: 2px solid var(--uvalib-red-emergency);
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
}
</style>
