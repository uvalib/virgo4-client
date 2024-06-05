<template>
   <div class="checkout">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="checkout information"/>
      <template v-else>
         <RenewSummary />
         <AccountActivities />
         <V4Spinner v-if="userStore.renewing" message="Renew in progress..." v-bind:overlay="true" />
         <div class="details">
            <div class="barred" v-if="userStore.isBarred">
               Your account is suspended until all bills are paid and/or the overdue items are returned.<br/>
               If you need assistance, please email <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
            </div>
            <div v-if="systemStore.ilsError" class="error">
               {{systemStore.ilsError}}
            </div>
            <TabView @update:activeIndex="tabSelected" :lazy="true">
               <TabPanel v-for="tab in checkoutTabs" :key="`cotab-${tab.id}`">
                  <template #header>
                     <div class="tab-header">
                        <div class="tab-label">{{ tab.label }}</div>
                        <V4Spinner v-if="tab.id=='uva' && userStore.lookupUVACheckouts" size="12px"/>
                        <V4Spinner v-if="tab.id=='ill' && userStore.lookupILLCheckouts" size="12px"/>
                     </div>
                  </template>
                  <UVACheckoutsPanel v-if="visibleTab=='uva'" />
                  <ILLCheckoutsPanel v-if="visibleTab=='ill'" />
               </TabPanel>
            </TabView>
         </div>
      </template>
   </div>
</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import ILLCheckoutsPanel from "@/components/account/ILLCheckoutsPanel.vue"
import UVACheckoutsPanel from "@/components/account/UVACheckoutsPanel.vue"
import RenewSummary from "@/components/modals/RenewSummary.vue"
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import analytics from '@/analytics'
import { useRoute } from 'vue-router'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

const systemStore = useSystemStore()
const userStore = useUserStore()
const route = useRoute()
const visibleTab = ref("uva")

const checkoutTabs = computed(() => {
   return [
      {id: "uva", label: `UVA Checkouts (${userStore.checkouts.length})`},
      {id: "ill", label: `ILL Checkouts (${illiadCheckouts.value.length})`},
   ]
})
const illiadCheckouts = computed(()=>{
   return userStore.requests.illiad.filter( h=> h.transactionStatus == "Checked Out to Customer")
})
const tabSelected = ( (idx) => {
   visibleTab.value = checkoutTabs.value[idx].id
})
onMounted( () => {
   if ( userStore.isSignedIn ) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Checkouts")
      userStore.getRequests()
      if (route.query.overdue) {
         userStore.checkoutsOrder = "OVERDUE"
      }
      userStore.getCheckouts()
   }
})

</script>

<style lang="scss" scoped>
.checkout {
   min-height: 400px;
   position: relative;
   color: var(--color-primary-text);
   width: 60%;
   margin: 2vw auto 0 auto;
   position: relative;

   .details {
      margin-bottom: 50px;
   }

   div.tab-header {
      padding: 5px;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      width: 100%;
      align-items: center;
   }

   .barred, .error {
      font-size: 1em;
      font-weight: bold;
      text-align: center;
      padding: 10px;
      margin: 15px 0;
      border-radius: 5px;
      color: var(--uvalib-text);
      background-color: var(--uvalib-red-lightest);
   }
}

@media only screen and (min-width: 768px) {
   div.checkout  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.checkout  {
       width: 95%;
   }
}
</style>
