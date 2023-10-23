<template>
   <div class="confirmation-panel">
      <h2>We have received your request.</h2>
      <dl>
         <dt>User ID:</dt>
         <dd>{{user.signedInUser}}</dd>
         <template v-if="requestStore.requestInfo.itemLabel">
            <dt>Item:</dt>
            <dd>{{requestStore.requestInfo.itemLabel}}</dd>
         </template>
         <template v-if="requestStore.requestInfo.pickupLibrary">
            <dt>Pickup Library:</dt>
            <dd>{{requestStore.requestInfo.pickupLibrary}}</dd>
         </template>
         <template v-if="requestStore.requestInfo.callNumber">
            <dt>CallNumber:</dt>
            <dd>{{requestStore.requestInfo.callNumber}}</dd>
         </template>
         <template v-if="requestStore.requestInfo.notes">
            <dt>Request Note:</dt>
            <dd>{{requestStore.requestInfo.notes}}</dd>
         </template>
      </dl>
   </div>
</template>

<script setup>
import { onMounted } from "vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { setFocusID } from '@/utils'

const requestStore = useRequestStore()
const user = useUserStore()

onMounted(()=>{
   setFocusID("request-done")
})
</script>

<style scoped lang="scss">
.confirmation-panel{
   h2 {
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
