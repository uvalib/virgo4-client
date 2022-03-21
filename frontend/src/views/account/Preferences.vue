<template>
   <div class="preferences">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="preferences"/>
      <AccountActivities v-if="isSignedIn"/>
      <div class="working" v-if="(poolStore.lookingUp || userStore.lookingUp) && userStore.isSignedIn" >
         <V4Spinner message="Loading preferences..."/>
      </div>
      <div v-else>
         <template v-if="userStore.isSignedIn">
            <Search class="section"/>
            <PickupLibrary class="section"/>
            <BarcodeScan class="section"/>
            <V4Privacy class="section"/>
         </template>
      </div>
   </div>
</template>

<script setup>
import AccountActivities from "@/components/AccountActivities.vue"
import Search from "@/components/preferences/Search.vue"
import PickupLibrary from "@/components/preferences/PickupLibrary.vue"
import V4Privacy from "@/components/preferences/V4Privacy.vue"
import BarcodeScan from "@/components/preferences/BarcodeScan.vue"
import { useUserStore } from "@/stores/user"
import { usePoolStore } from "@/stores/pool"
import { usePreferencesStore } from "@/stores/preferences"
import { onMounted } from 'vue'
import analytics from '@/analytics'

const userStore = useUserStore()
const preferencesStore = usePreferencesStore()
const poolStore = usePoolStore()

onMounted( async () => {
   if ( userStore.isSignedIn) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Preferences")
      await preferencesStore.loadPreferences()
   }
})
</script>
<style lang="scss" scoped>
.preferences {
   min-height: 400px;
   position: relative;
   color: var(--color-primary-text);
   width: 60%;
   margin: 2vw auto 0 auto;
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
@media only screen and (min-width: 768px) {
   div.preferences  {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.preferences  {
      width: 95%;
   }
}
.section {
   margin: 15px 0;
   border: 1px solid var(--uvalib-grey-light);
   padding: 0;
   box-shadow: $v4-box-shadow-light;
   text-align: left;
}
</style>
