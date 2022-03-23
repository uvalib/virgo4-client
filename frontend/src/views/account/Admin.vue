<template>
   <div class="admin">
      <AccountActivities v-if="userStore.isSignedIn"/>
      <div class="working" v-if="(poolStore.lookingUp || userStore.lookingUp) && userStore.isSignedIn" >
         <V4Spinner message="Loading admin settings..."/>
      </div>
      <div v-else>
         <template v-if="userStore.isSignedIn">
            <PickupLibraries class="section" v-if="userStore.isAdmin"/>
            <JWTAdmin class="section" v-if="userStore.isAdmin"/>
            <PDADashboard class="section"  v-if="userStore.isAdmin || userStore.isPDAAdmin"/>
         </template>
      </div>
   </div>
</template>

<script setup>
import JWTAdmin from "@/components/admin/JWTAdmin.vue"
import PickupLibraries from "@/components/admin/PickupLibraries.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import PDADashboard from "@/components/admin/PDADashboard.vue"
import { useUserStore } from "@/stores/user"
import { usePoolStore } from "@/stores/pool"
import { onMounted } from 'vue'
import analytics from '@/analytics'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const poolStore = usePoolStore()
const router = useRouter()

onMounted(() => {
   if ( !userStore.isAdmin &&  !userStore.isPDAAdmin ) {
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
   color: var(--color-primary-text);
   width: 60%;
   margin: 2vw auto 0 auto;
   .section {
      margin: 15px 0 40px 0;
      border: 1px solid var(--uvalib-grey-light);
      padding: 0;
      box-shadow: $v4-box-shadow-light;
      text-align: left;
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
   div.preferences  {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.preferences  {
      width: 95%;
   }
}
</style>
