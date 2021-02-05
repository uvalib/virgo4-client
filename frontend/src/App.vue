<template>
   <div tabindex="-1" id="app" role="application">
      <V4Spinner v-if="authorizing" message="Authorizing..." v-bind:overlay="true" />
      <transition name="fade">
         <div class="dimmer" v-if="showDimmer">
             <MessageBox />
         </div>
      </transition>
      <div role="banner" class="site-header" id="v4-header">
         <SkipToNavigation />
         <div class="covid-alert" id="covid-alert">
            <span class="lead">COVID-19 Update: </span>
            <span>
               Check out the
               <a href="https://www.library.virginia.edu/status" target="_blank">Status Dashboard</a>
               for quick reference and
               <a href="https://www.library.virginia.edu/news/covid-19/" target="_blank">Library Resources FAQ</a>
               for details.
            </span>
         </div>
         <VirgoHeader />
         <MenuBar id="v4-menu"/>
      </div>
      <main tabindex="-1" class="v4-content" id="v4-main" role="main">
         <SessionExpired />
         <VueAnnouncer />
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
import SkipToNavigation from "@/components/layout/SkipToNavigation"
import SessionExpired from "@/components/layout/SessionExpired"
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   data: function() {
      return {
         headerHeight: 0,
         menuHeight: 0
      };
   },
   components: {
      VirgoHeader, LibraryFooter, MenuBar, ScrollToTop, MessageBox, SessionExpired, SkipToNavigation
   },
   computed: {
      ...mapState({
         newVersion: state => state.system.newVersion,
         authorizing: state => state.user.authorizing,
         sessionExpired: state => state.system.sessionExpired,
      }),
      ...mapGetters({
         hasTranslateMessage: "system/hasTranslateMessage",
         isKiosk: "system/isKiosk",
         hasMessage: "system/hasMessage",
      }),
      showDimmer() {
         return this.hasMessage|| this.sessionExpired
      }
   },
   methods: {
      updateClicked() {
          window.location.reload()
      },
      scrollHandler( ) {
         if ( window.scrollY <= this.headerHeight ) {
            document.getElementById("v4-menu").classList.remove("sticky")
            document.getElementById("v4-main").style.paddingTop = '0px'
         } else {
            document.getElementById("v4-menu").classList.add("sticky")
            document.getElementById("v4-main").style.paddingTop = `${this.menuHeight}px`
         }
      },
   },
   mounted() {
      this.$nextTick( ()=>{
         this.menuHeight = document.getElementById("v4-menu").offsetHeight
         this.headerHeight = document.getElementById("v4-header").offsetHeight
         this.headerHeight -= this.menuHeight
      })
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
.covid-alert {
   background-color: rgb(37, 202, 211);
   text-align: center;
   padding: 0.5em;
   font-size: 1.06rem;
   position: relative;
   color: rgb(43, 43, 43);
   font-family: franklin-gothic-urw, arial, sans-serif;
   span {
      font-size: 1em;
      font-weight: 400;
      a {
         color: rgb(20, 30, 60);
         text-decoration: underline !important;
      }
   }
   .lead {
      font-size: 1.15em;
      font-weight: bold;
        margin: 0px;
   }
}
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
   --uvalib-red-darker: #B30000;

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

// testing out colors for focus states
   --uvalib-accessibility-highlight: var(--uvalib-brand-blue-light);

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
   --color-link: var(--uvalib-blue-alt-dark);
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

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

html,
body {
   margin: 0;
   padding: 0;
   background-color: var(--uvalib-blue-alt-darkest);
}
.sticky {
   position: fixed !important;
   top: 0;
   width: 100%;
   z-index: 10000;
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
/* Regional Alert Boxes */
.ra-box {
   position: relative;
   padding: .75rem 1.25rem;
   margin-bottom: 1rem;
   border: 1px solid transparent;
   border-radius: .25rem;
   h2{
      &:first-of-type {
         margin-top: .5rem;
      }
   }
   h3{
      &:first-of-type {
         margin-top: .5em;
      }
      &:last-of-type {
         margin-top: 2em;
      }
   }
   &.ra-fiy {
      background-color: var(--uvalib-teal-lightest);
      border-color: var(--uvalib-teal-light);
      color: var(--uvalib-text-dark);
   }
   &.ra-notice {
      background-color: var(--uvalib-yellow);
      border-color: var(--uvalib-yellow-dark);
      color: #000;
   }
}

.no-wrap {
   white-space: nowrap;
}
//adding accessibility for keyboard focus
#app {
   #v4-main {
      outline: 0;
      &:focus {
         outline: 0;
      }
   }
   a:focus {
      @include be-accessible();
   }
   footer, div.header, nav {
      a:focus {
         @include be-accessible-light();
      }
   }
   input:focus, select:focus {
      @include be-accessible();
   }
   textarea:focus {
      @include be-accessible();
   }
}
</style>
