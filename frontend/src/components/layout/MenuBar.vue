<template>
   <nav v-if="!systemStore.$datafatal" class="menu" aria-label="Virgo Menu">
      <Menubar :model="v4Menu"
         :pt="{
            item: {
               'aria-level': null
            }
         }"
      >
         <template #end>
            <span v-if="userStore.isSignedIn && userStore.itemsOnNotice.length > 0">
               <router-link to="/checkouts?overdue=1">
                  <span class="menu-item notice">
                     <i class="fas fa-exclamation-triangle"></i><span class="cnt">{{userStore.itemsOnNotice.length}}</span>
                  </span>
               </router-link>
            </span>
            <span v-if="systemStore.isKiosk == false" class="alert-wrap">
               <VirgoButton icon="alert-bell icon fal fa-bell" text rounded aria-label="virgo alerts"
                  size="large" :class="{dim: alertStore.seenCount==0}"
                  :disabled="alertStore.seenCount==0"  @click="alertClicked" />
               <span v-if="alertStore.seenCount" class="alert-count">{{alertStore.seenCount}}</span>
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

const v4Menu = computed( () => {
   let menu = [ {label: "Search", icon: "fal fa-search", command: ()=>searchClicked(), key: "searchmenu"}, ]
   if ( systemStore.isKiosk) return menu

   let nonKiosk = [
      {label: "Questions? Ask a Librarian", url: "https://www.library.virginia.edu/askalibrarian",
         icon: "fal fa-comment-dots"},
      {label: "Library Services", items: [
         {label: "Subject Guides", url: "https://guides.lib.virginia.edu",
            command: ()=>libServiceClicked('Subject Guides')},
         {label: "Journal Finder", url: "https://guides.lib.virginia.edu/journalfinder",
            command: ()=>libServiceClicked('Journal Finder')},
         {label: "Databases A-Z", url: "https://guides.lib.virginia.edu/az.php",
            command: ()=>libServiceClicked('Databases A-Z')},
         {label: "Spaces & Equipment", url: "https://cal.lib.virginia.edu",
            command: ()=>libServiceClicked('Spaces & Equipment')},
         {label: "More Library Services", url: "https://www.library.virginia.edu/services",
            command: ()=>libServiceClicked('Spaces & Equipment')},
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
      signIn = [ {label: `Signed in as ${userStore.signedInUser}`, icon: "fal fa-user-circle", items: items} ]
   } else {
      signIn = [ {label: "Sign In", icon: "fal fa-user-circle", command: ()=>userLinkClicked("/signin")} ]
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
   color: $uva-yellow;
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
:deep(.alert-bell.icon) {
   color: white;
}
#alertmenu {
   display: inline-block;
   border-radius: 10px;
}
.alert-wrap {
   position: relative;
   display: block;
   button {
      color: white;
   }
   button.dim {
      opacity: 0.2;
   }
   .alert-count {
      font-size: 1em;
      font-weight: bold;
      background: $uva-brand-orange;
      color: white;
      font-family: sans-serif;
      display: inline-block;
      text-align: center;
      border-radius: 40px;
      padding: 4px 8px;
      position: absolute;
      right: -11px;
      top: -7px;
      cursor: default;
   }
}

</style>
