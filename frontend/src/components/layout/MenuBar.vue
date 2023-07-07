<template>
   <nav v-if="!systemStore.$datafatal" class="menu" aria-label="Virgo Menu"
      :class="{shadow: alertStore.seenCount>0 && alertStore.menuCount==0 || alertStore.menuCount == 0}"
   >
      <Menubar :model="v4Menu">
         <template #end>
            <span v-if="userStore.isSignedIn && userStore.itemsOnNotice.length > 0">
               <router-link to="/checkouts?overdue=1">
                  <span  class="menu-item notice">
                     <i class="fas fa-exclamation-triangle"></i><span class="cnt">{{userStore.itemsOnNotice.length}}</span>
                  </span>
               </router-link>
            </span>
            <span v-if="systemStore.isKiosk == false" class="alert-wrap">
               <a role="menuitem" id="alertmenu" class="menu-item" tabindex="0"
                  @click="alertClicked" @keydown.prevent.stop.enter="alertClicked"
                  @keydown.space.prevent.stop="alertClicked"
                  aria-label="virgo alerts"
               >
                  <i class="alert-bell icon fal fa-bell" :class="{dim: alertStore.menuCount==0 && alertStore.seenCount==0 || alertStore.menuCount>0}"></i>
                  <span v-if="alertStore.seenCount" class="alert-count">{{alertStore.seenCount}}</span>
               </a>
            </span>
         </template>
      </Menubar>
   </nav>
</template>

<script setup>
import Menubar from 'primevue/menubar'
import { useSystemStore } from "@/stores/system"
import { useResultStore } from "@/stores/result"
import { useUserStore } from "@/stores/user"
import { useAlertStore } from "@/stores/alert"
import { computed } from 'vue'
import analytics from '@/analytics'

const alertStore = useAlertStore()
const systemStore = useSystemStore()
const userStore = useUserStore()
const results = useResultStore()

const v4Menu = computed( () => {
   let menu = [ {label: "Search", to: "/", icon: "icon fal fa-search", command: ()=>searchClicked(), key: "searchmenu"}, ]
   if ( systemStore.isKiosk) return menu

   let nonKiosk = [
      {label: "Questions? Ask a Librarian", url: "https://www.library.virginia.edu/askalibrarian",
         target: "_blank", icon: "icon fal fa-comment-dots"},
      {label: "Library Services", items: [
         {label: "Subject Guides", url: "https://www.library.virginia.edu/research",
            target: "_blank", command: ()=>libServiceClicked('Subject Guides')},
         {label: "Journal Finder", url: "https://guides.lib.virginia.edu/journalfinder",
            target: "_blank", command: ()=>libServiceClicked('Journal Finder')},
         {label: "Databases A-Z", url: "https://guides.lib.virginia.edu/az.php",
            target: "_blank", command: ()=>libServiceClicked('Databases A-Z')},
         {label: "Spaces & Equipment", url: "https://www.library.virginia.edu/services",
            target: "_blank", command: ()=>libServiceClicked('Spaces & Equipment')},
         {label: "Spaces & Equipment", url: "https://www.library.virginia.edu/services",
            target: "_blank", command: ()=>libServiceClicked('Spaces & Equipment')},
      ]}
   ]

   let signIn = []
   if (userStore.isSignedIn) {
      let items = [
         {label: "My Information", to: "/account"},
         {label: "Checkouts", to: "/checkouts"},
         {label: "Digital Deliveries", to: "/digital-deliveries"},
         {label: "Requests", to: "/requests"},
         {label: "Bookmarks", to: "/bookmarks"},
         {label: "Searches", to: "/searches"},
         {label: "Preferences", to: "/preferences"},
      ]
      if (userStore.isAdmin || userStore.isPDAAdmin) {
         items.push({label: "Admin", to: "/admin"})
      }
      items.push({label: "Sign out",  command: ()=>signOut()})
      signIn = [ {label: `Signed in as ${userStore.signedInUser}`, icon: "icon fal fa-user-circle", items: items} ]
   } else {
      signIn = [ {label: "Sign In", to: "/signin", icon: "icon fal fa-user-circle"} ]
   }

   return menu.concat(nonKiosk).concat(signIn)
})

const libServiceClicked = ((serviceName) => {
   analytics.trigger('Navigation', 'LIBRARY_SERVICE_CLICKED', serviceName)
})

const alertClicked =(() => {
   alertStore.clearSeenAlerts()
})

const searchClicked = (() => {
   results.resetSearch()
   window.scrollTo({
      top: 0,
      behavior: "auto"
   })
})

const signOut = (() => {
   userStore.signout(true)
})
</script>

<style lang="scss" scoped>
nav.menu.shadow {
   box-shadow: $v4-box-shadow;
}
.menu-item.notice {
   color: var(--uvalib-yellow);
   margin-right: 2px;
   font-weight: normal;
   .cnt {
      font-size: 0.8em;
      font-weight: bold;
      font-family: sans-serif;
      display: inline-block;
      position: relative;
      top: -6px;
      left: -2px;
   }
}

.alert-wrap {
   .alert-bell {
      position: relative;
      color: white;
      cursor: pointer;
      display: inline-block;
      margin-left:0px;
      font-size: 1.3em;
      display: inline-block;
      margin: 0 5px 0 10px;
   }
   .alert-bell.dim {
      opacity: 0.4;
      cursor: default;
      &:hover {
         border-bottom: none;
      }
   }
   .alert-count {
      font-size: 1em;
      font-weight: bold;
      background: var(--uvalib-yellow);
      color: var(--uvalib-text-dark);
      width: 1em;
      height: 1em;
      font-family: sans-serif;
      display: inline-block;
      text-align: center;
      border-radius: 15px;
      padding: 1px;
      position: absolute;
      right: -8px;
      top: -8px;
   }
   &:focus {
      @include be-accessible-light();
   }
}

</style>
