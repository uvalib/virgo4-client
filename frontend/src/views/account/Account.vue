<template>
   <div class="account">
      <SignInRequired v-if="isSignedIn == false" targetPage="account information"/>
      <div v-else class="account-content">
         <AccountActivities/>
         <div class="working" v-if="!expandBilling && lookingUp" >
            <V4Spinner message="Looking up account details..."/>
         </div>
         <template v-else-if="hasAccountInfo">
            <h2 class="user-name">{{info.displayName}} ({{info.id}})</h2>
            <div>{{info.department}} - {{info.profile}}</div>
            <div>{{info.address}}</div>
            <div>{{info.email}}</div>
            <div class="leo-address">
               <label>LEO Delivery Location:</label>
               <span v-if="info.leoAddress">{{info.leoAddress}}</span>
               <template v-else>
                  <span>None specified</span>
                  <div class="no-leo">
                     Please contact <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a> to set up LEO Delivery.
                  </div>
               </template>
            </div>
            <div class="status-info">
               <div v-if="info.standing != 'OK'"><b>Standing:</b> {{info.standing}}</div>
               <div class="standing-info" v-if="info.standing=='BARRED'">
                  Your account is suspended until all bills are paid and/or the overdue items are returned.<br/>
                  If you need assistance, please email <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
               </div>
               <div class="standing-info" v-if="info.standing=='BAD-ADDRESS'">
                  Please contact the Library to update your email and/or mailing address information:
                  <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a> or 434-924-3021.
               </div>
               <div class="standing-info" v-if="info.standing=='BARR-SUPERVISOR'">
                  Please contact the Library about your account:
                  <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a> or 434-924-3021.
               </div>

               <div v-if="canChangePassword" class="password">
                  <ChangePassword />
               </div>

               <div v-if="ilsError" class="standing-info">{{ilsError}}</div>

               <div v-if="isBillOwed || totalFines>0" class="outstanding-bill">
                  <h2 class="fines-head">Billing</h2>
                  <div class="fines-content">
                     <div class="notes">
                        Your account currently has an outstanding balance.
                        Click the totals below to see more details.
                     </div>
                     <div v-if="isBillOwed">
                        <AccordionContent layout="narrow"  borderWidth="0" id="bills">
                           <template v-slot:title>
                              <label style='font-weight:bold;margin-right:5px'>Total Bills:</label>
                              <span>${{info.amountOwed}}</span>
                           </template>
                           <div class="bills">
                              <div class="info">
                                 <p>
                                 You have been billed for replacement of the items below. If you have the items, please return them
                                 and we will remove the replacement bills. If you pay for an item and find it within 90 days,
                                 you may be refunded the replacement amount.
                                 </p>
                                  <h3>Replacement option:</h3>
                                 <p>
                                    If you would like to supply a replacement copy rather than paying the bill, please contact the Library.
                                    The Library reserves the right to refuse a replacement copy.
                                 </p>
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
                        <AccordionContent layout="narrow" borderWidth="0" id="fines">
                           <template v-slot:title>
                             <label style='font-weight:bold;margin-right:5px'>Total Fines:</label>
                             <span>${{totalFines}}</span>
                           </template>
                           <div class="fines">
                              <div class="info">
                                 <p>
                                    This is what you currently owe in overdue fines.
                                    <em>Fines will continuing accruing until the item is returned</em>.
                                 </p>
                                 <p>
                                    <a href="https://www.library.virginia.edu/policies/circulation/" target="_blank">
                                    Learn more about Library circulation and fines.
                                    </a>
                                 </p>
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
                        <h3>Payment Information</h3>
                        <div v-if="useSIS">
                           All bills must be paid using SIS.
                           <a target="_blank" href="https://sisuva.admin.virginia.edu/ihprd/signon.html">
                           Access the SIS system to pay now.</a>
                        </div>
                        <div v-else>
                           <div>
                              All fines must be paid at Clemons Library using cash for the exact amount or personal check.
                              We do not take credit cards or any online payments at this time.
                           </div>
                           <div class="addr">
                              <strong>Clemons Library</strong><br/>
                              164 McCormick Road<br/>
                              Charlottesville, VA<br/>
                              22904
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </template>
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import AccountActivities from "@/components/AccountActivities"
import AccordionContent from '@/components/AccordionContent'
import ChangePassword from '@/components/modals/ChangePassword'
export default {
   name: "account",
   data: function() {
      return {
         expandBilling: false
      };
   },
   components: {
      AccountActivities, AccordionContent, ChangePassword
   },
   computed: {
      ...mapState({
         info: state => state.user.accountInfo,
         lookingUp: state => state.user.lookingUp,
         bills: state => state.user.bills,
         ilsError: state => state.system.ilsError,
      }),
      ...mapGetters({
        hasAccountInfo: 'user/hasAccountInfo',
        totalFines:  'user/totalFines',
        itemsWithFines: 'user/itemsWithFines',
        canChangePassword: 'user/canChangePassword',
        useSIS:  'user/useSIS',
        isSignedIn: 'user/isSignedIn',
      }),
      isBillOwed() {
         let amtStr = this.info['amountOwed']
         return parseFloat(amtStr) > 0
      },
   },
   methods: {
   },
   created() {
      if ( this.isSignedIn ) {
         this.$store.dispatch("user/getAccountInfo")
         this.$store.dispatch("user/getBillDetails")
         this.$analytics.trigger('Navigation', 'MY_ACCOUNT', "My Information")
      }
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
.no-leo {
   margin: 5px 00px;
}
.leo-address {
   margin: 20px 0;
}
.leo-address label {
   margin-right: 10px;
   font-weight: 500;
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
  margin-bottom: 0;
}
.status-info {
   margin: 15px 0;
}
.outstanding-bill {
   margin-top: 15px;
}
.fines-head {
   font-weight: bold;
   border-bottom: 1px solid var(--uvalib-brand-blue);
   margin-bottom: 5px;
   @apply --h2;
}
.fines-content {
   margin: 5px 0;
}
.fines-content label {
   font-weight: bold;
   margin-right: 5px;
}
.accordion {
  margin-left: 15px;
}
div.bills, div.fines {
   margin-bottom: 0px;
   padding: 10px;
   display: inline-block;
}
div.bill, div.fine {
   margin: 10px 0;
   padding: 5px;
   border: 1px solid var(--uvalib-grey);
   border-radius: 5px;
}
table td {
   padding: 0 5px;
}
td.label {
   text-align: right;
   font-weight: bold;
}
div.notes {
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
.payment h3 {
   border-bottom: 1px solid var(--uvalib-brand-blue);
}
.payment b {
   display: inline-block;
   margin-bottom: 10px;
}
.addr {
   padding: 5px 15px;
   margin-top: 10px;
}
.standing-info {
    font-size: 1em;
    font-weight: bold;
    text-align: center;
    padding: 10px;
    margin: 15px 0;
    border-radius: 5px;
    color: var(--uvalib-text);
    background-color: var(--uvalib-red-lightest);
}
.password {
   margin-top: 15px;
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
.info h3 {
   font-size: 1em;
   margin: 10px 0 5px 0;
}
.info  p {
   margin: 0 0 5px 0;
}
</style>
