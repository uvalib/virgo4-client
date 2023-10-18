<template>
   <div class="checkout">
      <V4Spinner v-if="downloading" message="Downloading..." v-bind:overlay="true" />
      <RenewSummary />
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="checkout information"/>
      <template v-if="userStore.isSignedIn">
         <AccountActivities />
         <V4Spinner v-if="userStore.renewing" message="Renew in progress..." v-bind:overlay="true" />
         <div class="details">
            <div class="barred" v-if="userStore.isBarred">
               Your account is suspended until all bills are paid and/or the overdue items are returned.<br/>
               If you need assistance, please email <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
            </div>
            <div v-if="lookingUpUVA == false && systemStore.ilsError" class="error">
               {{systemStore.ilsError}}
            </div>
            <div class="checkout-tabs">
               <VirgoButton @click="visibleTab = 'uva'" v-bind:class="{active: visibleTab == 'uva'}">
                  <span>UVA Checkouts ({{userStore.checkouts.length}})</span>
                  <V4Spinner v-if="lookingUpUVA" size="12px"/>
               </VirgoButton>
               <VirgoButton @click="visibleTab = 'ill'" v-bind:class="{active: visibleTab == 'ill'}">
                  <span>ILL Checkouts ({{illiadCheckouts.length}})</span>
                  <V4Spinner v-if="lookingUpILL" size="12px"/>
               </VirgoButton>
            </div>
            <template v-if="lookingUpUVA == false && visibleTab == 'uva'">
               <div v-if="lookingUpUVA == false && userStore.checkouts.length == 0 && !systemStore.ilsError" class="none">
                  You have no UVA checkouts.
               </div>

               <div v-else class="checkout-list">
                  <div class="controls">
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
                        <VirgoButton v-if="userStore.checkouts.length" @click="downloadCSV" icon="fal fa-download"
                           aria-label="Download your checkouts as a CSV file" class="csv"/>
                        <VirgoButton @click="renewAll" label="Renew All"/>
                     </span>
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
                        <VirgoButton @click="renewItem(co.barcode)"  :aria-label="`renew ${co.title}`" label="Renew"/>
                     </div>
                  </div>
               </div>
            </template>
            <div class="checkout-list" v-if="lookingUpILL == false && visibleTab == 'ill'">
               <div class="controls">
                  <VirgoButton @click="historyClicked" label="View Request History" icon="fal fa-external-link-alt" iconPos="right"/>
               </div>
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
                        <VirgoButton @click="renewILLClicked(co)" label="Renew" icon="fal fa-external-link-alt" iconPos="right"/>
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </template>
   </div>
</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import RenewSummary from "@/components/modals/RenewSummary.vue"
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import analytics from '@/analytics'
import { useRoute } from 'vue-router'

const systemStore = useSystemStore()
const userStore = useUserStore()
const route = useRoute()
const lookingUpUVA = ref(true)
const downloading = ref(false)
const visibleTab = ref("uva")

const lookingUpILL = computed(() => userStore.lookingUp)

const illiadCheckouts = computed(()=>{
   return userStore.requests.illiad.filter( h=> h.transactionStatus == "Checked Out to Customer")
})

const renewILLClicked = ((item) => {
   let url = `https://uva.hosts.atlas-sys.com/RemoteAuth/illiad.dll?Action=10&Form=67&Value=${item.transactionNumber}`
   window.open(url, "_blank")
})
const historyClicked = (() => {
   window.open("https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=60", "_blank")
})
const sortChanged = (() => {
   userStore.sortCheckouts(userStore.checkoutsOrder)
})
const renewItem = ((barcode) => {
   userStore.renewItem(barcode)
})
const renewAll = (() => {
   userStore.renewAll()
})
const downloadCSV = ( async () => {
   downloading.value = true
   await userStore.downloadCheckoutsCSV()
   downloading.value = false
})
const formatILLDate = ((dateStr) => {
   if (!dateStr) {
      return "N/A"
   }
   return dateStr.split("T")[0]
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

onMounted(async () => {
   lookingUpUVA.value = false
   if ( userStore.isSignedIn ) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Checkouts")
      userStore.getRequests()
      lookingUpUVA.value = true
      if (route.query.overdue) {
         userStore.checkoutsOrder = "OVERDUE"
      }
      await userStore.getCheckouts()
      lookingUpUVA.value = false
   }
})

</script>

<style lang="scss" scoped>
:deep(.details div.overdue) {
   background: var(--uvalib-red-emergency);
   color: white;
   font-weight: bold;
   padding: 5px 15px;
   width:fit-content;
   margin: 2px 0;
   border-radius: 5px;
}
:deep(.details div.recall) {
   background-color: var(--uvalib-yellow);
   color: var(--uvalib-grey-darkest);
   font-weight: bold;
   padding: 5px 15px;
   width:fit-content;
   margin: 2px 0;
   border-radius: 5px;
}

.checkout {
   min-height: 400px;
   position: relative;
   color: var(--color-primary-text);
   width: 60%;
   margin: 2vw auto 0 auto;
   position: relative;

   .none {
      text-align: center;
      font-size: 1.25em;
      border: 1px solid var(--uvalib-grey);
      background: var(--uvalib-grey-lightest);
      padding: 10px;
   }
   .details {
      text-align: left;
   }
}

.checkout-list {
   background-color: var(--uvalib-grey-lightest);
   border: 1px solid var(--uvalib-grey-light);

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

      .checkout-options{
         margin-left: auto;
         display: flex;
         flex-flow: row nowrap;
         align-items: center;
         button.p-button {
            margin: 0;
            &.csv {
               font-size: 1.4em;
               margin-right: 15px;
            }
         }
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
      .co-message {
         font-size: 1em;
         padding: 5px 10px;
         margin-bottom: 15px;
         background-color: var(--uvalib-red-lightest);
         font-weight: bold;
         border-radius: 5px;
      }
   }
}

@media only screen and (min-width: 768px) {
   div.checkout  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.checkout  {
       width: 95%;
   }
}
.fine-value {
  background: var(--uvalib-red-emergency);
  color: white;
  border-radius: 5px;
  font-weight: bold;
  padding: 5px 15px;
  margin-bottom: 2px;
  width:fit-content;
}
i.notice {
   color:  var(--uvalib-yellow);
   margin-right: 5px;
   font-size: 1.25em;
}
.barred, .error {
   font-size: 1em;
   font-weight: bold;
   text-align: center;
   padding: 10px;
   margin: 15px 0;
   border-radius: 5px;
   color: var(--uvalib-text);
   background-color: var(--uvalib-red-lightest);
}
.checkout-tabs {
   display: inline-flex;
   justify-content: space-evenly;
   flex-wrap: wrap;
   width: 100%;
   padding: 10px 0 0 0;
   border-bottom: 20px solid var(--uvalib-brand-blue);

   button.p-button {
      .v4-spinner.embed {
         width: 80px;
      }
      margin: 0;
      padding: 10px;
      border-radius: 5px 5px 0 0;
      color: var(--uvalib-text-dark);
      border: 1px solid var(--uvalib-grey-light);
      flex: 1 1 auto;
      background: #FFF;

      &.active {
         border: 1px solid var(--uvalib-brand-blue);
         background-color: var(--uvalib-brand-blue);
         color: #fff;
      }
   }
}
</style>
