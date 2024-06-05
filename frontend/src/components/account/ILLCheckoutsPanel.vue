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
         <div v-else>
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
   border: 1px solid var(--uvalib-grey-light);
   border-top: 0;

   .none {
      text-align: center;
      font-size: 1.25em;
      border: 1px solid var(--uvalib-grey);
      background:white;
      padding: 10px;
      box-shadow: $v4-box-shadow-light;
   }

   .checkout-list {
      padding: 10px;
      min-height: 65px;
      text-align: left;
      background: var(--uvalib-grey-lightest);
   }

   .controls {
      margin: 0;
      padding:10px;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-end;
      align-items: center;
      border-bottom: 3px solid var(--uvalib-blue-alt);
      background: white;

      label {
         font-weight: 500;
         margin-right: 10px;
      }
   }

   .item {
      font-size: 0.9em;
      margin:15px;
      border: 1px solid var(--uvalib-grey-lightest);
      background: white;
      padding: 5px 10px;
      box-shadow: $v4-box-shadow-light;

      h3 {
         margin: 0 0 15px 0;
         padding: 10px;
         border-bottom: 2px solid var(--uvalib-grey-light);
      }
      .renewbar {
         text-align: right;
         padding: 5px;
         a {
            font-size: initial;
         }
      }
      dl {
         margin: 0 0 0 15px;
         display: inline-grid;
         grid-template-columns: max-content 2fr;
         grid-column-gap: 15px;
      }
      dt {
         font-weight: bold;
         text-align: right;
         margin: 0 0 10px 0;
      }
   }
}
</style>
