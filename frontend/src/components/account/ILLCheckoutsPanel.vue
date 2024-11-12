<template>
   <div class="checkout-panel" v-if="userStore.lookupILLCheckouts == false">
      <div class="controls">
         <a href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=60" target="_blank">
            <span>View Request History</span>
            <i class="link-icon fal fa-external-link-alt"></i>
         </a>
      </div>
      <div class="checkout-list">
         <div v-if="illiadCheckouts.length == 0" class="none">
            You have no ILL checkouts.
         </div>
         <div class="item" v-for="(co,idx) in illiadCheckouts" :key="idx">
            <h3 class="item-title">{{co.loanTitle}}</h3>
            <dl>
               <dt>Author:</dt>
                  <dd>{{co.loanAuthor}}</dd>
               <template  v-if="co.callNumber">
                  <dt class="label">Call number:</dt>
                     <dd>{{co.callNumber}}</dd>
               </template>
               <dt class="label">Due Date:</dt>
                  <dd>{{formatILLDate(co.dueDate)}}</dd>
            </dl>
            <div class="renewbar" v-if="co.renewalsAllowed">
               <a :href="`https://uva.hosts.atlas-sys.com/RemoteAuth/illiad.dll?Action=10&Form=67&Value=${co.transactionNumber}`" target="_blank">
                  <span>Renew</span>
                  <i class="link-icon fal fa-external-link-alt"></i>
               </a>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()

const illiadCheckouts = computed(()=>{
   return userStore.requests.illiad.filter( h=> h.transactionStatus == "Checked Out to Customer")
})

const formatILLDate = ((dateStr) => {
   if (!dateStr) {
      return "N/A"
   }
   return dateStr.split("T")[0]
})
</script>

<style lang="scss" scoped>
.checkout-panel {
   background-color: white;
   border: 1px solid $uva-grey-100;
   border-top: 0;

   .none {
      text-align: center;
      font-size: 1.25em;
      border: 1px solid $uva-grey;
      background:white;
      padding: 10px;
   }

   .checkout-list {
      padding: 15px;
      min-height: 65px;
      background: $uva-grey-200;
      text-align: left;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: 15px;

      .item {
         border: 1px solid $uva-grey-100;
         background: white;
         padding: 0;
         border-radius: 0.3rem;

         h3 {
            margin: 0 0 15px 0;
            padding: 10px;
            border-bottom: 1px solid $uva-grey;
         }
         .renewbar {
            text-align: right;
            padding: 10px;
         }
         dl {
            margin: 0 0 0 15px;
            display: inline-grid;
            grid-template-columns: max-content 2fr;
            grid-column-gap: 15px;
            padding: 10px;
         }
         dt {
            font-weight: bold;
            text-align: right;
            margin: 0 0 10px 0;
         }
      }
   }

   .controls {
      margin: 0;
      padding:10px;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-end;
      align-items: center;
      border-bottom: 1px solid $uva-grey-100;
      background: white;
   }
}
</style>
