<template>
   <div class="libary-admin">
      <h2>
         <span>PDA Dashboard</span>
      </h2>
      <div class="content form" >
         <h3>Order History</h3>
         <p class="error" v-html="pdaStore.error" v-if="pdaStore.error"></p>
         <p>
            <V4Button class="pager" mode="tertiary" @click="pdaStore.getOrders(pdaStore.pagination.prev_page)" :disabled="!pdaStore.pagination.prev_page">Prev</V4Button>
            Page {{pdaStore.pagination.current_page}} of {{pdaStore.pagination.total_pages}}
            <V4Button class="pager" mode="tertiary" @click="pdaStore.getOrders(pdaStore.pagination.next_page)" :disabled="!pdaStore.pagination.next_page">Next</V4Button>
         </p>
         <table>
            <tr>
               <th>Created At</th>
               <th>Ordered By</th>
               <th>Hold Library</th>
               <th>Fund Code</th>
               <th>Loan Type</th>
               <th>Barcode</th>
               <th>Order Number</th>
               <th class="wide">Title</th>
            </tr>
            <tr v-for="o in pdaStore.orders" :key="o.barcode">
               <td style="width:max-content;">{{convertTZ(o.created_at)}}</td>
               <td>{{o.computing_id}}</td>
               <td>{{o.hold_library}}</td>
               <td>{{o.fund_code}}</td>
               <td>{{o.loan_type}}</td>
               <td>{{o.barcode}}</td>
               <td>{{o.vendor_order_number}}</td>
               <td class="wrap">{{o.title}}</td>
            </tr>
         </table>
         <p>{{pdaStore.pagination.total_count}} total orders</p>
      </div>
   </div>
</template>

<script setup>
import { usePDAStore } from "@/stores/pda"
import { onMounted } from 'vue'

const pdaStore = usePDAStore()
const tz = "America/New_York"

onMounted( async () => {
   pdaStore.getOrders()
})
function convertTZ(date) {
   return new Date(date).toLocaleString("en-US", {year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz})
}
</script>

<style lang="scss" scoped>
.libary-admin {
   h2 {
      margin: 0;
      padding: 10px 15px;
      background: var(--uvalib-grey-lightest);
      border-bottom: 1px solid var(--uvalib-grey-light);
      font-size: 1.2em;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      display: flex;
   }
   .content.form {
      h3 {
         font-weight: normal;
         font-size: 1.1em;
      }
      padding: 5px 20px 20px 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
      table {
         table-layout: auto;
         border-collapse: collapse;
         width: 100%;
         font-size: 0.8em;
         th, td {
            white-space: nowrap;
            padding: 5px 10px;
            border: 1px solid var(--uvalib-grey-lightest);
         }
         th {
            white-space: nowrap;
            background: var(--uvalib-grey-lightest);
            border: 1px solid var(--uvalib-grey-light);
         }
      }
      td.wrap {
         white-space: normal;
      }
   }
}
</style>