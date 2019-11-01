<template>
   <main class="account">
      <h1>My Account</h1>
      <div class="account-content">
         <div class="working" v-if="!expandBilling && (lookingUp || !hasAccountInfo)" >
            <div>Looking up account details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else class="details">
            <AccountActivities/>
            <div class="user-name">{{info.displayName}} ({{info.id}})</div>   
            <div>{{info.department}} - {{info.profile}}</div>
            <div>{{info.address}}</div>
            <div>{{info.email}}</div>
            <div class="status-info">
               <div><b>Standing:</b> {{info.standing}}</div>
               <div v-if="isBillOwed" class="outstanding-bill">
                  <b>AMOUNT OWED:</b>
                  <span>${{info.amountOwed}}</span>
                  <i v-if="!expandBilling" @click="getBillDetail" class="bills fas fa-file-invoice-dollar"></i>
               </div>
            </div>
            <div v-if="expandBilling" class="bills">
               <div class="detail-head">
                  <span>Billing Details</span>
                  <i @click="closeBillDetail" class="close fas fa-times-circle"></i>
               </div>
               <div class="working" v-if="lookingUp">
                  <div>Looking up billing details...</div>
               </div>
               <div class="bill" v-for="(bill,idx) in bills" :key="idx">
                  <table>
                     <tr>
                        <td class="label">Date:</td> 
                        <td>{{bill.date}}</td>
                     </tr>
                     <tr>
                        <td class="label">Amount:</td> 
                        <td>${{bill.amount}}</td>
                     </tr>
                     <tr>
                        <td class="label">Reason:</td> 
                        <td>{{bill.reason}}</td>
                     </tr>
                     <tr><td class="label">Item:</td><td>{{bill.item.title}}</td></tr>
                     <tr><td/><td>{{bill.item.author}}</td></tr>
                     <tr><td/><td>{{bill.item.callNumber}}</td></tr>
                  </table>  
               </div>
            </div>
         </div>
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "account",
   data: function() {
      return {
         expandBilling: false 
      };
   },
   components: {
      AccountActivities
   },
   computed: {
      ...mapState({
         info: state => state.user.accountInfo,
         lookingUp: state => state.user.lookingUp,
         bills: state => state.user.bills,
      }),
      ...mapGetters({
        hasAccountInfo: 'user/hasAccountInfo',
      }),
      isBillOwed() {
         let amtStr = this.info['amountOwed']
         return parseFloat(amtStr) > 0
      },
   },
   methods: {
      getBillDetail() {
         this.expandBilling = true
         this.$store.dispatch("user/getBillDetails") 
      },
      closeBillDetail() {
         this.expandBilling = false
      }
   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
      this.$store.dispatch("user/getCheckouts")
   }
}
</script>

<style scoped>
.account {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
.account-content {
   width: 80%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.account-content  {
       width: 80%;
   }
}
@media only screen and (max-width: 768px) {
   div.account-content  {
       width: 80%;
   }
}
.details {
   text-align: left;
}
.user-name {
   font-size: 1.1em;
   font-weight: bold;
}
.status-info {
   margin: 15px 0;
}
.outstanding-bill {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
}
.outstanding-bill b {
   margin-right: 5px;
}
i.bills {
   font-size: 1.25em;
   cursor: pointer;
   color: var(--color-light-blue);
   margin-left: 10px;
}
div.bills {
   font-size: 0.8em;
   margin-left: 25px;
}
.detail-head {
   padding: 5px;
   background: var(--color-lightest-blue);
   font-weight: bold;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
}
i.close {
   margin-left: auto;
   font-size: 1.5em;
   color: white;
}
div.bill {
   border: 1px solid #ccc;
   margin: 0;
   padding: 5px;
   border-top: 0;
}
table td {
   padding: 0 5px;
}
td.label {
   text-align: right;
   font-weight: bold;
}
</style>

