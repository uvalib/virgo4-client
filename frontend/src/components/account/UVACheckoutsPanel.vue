<template>
   <V4Spinner v-if="downloading" message="Downloading..." v-bind:overlay="true" />

   <div class="checkout-panel">
      <div class="controls" v-if="userStore.checkouts.length > 0">
         <span class="sort">
            <label>Sort by</label>
            <select v-model="userStore.checkoutsOrder" @change="sortChanged">
               <option value="AUTHOR_ASC">Author (Ascending)</option>
               <option value="AUTHOR_DESC">Author (Descending)</option>
               <option value="TITLE_ASC">Title (Ascending)</option>
               <option value="TITLE_DESC">Title (Descending)</option>
               <option value="DUE_ASC">Due Date (Ascending)</option>
               <option value="DUE_DESC">Due Date (Descending)</option>
               <option value="OVERDUE">Recalled / Overdue</option>
            </select>
         </span>
         <span class="checkout-options">
            <VirgoButton v-if="userStore.checkouts.length>0" @click="downloadCSV" icon="fal fa-download"
               aria-label="Download your checkouts as a CSV file" class="csv" size="small"/>
            <VirgoButton @click="userStore.renew('all')" label="Renew All"/>
         </span>
      </div>
      <div class="checkout-list">
         <div v-if="userStore.lookupUVACheckouts == false && userStore.checkouts.length == 0 && !systemStore.ilsError" class="none">
            You have no UVA checkouts.
         </div>
         <div class="item" v-for="(co,idx) in userStore.checkouts" :key="idx">
            <h3 class="item-title">
               <i v-if="itemOnNotice(co)" class="notice fas fa-exclamation-triangle"></i>
               <template v-if="co.id">
                  <router-link :to="`/sources/uva_library/items/u${co.id}`">{{co.title}}</router-link>
               </template>
               <template v-else>
                  {{co.title}}
               </template>
            </h3>
            <dl>
               <template v-if="co.author.length > 0">
                  <dt>Author:</dt>
                  <dd>{{co.author}}</dd>
               </template>
               <dt class="label">Call number:</dt>
                  <dd>{{co.callNumber}}</dd>
               <dt class="label">Barcode:</dt>
                  <dd>{{co.barcode}}</dd>
               <template v-if="co.currentLocation.toLowerCase() !== 'checked out'">
                  <dt class="label">Current Location </dt>
                  <dd> <b>{{ co.currentLocation }}</b> </dd>
               </template>
               <dt class="label">Due Date:</dt>
                  <dd v-html="formatDueInfo(co)"></dd>
               <template  v-if="fineIsVisible(co)">
                  <dt class="label">Fine:</dt>
                  <dd class="fine-value">${{co.overdueFee}}</dd>
               </template>
               <template v-for="bill, i in co.bills" :key="i">
                  <template v-if="parseFloat(bill.amount) > 0">
                     <dt v-if="i == 0" class="label" >Bill{{ co.bills.length > 1 ? 's' : '' }}:</dt>
                     <dt v-else class="label" ></dt>
                     <dd class="fine-value">{{bill.label}} ${{bill.amount}}</dd>
                  </template>
               </template>
            </dl>
            <div v-if="co.message" class="co-message">
               {{co.message}}
            </div>
            <div class="renewbar" v-if="!userStore.isBarred">
               <VirgoButton @click="userStore.renew(co.barcode)"  :aria-label="`renew ${co.title}`" label="Renew"/>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"

const systemStore = useSystemStore()
const userStore = useUserStore()
const downloading = ref(false)

const sortChanged = (() => {
   userStore.sortCheckouts(userStore.checkoutsOrder)
})
const downloadCSV = ( async () => {
   downloading.value = true
   await userStore.downloadCheckoutsCSV()
   downloading.value = false
})
const formatDueInfo = ((checkout) => {
   let out =  `<div>${checkout.due.split("T")[0]}</div>`
   if (checkout.overdue) {
      out += "<div class='overdue'>Overdue</div>"
   }
   if ( checkout.recallDueDate != "") {
      out += `<div class='recall'>Recall Due ${checkout.recallDueDate.split("T")[0]}</div>`
   }
   return out
})
const itemOnNotice = ((co) => {
   return co.overdue || co.recallDueDate != ""
})
const fineIsVisible = ((co) => {
   let f = parseFloat(co.overdueFee)
   // Show the fine except for when it's $20 and there's a recall due date
   return f > 0 && (f != 20 || !co.bills)
})

</script>

<style lang="scss" scoped>
:deep(.details div.overdue) {
   background: $uva-red-A;
   color: white;
   font-weight: bold;
   padding: 5px 15px;
   width:fit-content;
   margin: 2px 0;
   border-radius: 0.3rem;
}
:deep(.details div.recall) {
   background-color: $uva-yellow;
   color: $uva-text-color-dark;
   font-weight: bold;
   padding: 5px 15px;
   width:fit-content;
   margin: 2px 0;
   border-radius: 0.3rem;
}

.checkout-panel {
   background-color: white;
   border: 1px solid $uva-grey-100;
   border-top: 0;

   .none {
      text-align: center;
      font-size: 1.25em;
      border: 1px solid $uva-grey;
      background: white;
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

         h3 {
            margin: 0 0 15px 0;
            padding: 10px;
            border-bottom: 1px solid $uva-grey-100;
         }
         .renewbar {
            text-align: right;
            padding: 0 15px 15px 15px;
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
         .co-message {
            font-size: 1em;
            padding: 0.5rem 1rem;
            margin: 0 15px 15px 15px;
            background-color: $uva-red-100;
            color: $uva-text-color-dark;
            font-weight: bold;
            border-radius: 0.3rem;
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
      .sort {
         display: flex;
         flex-flow: row nowrap;
         justify-content: flex-start;
         align-items: center;
         gap: 10px;
      }

      .checkout-options {
         margin-left: auto;
         display: flex;
         flex-flow: row nowrap;
         align-items: center;
         gap: 10px;
      }
   }
}

.fine-value {
  background: $uva-red-A;
  color: white;
  border-radius: 0.3rem;
  font-weight: bold;
  padding: 5px 15px;
  margin-bottom: 2px;
  width:fit-content;
}

</style>
