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
         <div class="header-alert" v-if="headerAlerts.length > 0">
            <div v-for="ha in headerAlerts" :key="ha.uuid" class="alert-body">
               <span class="lead">{{ha.title}}:&nbsp;</span>
               <span class="alert-text" v-html="ha.body"></span>
            </div>
         </div>
         <VirgoHeader />
         <MenuBar id="v4-navbar"/>
      </div>
      <div class="alerts-list" v-if="!isKiosk" id="alerts">
         <div v-for="a in menuAlerts" :key="a.uuid" class="alert" :class="a.severity" :id="a.uuid">
            <i v-if="a.severity=='alert1'" class="alert-icon fas fa-exclamation-circle"></i>
            <i v-if="a.severity=='alert2'" class="alert-icon fas fa-exclamation-triangle"></i>
            <i v-if="a.severity=='alert3'" class="alert-icon fas fa-info-circle"></i>
            <div class="alert-body">
               <h3 class="lead">{{a.title}}</h3>
               <span class="alert-text" v-html="a.body"></span>
            </div>
            <V4Button mode="icon" v-if="a.severity=='alert2' || a.severity=='alert3'" class="dismiss-alert"
               @click="dismissAlert(a.uuid)" aria-label="dismiss alert">
               <i class="dismiss-icon far fa-window-close"></i>
            </V4Button>
         </div>
      </div>
      <main tabindex="-1" class="v4-content" id="v4-main" role="main">
         <SessionExpired />
         <VueAnnouncer />
         <h1>{{pageTitle}}</h1>
         <template v-if="configuring==false">
            <div v-if="pageAlerts($route.path).length > 0" class="regional-alerts">
               <div v-for="ra in pageAlerts($route.path)" :key="ra.uuid" class="regional-alert" :class="ra.severity" :id="ra.uuid">
                  <span class="alert-text" v-html="ra.body"></span>
               </div>
            </div>
            <router-view />
         </template>
         <div v-else  class="configure">
            <V4Spinner message="Configuring system..."/>
         </div>
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
         menuHeight: 0,
         configuring: true
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
         devServer: state => state.system.devServer,
         pageTitle: state => state.pageTitle
      }),
      ...mapGetters({
         hasTranslateMessage: "system/hasTranslateMessage",
         isKiosk: "system/isKiosk",
         hasMessage: "system/hasMessage",
         headerAlerts: "headerAlerts",
         alertCount: 'alertCount',
         menuAlerts: 'menuAlerts',
         pageAlerts: 'pageAlerts',
      }),
      showDimmer() {
         return this.hasMessage|| this.sessionExpired
      }
   },
   watch: {
      headerAlerts() {
         // when header alerts change, need to recalc height of header so menu bar sticks properly
         this.$nextTick( ()=>{
            this.headerHeight = document.getElementById("v4-header").offsetHeight
            this.headerHeight -= this.menuHeight
         })
      },
   },
   methods: {
      dismissAlert( uuid ) {
         let a = document.getElementById(uuid)
         a.classList.add("dismissed")
         setTimeout( () => {
            this.$store.commit("dismissAlert", uuid)
         }, 200);
      },
      updateClicked() {
          window.location.reload()
      },
      scrollHandler( ) {
         let alerts = document.getElementById("alerts")
         if ( window.scrollY <= this.headerHeight ) {
            document.getElementById("v4-navbar").classList.remove("sticky")
            if ( !alerts || this.isKiosk || this.headerAlerts.length == 0) {
               document.getElementById("v4-main").style.paddingTop = '0px'
            } else {
               alerts.style.paddingTop = '0px'
            }
         } else {
            document.getElementById("v4-navbar").classList.add("sticky")
            if ( !alerts || this.isKiosk || this.headerAlerts.length == 0 ) {
               document.getElementById("v4-main").style.paddingTop = `${this.menuHeight}px`
            } else {
              alerts.style.paddingTop = `${this.menuHeight}px`
            }
         }
      },
   },
   async beforeCreate() {
      // First time app is being created, request all common config
      // the flag shows a config spinner until ready
      await this.$store.dispatch('system/getConfig')
      await this.$store.dispatch('pools/getPools')
      this.$store.dispatch("filters/getPreSearchFilters")
      this.configuring = false
   },
   mounted() {
      this.$nextTick( ()=>{
         this.menuHeight = document.getElementById("v4-navbar").offsetHeight
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
.configure {
   margin-bottom: 150px;
}
.header-alert {
   background-color: rgb(37, 202, 211);
   text-align: center;
   padding: 0.5em;
   font-size: 1.06rem;
   position: relative;
   color: rgb(43, 43, 43);
   line-height: 1.1;
   font-family: franklin-gothic-urw, arial, sans-serif;
   .alert-body {
      display: inline-block;
      padding-left: 1.25rem;
      .alert-text {
         font-size: 1em;
         font-weight: 400;
         display: inline-block;
         color: rgb(0, 0, 0);
         line-height: 1.5;
         margin-left: 5px;
         font-style: normal;
         p {
            margin-bottom: 0px;
            margin-top: 0px;
         }
         a {
            color: rgb(20, 30, 60) !important;
            text-decoration: underline !important;
            font-weight: 400 !important;
         }
      }
      .lead {
         font-size: 1.15em;
         font-weight: bold;
         margin: 0px;
      }
   }
}
.alerts-list {
   text-align: left;
   color: rgb(35, 45, 75);
   font-family: franklin-gothic-urw, arial, sans-serif;
   box-shadow: $v4-box-shadow;

   .alert {
      padding: .5em;
      font-size: 1.06rem;
      line-height: 1.5;
      position: relative;
      color: var(--uvalib-text-dark);
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      transition-duration: 200ms;
      .alert-icon {
         font-weight: 900;
         font-size: 1.5em;
         padding-top: .25em;
      }
      button.v4-button.dismiss-alert.icon-button {
         height: fit-content;
         cursor: pointer;
         margin-left: auto;
      }
      .dismiss-icon {
         font-size: 1.5em;
         cursor: pointer;
      }
      .alert-body {
         padding-left: 1.25rem;
      }
      .lead {
         font-size: 1.33rem;
         line-height: 1.1;
         margin-top: 0;
         margin-bottom: .5rem;
      }
      .alert-text {
         display: inline-block;
         p {
            margin: 0;
         }
      }
   }
   .alert.dismissed {
      opacity: 0;
   }
   .alert.alert1 {
      background-color: var(--uvalib-red-lightest);
      border-left: 8px solid var(--uvalib-red-dark);
   }
   .alert.alert2 {
      background-color: var(--uvalib-yellow-light);
      border-left: 8px solid var(--uvalib-yellow);
   }
   .alert.alert3 {
      background-color: var(--uvalib-blue-alt-light);
      border-left: 8px solid var(--uvalib-blue-alt);
   }
}
.regional-alerts {
   width: 90%;
   margin: 0 auto 30px auto;
   .regional-alert {
      color: var( --uvalib-grey-darkest);
      background-color: var(  --uvalib-teal-lightest);
      border: 0.2em solid var(--uvalib-teal);
      border-radius: 0.5em;
      padding: 0.75rem 1rem;
      text-align: left;
      .alert-text {
         padding-left: 1.25rem;
         display: inline-block;
         p {
            margin: 0;
         }
      }
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

   --uvalib-teal-lightest: #C8F2F4;
   --uvalib-teal-light: #5BD7DE;
   --uvalib-teal: #25CAD3;
   --uvalib-teal-dark: #1DA1A8;
   --uvalib-teal-darker: #16777C;

   --uvalib-green-lightest: #89cc74;
   --uvalib-green: #62bb46;
   --uvalib-green-dark: #4e9737;

   --uvalib-red-lightest: #FBCFDA;
   --uvalib-red: #ef3f6b;
   --uvalib-red-emergency: #df1e43;
   --uvalib-red-darker: #B30000;
   --uvalib-red-dark: #DF1E43;

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

   --uvalib-accessibility-highlight: var(--uvalib-brand-blue-light);

   --color-primary-orange: var(--uvalib-brand-orange);
   --color-link: var(--uvalib-blue-alt-dark);
   --color-link-darker: var(--uvalib-blue-alt-dark);
   --color-primary-text: var(--uvalib-grey-dark);
   --color-error: var(--uvalib-red-emergency);
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
   margin: 25px 0;
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
