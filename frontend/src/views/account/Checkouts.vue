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
            <Tabs value="uva" :lazy="true">
               <TabList>
                  <Tab  v-for="tab in checkoutTabs" :value="tab.id">
                     <div class="tab-header">
                        <span>{{ tab.label }}</span>
                        <i v-if="tab.id=='uva' && userStore.lookupUVACheckouts" class="pi pi-spin pi-spinner"></i>
                        <i v-if="tab.id=='ill' && userStore.lookupILLCheckouts" class="pi pi-spin pi-spinner"></i>
                     </div>
                  </Tab>
               </TabList>
               <TabPanels>
                  <TabPanel value="uva">
                     <V4Spinner v-if="userStore.lookupUVACheckouts"  message="Loading UVA Checkouts..."/>
                     <UVACheckoutsPanel v-else/>
                  </TabPanel>
                  <TabPanel value="ill">
                     <V4Spinner v-if="userStore.lookupILLCheckouts"  message="Loading ILL Checkouts..."/>
                     <ILLCheckoutsPanel v-else />
                  </TabPanel>
               </TabPanels>
            </Tabs>
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
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const systemStore = useSystemStore()
const userStore = useUserStore()
const route = useRoute()

const checkoutTabs = computed(() => {
   let uvaLbl = `UVA Checkouts (${userStore.checkouts.length})`
   if (userStore.lookupUVACheckouts) {
      uvaLbl = "UVA Checkouts"
   }
   let illLbl = `ILL Checkouts (${illiadCheckouts.value.length})`
   if (userStore.lookupUVACheckouts) {
      illLbl = "ILL Checkouts"
   }
   return [
      {id: "uva", label: uvaLbl},
      {id: "ill", label: illLbl},
   ]
})

const illiadCheckouts = computed(()=>{
   return userStore.requests.illiad.filter( h=> h.transactionStatus == "Checked Out to Customer")
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
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
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
