<template>
   <V4Spinner v-if="userStore.authorizing" message="Authorizing..." v-bind:overlay="true" />
   <MessageBox />
   <SessionExpired />
   <AddBookmark />
   <Toast position="top-center" />
   <ConfirmDialog position="top" :closable="false">
      <template #message="slotProps">
         <i :class="slotProps.message.icon" style="font-size: 2rem; display: inline-block; margin-right: 20px;"></i>
         <div v-html="slotProps.message.message"></div>
      </template>
   </ConfirmDialog>
   <div role="banner" class="site-header" id="v4-header">
      <SkipToNavigation />
      <div class="header-alert" v-if="alertStore.headerAlerts.length > 0">
         <div v-for="ha in alertStore.headerAlerts" :key="ha.uuid" class="alert-body">
            <span class="lead">{{ha.title}}:&nbsp;</span>
            <span class="alert-text" v-html="ha.body"></span>
         </div>
      </div>
      <VirgoHeader />
      <MenuBar id="v4-navbar"/>
   </div>
   <div class="alerts-list" v-if="!systemStore.isKiosk" id="alerts">
      <div v-for="a in alertStore.menuAlerts" :key="a.uuid" class="alert" :class="a.severity" :id="a.uuid">
         <div class="message">
            <i v-if="a.severity=='alert1'" class="alert-icon fas fa-exclamation-circle"></i>
            <i v-if="a.severity=='alert2'" class="alert-icon fas fa-exclamation-triangle"></i>
            <i v-if="a.severity=='alert3'" class="alert-icon fas fa-info-circle"></i>
            <div class="alert-body">
               <h3 class="lead">{{a.title}}</h3>
               <span class="alert-text" v-html="a.body"></span>
            </div>
         </div>
         <VirgoButton v-if="a.severity=='alert2' || a.severity=='alert3'" severity="secondary" text rounded outlined
            @click="dismissAlert(a.uuid)" aria-label="hide alert" icon="fal fa-times" size="large"/>
      </div>
   </div>
   <main id="v4main" role="main">
      <VueAnnouncer />
      <h1 v-if="route.name != 'details'" id="mainheader">{{systemStore.pageTitle}}</h1>
      <template v-if="configuring==false">
         <div v-if="alertStore.pageAlerts(route.path).length > 0" class="regional-alerts">
            <div v-for="ra in alertStore.pageAlerts(route.path)" :key="ra.uuid" class="regional-alert" :class="ra.severity" :id="ra.uuid">
               <span class="alert-text" v-html="ra.body"></span>
            </div>
         </div>
         <router-view />
      </template>
      <div v-else  class="configure">
         <V4Spinner message="Configuring system..."/>
      </div>
      <div v-if="systemStore.newVersion" class="update-pop">
         <div class="msg">A new version of Virgo is available.</div>
         <VirgoButton @click="updateClicked" class="update">Update Now</VirgoButton>
      </div>
      <ScrollToTop />
   </main>
   <LibraryFooter v-if="systemStore.isKiosk == false"/>
</template>

<script setup>
import ScrollToTop from "@/components/ScrollToTop.vue"
import LibraryFooter from "@/components/layout/LibraryFooter.vue"
import MessageBox from "@/components/layout/MessageBox.vue"
import VirgoHeader from "@/components/layout/VirgoHeader.vue"
import MenuBar from "@/components/layout/MenuBar.vue"
import SkipToNavigation from "@/components/layout/SkipToNavigation.vue"
import SessionExpired from "@/components/layout/SessionExpired.vue"
import ConfirmDialog from 'primevue/confirmdialog'
import AddBookmark from "@/components/modals/AddBookmark.vue"
import Toast from 'primevue/toast'
import { useAlertStore } from "@/stores/alert"
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { usePoolStore } from "@/stores/pool"
import { useFilterStore } from "@/stores/filter"
import { useCollectionStore } from "@/stores/collection"
import { ref, onUpdated, onBeforeMount } from 'vue'
import axios from 'axios'
import analytics from '@/analytics'
import { useRoute } from 'vue-router'
import { usePinnable } from '@/composables/pin'

usePinnable("v4-navbar", "alerts", "v4main", "v4footer")

const route = useRoute()
const alertStore = useAlertStore()
const userStore = useUserStore()
const systemStore = useSystemStore()
const poolStore = usePoolStore()
const filterStore = useFilterStore()
const collectionStore = useCollectionStore()
const configuring = ref(true)

function dismissAlert( uuid ) {
   let a = document.getElementById(uuid)
   a.classList.add("dismissed")
   alertStore.dismissAlert(uuid)
}

function updateClicked() {
   window.location.reload()
}

async function initVirgo() {
   // anon and signed in users will always have a localstore with JWT in it. be sure
   // to restore it first, as everything that follows depends upon it
   let jwtStr = localStorage.getItem('v4_jwt')
   if ( jwtStr  ) {
     userStore.setUserJWT(jwtStr)
   }

   // First time app is being created, request all common config
   // the flag shows a config spinner until ready
   await systemStore.getConfig()
   await poolStore.getPools()
   await collectionStore.getCollections()

   // Make sure the session is is kept alive
   await userStore.refreshAuth()

   if ( userStore.isSignedIn ) {
      await userStore.getAccountInfo()

      // defer configuring until after acccount request is done. details pages require full account
      // and bookmark info to be loaded before they can be displayed
      configuring.value = false
      if ( userStore.noILSAccount == false ) {
         userStore.getBillDetails()
         userStore.getCheckouts()
      }
      if ( userStore.isUndergraduate ) {
         analytics.trigger('User', 'NETBADGE_SIGNIN', "undergraduate")
      } else if ( userStore.isGraduate) {
         analytics.trigger('User', 'NETBADGE_SIGNIN', "graduate")
      } else {
         analytics.trigger('User', 'NETBADGE_SIGNIN', "other")
      }
   } else {
      configuring.value = false
   }

   filterStore.getPreSearchFilters()
}

function initVersionChecker() {
   systemStore.getVersion()
   var currBuild = "unknown"
   setInterval(() => {
      axios.get("/version").then((response) => {
         if ( currBuild == "unknown" ) {
            currBuild = response.data.build
         }
         else if (currBuild != response.data.build) {
            systemStore.newVersion = true
         }
      }).catch((error) => {
         // no need to show a big error box; just try again later. If there is
         // really a connectivity problem, other calls will fail and provide more information
         console.error("Version check failed "+ JSON.stringify(error))
      })
   }, 1000*60*5)
}

function initZotero() {
   // add unapi URL to document header for Zotero, if not already present
   let unapiID = 'unapi'
   let citeURL = systemStore.citationsURL
   if (!document.getElementById(unapiID) && citeURL != "") {
      let unapiURL = citeURL + '/unapi'
      var link = document.createElement('link')
      link.id = unapiID
      link.rel = 'unapi-server'
      link.type = 'application/xml'
      link.title = 'unAPI'
      link.href = unapiURL
      document.head.appendChild(link)
   }
}

onBeforeMount(() => {
   initVersionChecker()
   initVirgo()
})

onUpdated(() => {
   initZotero()
})
</script>

<style lang="scss">
.configure {
   padding: 5% 0 150px 0;
   min-height: 500px;
   font-size: 1.15em;
}
.header-alert {
   background-color: $uva-teal;
   text-align: center;
   padding: 0.5em;
   font-size: 1rem;
   position: relative;
   color: $uva-text-color-dark;
   line-height: 1.1;
   font-family: franklin-gothic-urw, arial, sans-serif;
   .alert-body {
      display: inline-block;
      padding-left: 1.25rem;
      .alert-text {
         font-size: 1em;
         font-weight: 400;
         display: inline-block;
         color: $uva-text-color-dark;
         line-height: 1.5;
         margin-left: 5px;
         font-style: normal;
         p {
            margin-bottom: 0px;
            margin-top: 0px;
         }
         a {
            color: $uva-blue-alt-A;
            text-decoration: underline;
            &:hover {
               color: $uva-blue-alt;
            }
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
   color: $uva-text-color-dark;
   font-family: franklin-gothic-urw, arial, sans-serif;
   position: relative;

   .alert {
      padding: .5em;
      font-size: 1rem;
      line-height: 1.5;
      position: relative;
      color: $uva-text-color-dark;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      transition-duration: 200ms;
      .message {
         display: flex;
         flex-flow: row nowrap;
         justify-content: flex-start;
         align-items: flex-start;
         gap: 10px;
      }
      .alert-icon {
         font-weight: 900;
         font-size: 1.5em;
         padding-top: .25em;
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
      background-color: $uva-red-100;
      border-left: 8px solid $uva-red-A;
   }
   .alert.alert2 {
      background-color: $uva-yellow-100;
      border-left: 8px solid $uva-yellow;
   }
   .alert.alert3 {
      background-color: $uva-blue-alt-300;
      border-left: 8px solid $uva-blue-alt;
   }
}

.regional-alerts {
   width: 90%;
   margin: 0 auto 30px auto;
   .regional-alert {
      color: $uva-text-color-dark;
      background-color: $uva-teal-200;
      border: 0.2em solid $uva-teal;
      border-radius: 0.3rem;
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

html,
body {
   margin: 0;
   padding: 0;
   font-family: "franklin-gothic-urw", arial, sans-serif;
   -webkit-font-smoothing: antialiased;
   -moz-osx-font-smoothing: grayscale;
   color: $uva-grey-A;
   background: $uva-blue-alt-B;
}
.sticky {
   position: fixed !important;
   top: 0;
   width: 100%;
   z-index: 500;
}

#app {
   font-family: "franklin-gothic-urw", arial, sans-serif;
   -webkit-font-smoothing: antialiased;
   -moz-osx-font-smoothing: grayscale;
   text-align: center;
   color: $uva-text-color-base;
   margin: 0;
   padding: 0;
   background: $uva-grey-200;
   outline: 0;
   border: 0;

   h1 {
      padding: 3rem 0 35px 0;
      position: relative;
      font-weight: 700;
      color: $uva-brand-blue;
      line-height: 1.15;
      margin: 0;
   }
   h2 {
      color: $uva-brand-blue;
      text-align: left;
      font-size: 1.3em;
      margin: 50px 0 17px 0;
   }
   .link-icon {
      display: inline-block;
      margin-left: 10px;
   }
   .screen-reader-text {
      clip: rect(1px, 1px, 1px, 1px);
      position: absolute !important;
      height: 1px;
      width: 1px;
      overflow: hidden;
   }
   #v4main {
      background: white;
      position: relative;
      display: block;
      max-width: 1600px;
      margin: 0 auto;
      outline: 0;
      &:focus {
         outline: 0;
      }
   }
}

a {
   color: $uva-blue-alt-A;
   font-weight: 500;
   text-decoration: none;
   &:hover {
      text-decoration: underline;
      color: $uva-blue-alt;
   }
}

.update-pop {
   position: fixed;
   z-index: 5000;
   top: 10px;
   right: 10px;
   background: white;
   padding: 10px;
   border: 4px solid $uva-brand-orange;
   text-align: center;
   padding: 15px;
   display: flex;
   flex-direction: column;
   gap: 15px;
   .msg {
      font-size: 1.2em;
   }
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
   border-radius: 0.3rem;
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
      background-color: $uva-teal-200;
      border-color: $uva-teal-100;
      color: $uva-text-color-dark;
   }
   &.ra-notice {
      background-color: $uva-yellow;
      border-color: $uva-yellow-A;
      color: #000;
   }
}

/** regional alert: warning */
#app .ra-warning {
   border: 0.2em solid $uva-yellow;
   border-radius: 0.3rem;
   padding: 0.75rem 1rem;
   margin-bottom: 1rem;
   background-color: $uva-yellow-100;
   text-align: left;
   .alert-title {
      font-weight: bold;
      font-size: 1.2em;
      margin-bottom: 0.5rem;
   }
   a {
      text-decoration: underline;
   }
}

//adding accessibility for keyboard focus

a:focus, input:focus, select:focus, textarea:focus, button.pool:focus, .pre-footer a:focus  {
   outline: 2px dotted $uva-brand-blue-100;
   outline-offset: 3px;
}
a:focus {
   border-radius: 0.3rem;
}
footer, div.header, nav.menu {
   a:focus {
      outline: 2px dotted $uva-grey-200;
      outline-offset: 3px;
   }
}

</style>
