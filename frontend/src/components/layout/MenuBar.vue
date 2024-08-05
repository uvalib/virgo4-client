<template>
   <nav v-if="!systemStore.$datafatal" class="menu" aria-label="Virgo Menu">
      <Menubar :model="v4Menu">
         <template #item="{ label, item, props }">
            <a :href="item.url" :target="item.target" v-bind="props.action">
               <span v-bind="props.icon" />
               <span v-bind="props.label">{{ label }}</span>
               <span v-if="item.items" class="pi pi-fw pi-angle-down" v-bind="props.submenuicon" />
            </a>
         </template>
         <template #end>
            <span v-if="userStore.isSignedIn && userStore.itemsOnNotice.length > 0">
               <router-link to="/checkouts?overdue=1">
                  <span class="menu-item notice">
                     <i class="fas fa-exclamation-triangle"></i><span class="cnt">{{userStore.itemsOnNotice.length}}</span>
                  </span>
               </router-link>
            </span>
            <span v-if="systemStore.isKiosk == false" class="alert-wrap">
               <a role="menuitem" id="alertmenu" class="menu-item" :tabindex="alertTabIndex"
                  @click="alertClicked" @keydown.prevent.stop.enter="alertClicked"
                  @keydown.space.prevent.stop="alertClicked"
                  aria-label="virgo alerts"
                  :disabled="alertStore.seenCount==0"
               >
                  <i class="alert-bell icon fal fa-bell" :class="{dim: alertStore.seenCount==0}"></i>
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
import { useRouter } from "vue-router"

const alertStore = useAlertStore()
const systemStore = useSystemStore()
const userStore = useUserStore()
const results = useResultStore()
const router = useRouter()


const alertTabIndex = computed( () => {
   if ( alertStore.seenCount > 0) {
      return 0
   }
   return -1
})

const v4Menu = computed( () => {
   let menu = [ {label: "Search", icon: "icon fal fa-search", command: ()=>searchClicked(), key: "searchmenu"}, ]
   if ( systemStore.isKiosk) return menu

   let nonKiosk = [
      {label: "Questions? Ask a Librarian", url: "https://www.library.virginia.edu/askalibrarian",
         target: "_blank", icon: "icon fal fa-comment-dots"},
      {label: "Library Services", items: [
         {label: "Subject Guides", url: "https://guides.lib.virginia.edu",
            target: "_blank", command: ()=>libServiceClicked('Subject Guides')},
         {label: "Journal Finder", url: "https://guides.lib.virginia.edu/journalfinder",
            target: "_blank", command: ()=>libServiceClicked('Journal Finder')},
         {label: "Databases A-Z", url: "https://guides.lib.virginia.edu/az.php",
            target: "_blank", command: ()=>libServiceClicked('Databases A-Z')},
         {label: "Spaces & Equipment", url: "https://cal.lib.virginia.edu",
            target: "_blank", command: ()=>libServiceClicked('Spaces & Equipment')},
         {label: "More Library Services", url: "https://www.library.virginia.edu/services",
            target: "_blank", command: ()=>libServiceClicked('Spaces & Equipment')},
      ]}
   ]

   let signIn = []
   if (userStore.isSignedIn) {
      let items = [
         {label: "My Information", command: ()=>userLinkClicked("/account")},
         {label: "Checkouts", command: ()=>userLinkClicked("/checkouts")},
         {label: "Digital Deliveries", command: ()=>userLinkClicked("/digital-deliveries")},
         {label: "Requests", command: ()=>userLinkClicked("/requests")},
         {label: "Bookmarks", command: ()=>userLinkClicked("/bookmarks")},
         {label: "Searches", command: ()=>userLinkClicked("/searches")},
         {label: "Preferences", command: ()=>userLinkClicked("/preferences")}
      ]
      if (userStore.isAdmin || userStore.isPDAAdmin) {
         items.push({label: "Admin", command: ()=>userLinkClicked("/admin")})
      }
      items.push({label: "Sign out",  command: ()=>signOut()})
      signIn = [ {label: `Signed in as ${userStore.signedInUser}`, icon: "icon fal fa-user-circle", items: items} ]
   } else {
      signIn = [ {label: "Sign In", icon: "icon fal fa-user-circle", command: ()=>userLinkClicked("/signin")} ]
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
   router.push("/")
   results.resetSearch()
   window.scrollTo({
      top: 0,
      behavior: "auto"
   })
})

const userLinkClicked = ( (tgtRoute) => {
   router.push(tgtRoute)
})
const signOut = (() => {
   userStore.signout(true)
})
</script>

<style lang="scss" scoped>
.menu-item.notice {
   color: var(--uvalib-yellow);
   margin: 0 0 0 10px;
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
#alertmenu {
   display: inline-block;
   border-radius: 10px;
}
.alert-wrap {
   display: inline-block;
   position: relative;
   .alert-bell {
      position: relative;
      color: white;
      cursor: pointer;
      display: inline-block;
      margin-left:0px;
      font-size: 1.3em;
      display: inline-block;
      margin: 5px;
      border-radius: 50px;
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
      font-family: sans-serif;
      display: inline-block;
      text-align: center;
      border-radius: 15px;
      padding: 3px 6px 1px 6px;
      position: absolute;
      right: -8px;
      top: -12px;
      cursor: pointer;
   }
}

</style>
