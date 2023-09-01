<template>
   <Dialog v-model:visible="userStore.showRenewSummary" :modal="true" position="top" header="Renew Summary" @hide="closeSummary">
      <div class="renew-content">
         <div v-if="userStore.renewSummary.renewed > 0"><strong>{{userStore.renewSummary.renewed}}</strong> items successfully renewed.</div>
         <div v-if="userStore.renewSummary.failed > 0" class="fails">
            <div><strong>{{userStore.renewSummary.failed}}</strong> items failed renewal: </div>
            <ul>
               <li v-for="(f,idx) in userStore.renewSummary.failures" :key="`fail-${idx}`">
                  <strong class="bc">{{f.barcode}}:</strong><span>&nbsp;{{f.message}}</span>
               </li>
            </ul>
         </div>
      </div>
      <div class="form-controls">
         <V4Button mode="tertiary" class="close" @click="closeSummary">OK</V4Button>
      </div>
   </Dialog>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
import Dialog from 'primevue/dialog'

const userStore = useUserStore()

const closeSummary = (()  => {
  userStore.clearRenewSummary()
})
</script>

<style lang="scss" scoped>
div.renew-content {
   padding: 0;
   text-align: left;
   font-weight: normal;
   .fails {
      margin-top: 10px;
   }
   ul {
      list-style: none;
      padding: 0 0 0 25px;
      margin: 10px 0 0 0;
   }
   li {
      margin: 5px 0;
   }
   strong.bc {
      margin-right: 5px;
   }
}
</style>
