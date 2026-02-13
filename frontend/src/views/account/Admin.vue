<template>
   <div class="admin">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="admin"/>
      <AccountActivities v-if="userStore.isSignedIn"/>
      <div class="working" v-if="(poolStore.lookingUp || userStore.lookingUp) && userStore.isSignedIn" >
         <V4Spinner message="Loading admin settings..."/>
      </div>
      <div v-else-if="userStore.isSignedIn" class="sections">
         <Tabs value="pickup" :lazy="true">
            <TabList>
               <Tab value="pickup">Pickup Library Management</Tab>
               <Tab value="jwt">JWT Managment</Tab>
               <Tab value="prompt">AI Suggestor Prompt</Tab>
            </TabList>
            <TabPanels>
               <TabPanel value="pickup">
                  <PickupLibraries/>
               </TabPanel>
               <TabPanel value="jwt">
                  <JWTAdmin/>
               </TabPanel>
               <TabPanel value="prompt">
                  <SuggestorPrompt/>
               </TabPanel>
            </TabPanels>
         </Tabs>
      </div>
   </div>
</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import JWTAdmin from "@/components/admin/JWTAdmin.vue"
import PickupLibraries from "@/components/admin/PickupLibraries.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import SuggestorPrompt from "@/components/admin/SuggestorPrompt.vue"
import { useUserStore } from "@/stores/user"
import { usePoolStore } from "@/stores/pool"
import { onMounted } from 'vue'
import analytics from '@/analytics'
import { useRouter } from 'vue-router'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const userStore = useUserStore()
const poolStore = usePoolStore()
const router = useRouter()

onMounted(() => {
   if ( !userStore.isAdmin ) {
      router.replace("/forbidden")
   } else {
      if ( userStore.isSignedIn) {
         analytics.trigger('Navigation', 'MY_ACCOUNT', "Admin")
      }
   }
})
</script>
<style lang="scss" scoped>
.admin {
   min-height: 400px;
   position: relative;
   margin: 0 auto;
   padding-bottom: 50px;
   .sections {
      display: flex;
      flex-direction: column;
      gap: 30px;
      .section {
         margin: 0;
         border: 1px solid $uva-grey-100;
         padding: 0;
         text-align: left;
      }
   }
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
@media only screen and (min-width: 768px) {
   div.admin  {
      width: 80%;
   }
}
@media only screen and (max-width: 768px) {
   div.admin  {
      width: 95%;
   }
}
</style>
