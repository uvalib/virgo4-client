<template>
   <div class="confirmation-panel">
      <h2>We have received your request.</h2>
      <p>You'll receive an email when your request is ready.</p>
      <p>
         <VirgoButton link @click="cleanup(); router.push({path: '/requests', hash: '#ils-holds'})">View outstanding requests in your Account.</VirgoButton>
      </p>
      <dl>
         <dt>User ID:</dt>
         <dd>{{user.signedInUser}}</dd>
         <template v-if="requestStore.requestInfo.callNumber">
            <dt>Item:</dt>
            <dd>{{requestStore.requestInfo.callNumber}}</dd>
         </template>
         <template v-if="requestStore.requestInfo.pickupLibrary">
            <dt>Pickup Library:</dt>
            <dd>{{requestStore.requestInfo.pickupLibrary}}</dd>
         </template>
         <template v-if="requestStore.requestInfo.notes">
            <dt>Request Note:</dt>
            <dd>{{requestStore.requestInfo.notes}}</dd>
         </template>
      </dl>
   </div>
</template>

<script setup>
import { onMounted, nextTick } from "vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { useRestoreStore } from "@/stores/restore"
import { setFocusID } from '@/utils'
import router from "@/router"

const requestStore = useRequestStore()
const user = useUserStore()
const restore = useRestoreStore()

onMounted(()=>{
   nextTick( () =>  setFocusID("request-done") )
})
function cleanup(){
   requestStore.activeRequest = "none"
   requestStore.errors = {}
   restore.setActiveRequest( requestStore.activeRequest )
   restore.save()
}
</script>

<style scoped lang="scss">
.confirmation-panel{
   h2, p {
      text-align: center;
   }
   dl {
      margin-top: 15px;
      display: inline-grid;
      grid-template-columns: 1fr 1fr;
      grid-column-gap: 10px;
      width: 100%;
   }
   dt {
      font-weight: bold;
      text-align: right;
      padding: 4px 8px;
      white-space: nowrap;
      vertical-align: top;
   }
   dd {
      margin: 0;
      width: 100%;
      text-align: left;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      padding: 4px 0px;
   }
}
</style>
