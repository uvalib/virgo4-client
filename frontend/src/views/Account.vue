<template>
   <main class="account">
      <h1>My Account</h1>
      <div class="account-content">
         <AccountActivities/>
         <div class="working" v-if="!expandBilling && lookingUp" >
            <div>Looking up account details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <template v-else-if="hasAccountInfo">
            <div class="user-name">{{info.displayName}} ({{info.id}})</div>   
            <div>{{info.department}} - {{info.profile}}</div>
            <div>{{info.address}}</div>
            <div>{{info.email}}</div>
            <div class="status-info">
               <div><b>Standing:</b> {{info.standing}}</div>
               <div class="standing-info" v-if="info.standing=='BARRED'">
                  Your account is suspended until all bills are paid and/or the overdue items are returned. 
                  If you need assistance, please email <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
               </div>
               <div class="standing-info" v-if="info.standing=='BAD-ADDRESS'">
                  Please contact the library to update your email and/or mailing address information: 
                  <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a> or 434-924-3021.
               </div>
               <div class="standing-info" v-if="info.standing=='BARR-SUPERVISOR'">
                  Please contact the library about your account: 
                  <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a> or 434-924-3021.
               </div>
               
               <div v-if="isBillOwed || totalFines>0" class="outstanding-bill">
                  <div class="fines-head">Billing</div>
                  <div class="fines-content">
                     <div class="notes">
                        Your account currently has an outstanding balance.
                        Click the totals below to see more details.
                     </div>
                     <div v-if="isBillOwed">
                        <AccordionContent :title="billsLabel" align="left-narrow">
                           <div class="bills">  
                              <div class="info">
                                 You have been billed replacement bills for the below items. 
                                 If you have the items, please return them and we will remove the 
                                 replacement bills. If you pay for an item and find it within 90 days, 
                                 you may be refunded the replacement amount. Rather than pay replacement 
                                 bills, you may replace a lost book with one you supply the library, 
                                 but it must be the same edition or newer and in very good condition. 
                                 We will accept a paperback replacement copy for a hardback. 
                                 The library reserves the right to refuse a replacement copy.
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
                        </AccordionContent>
                     </div>

                     <div v-if="totalFines>0">
                        <AccordionContent :title="finesLabel" align="left-narrow">
                           <div class="fines">
                              <div class="info">
                                 This is what you currently owe in overdue fines. 
                                 Fines will continuing accruing until the item is returned.
                              </div>
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

                     <div class="payment">
                        <div><b>Payment Information</b></div>
                        <div v-if="useSIS">
                           All bills must be paid using SIS. Access the system
                           <a target="_blank" href="https://sisuva.admin.virginia.edu/ihprd/signon.html">
                           here</a>.
                        </div>
                        <div v-else> 
                           <div>
                              All fines must be paid at the Alderman Library using exact cash or personal check. 
                              We do not take credit cards or any online payments at this time.
                           </div>
                           <div class="addr">
                              <strong>Alderman Library</strong><br/>
                              160 McCormick Road<br/>
                              Charlottesville, VA 22904<br/>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </template>
         <transition name="message-transition"
                     enter-active-class="animated faster fadeIn"
                     leave-active-class="animated faster fadeOut">
            <p v-if="error" class="error">Unable to retrieve account information: {{ error }}</p>
         </transition>
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
         error: state => state.system.error,
      }),
      ...mapGetters({
        hasAccountInfo: 'user/hasAccountInfo',
        totalFines:  'user/totalFines',
        itemsWithFines: 'user/itemsWithFines',
        isUndergraduate: 'user/isUndergraduate',
        isGraduate: 'user/isGraduate',
        isAlumni: 'user/isAlumni',
      }),
      useSIS() {
         return (this.isUndergraduate || this.isGraduate || this.isAlumni)
      },
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
   border-bottom: 2px solid var(--brand-blue);
   margin-bottom: 5px;
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
}
div.bill, div.fine {
   border: 1px solid #ccc;
   margin: 0;
   padding: 5px;
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
.info {
   padding: 5px;
   margin-bottom: 10px;
}
.payment {
   margin-top: 15px;
}
.payment b {
   display: inline-block;
   margin-bottom: 10px;
}
.addr {
   font-size: 0.85em;
   padding: 5px 15px;
   margin-top: 10px;
}
.standing-info {
   width: 40%;
   font-size: 0.9em;
   padding: 10px;
   text-align: center;
   border: 2px solid firebrick;
   margin: 5px;
   border-radius: 5px;
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
   .standing-info {
      width: 90%;
   }
}
.error {
   text-align: center;
}
</style>

