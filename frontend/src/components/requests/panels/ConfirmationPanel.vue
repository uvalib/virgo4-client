<template>
   <div class="confirmation-panel">
      <h2>We have received your request.</h2>
      <dl>
         <dt>User ID:</dt>
         <dd>{{user.signedInUser}}</dd>
         <template v-if="request.hold.itemLabel">
            <dt>Item:</dt>
            <dd>{{request.hold.itemLabel}}</dd>
            <dt>Pickup Library:</dt>
            <dd>{{request.hold.pickupLibrary}}</dd>
         </template>
         <template v-if="request.aeon.callNumber">
            <dt>CallNumber:</dt>
            <dd>{{request.aeon.callNumber}}</dd>
            <dt>Request Note:</dt>
            <dd>{{request.aeon.specialRequest}}</dd>
         </template>
      </dl>
   </div>
</template>

<script setup>
import { onMounted } from "vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"

const request = useRequestStore()
const user = useUserStore()

onMounted(()=>{
   setTimeout( () => {
      let ele = document.getElementById("request-done")
      if ( ele ) {
         ele.focus()
      }
   }, 150)
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
