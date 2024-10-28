<template>
   <div class="libary-admin">
      <h3>
         <span>PDA Dashboard</span>
      </h3>
      <div class="content form" >
         <h4>Order History</h4>
         <p class="error" v-html="pdaStore.error" v-if="pdaStore.error"></p>
         <div class="pager">
            <VirgoButton class="pager" severity="secondary" @click="pdaStore.getOrders(pdaStore.pagination.prev_page)" :disabled="!pdaStore.pagination.prev_page">Prev</VirgoButton>
            <span>Page {{pdaStore.pagination.current_page}} of {{pdaStore.pagination.total_pages}}</span>
            <VirgoButton class="pager" severity="secondary" @click="pdaStore.getOrders(pdaStore.pagination.next_page)" :disabled="!pdaStore.pagination.next_page">Next</VirgoButton>
         </div>
         <table>
            <tbody>
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
            </tbody>
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
   h3 {
      margin: 0;
      padding: 10px 15px;
      background: $uva-grey-200;
      border-bottom: 1px solid $uva-grey-100;
      font-size: 1.2em;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      display: flex;
   }
   div.pager {
      display: flex;
      flex-flow: row nowrap;
      justify-self: start;
      align-items: center;
      margin: 0 0 10px 0;
      span {
         display: inline-block;
         margin-left: 10px;
      }
      button {
         font-size: 0.95em;
      }
   }
   .content.form {
      padding: 5px 20px 20px 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;

      h3 {
         font-weight: normal;
         font-size: 1.1em;
      }
      table {
         table-layout: auto;
         border-collapse: collapse;
         width: 100%;
         th, td {
            white-space: nowrap;
            padding: 5px 10px;
            border: 1px solid $uva-grey-200;
         }
         th {
            white-space: nowrap;
            background: $uva-grey-200;
            border: 1px solid $uva-grey-100;
         }
      }
      td.wrap {
         white-space: normal;
      }
   }
}
</style>