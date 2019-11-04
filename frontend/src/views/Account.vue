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
               
               <div v-if="isBillOwed || totalFines>0" class="outstanding-bill">
                  <div class="fines-head">Fines / Bills</div>
                  <div class="fines-content">
                     <div class="notes">
                        <p>Your account will be billed for items that are lost or damaged.</p>
                        <p>Fines are added to your account for overdue items.</p>
                        <p>Placeholder text for information about paying fines/bills.</p>
                     </div>
                     <div v-if="isBillOwed">
                        <AccordionContent :title="billsLabel" align="left-narrow">
                           <div class="bills">  
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
                        </AccordionContent>
                     </div>

                     <div v-if="totalFines>0">
                        <AccordionContent :title="finesLabel" align="left-narrow">
                           <div class="fines">
                              <div class="fine" v-for="(fine,idx) in itemsWithFines" :key="idx">
                                 <table>
                                    <tr>
                                       <td class="label">Due Date:</td> 
                                       <td>{{fine.due.split("T")[0]}}</td>
                                    </tr>
                                    <tr>
                                       <td class="label">Amount:</td> 
                                       <td>${{fine.overdueFee}}</td>
                                    </tr>
                                    <tr><td class="label">Item:</td><td>{{fine.title}}</td></tr>
                                    <tr><td/><td>{{fine.author}}</td></tr>
                                    <tr><td/><td>{{fine.callNumber}}</td></tr>
                                 </table>  
                              </div>
                           </div>
                        </AccordionContent>
                     </div>
                  </div>
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
import AccordionContent from '@/components/AccordionContent'
export default {
   name: "account",
   data: function() {
      return {
         expandBilling: false 
      };
   },
   components: {
      AccountActivities, AccordionContent
   },
   computed: {
      ...mapState({
         info: state => state.user.accountInfo,
         lookingUp: state => state.user.lookingUp,
         bills: state => state.user.bills,
      }),
      ...mapGetters({
        hasAccountInfo: 'user/hasAccountInfo',
        totalFines:  'user/totalFines',
        itemsWithFines: 'user/itemsWithFines'
      }),
      isBillOwed() {
         let amtStr = this.info['amountOwed']
         return parseFloat(amtStr) > 0
      },
      finesLabel() {
         return  `<label style='font-weight:bold;margin-right:5px'>Total Fines:</label><span>$${this.totalFines}</span>`
      },
      billsLabel() {
         let bill = this.info.amountOwed
         return  `<label style='font-weight:bold;margin-right:5px'>Total Bills:</label><span>$${bill}</span>`
      }
   },
   methods: {
   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
      this.$store.dispatch("user/getCheckouts")
      this.$store.dispatch("user/getBillDetails") 
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
   width: 60%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.account-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.account-content  {
       width: 95%;
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
   margin-top: 15px;
}
.fines-head {
   font-weight: bold;
}
.fines-content {
   margin: 5px 15px;
}
.fines-content label {
   font-weight: bold;
   margin-right: 5px;
}
div.bills, div.fines {
   font-size: 0.8em;
   margin: 5px 0 15px 25px;
   display: inline-block;
   border-top: 1px solid #ccc;
}
div.bill, div.fine {
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
div.notes {
   font-size: 0.8em;
   padding: 0 0 10px 0;
}
div.notes p {
   margin: 2px 0;
}
</style>

