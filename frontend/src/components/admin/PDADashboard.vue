<template>
   <div class="libary-admin">
      <h2>
         <span>PDA Dashboard</span>
      </h2>
      <div class="content form">
         <h3>Orders from the last 7 days</h3>
         <table>
            <tr>
               <th>Date Ordered</th>
               <th>Ordered By</th>
               <th>Hold Library</th>
               <th>Fund Code</th>
               <th>Loan Type</th>
               <th>Barcode</th>
               <th class="wide">Title</th>
            </tr>
            <tr v-for="o in pdaStore.report" :key="o.barcode">
               <td style="width:max-content;">{{o.dateOrdered.split("T")[0]}}</td>
               <td>{{o.computingID}}</td>
               <td>{{o.holdLibrary}}</td>
               <td>{{o.fundCode}}</td>
               <td>{{o.loanType}}</td>
               <td>{{o.barcode}}</td>
               <td class="wrap">{{o.title}}</td>
            </tr>
         </table>
      </div>
   </div>
</template>

<script setup>
import { usePDAStore } from "@/stores/pda"
import { onMounted } from 'vue'

const pdaStore = usePDAStore()

onMounted( () => {
   if (pdaStore.report.length == 0) {
      pdaStore.getRecentOrders()
   }
})
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