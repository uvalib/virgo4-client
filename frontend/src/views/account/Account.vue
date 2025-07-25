<template>
   <div class="account">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="account information"/>
      <AccountActivities v-if="userStore.isSignedIn"/>
      <div class="working" v-if="!expandBilling && userStore.lookingUp" >
         <V4Spinner message="Looking up account details..."/>
      </div>
      <AccountRequestForm v-if="userStore.noILSAccount == true" />
      <div v-if="userStore.hasAccountInfo" class="groups">
         <div class="account-group">
            <h3>Virgo</h3>
            <dl>
               <dt>Name</dt>
               <dd>{{info.displayName}} <span v-if="info.sirsiProfile && info.sirsiProfile.preferredName">({{info.sirsiProfile.preferredName}})</span></dd>
               <dt>Login ID</dt>
               <dd>{{info.id}}</dd>
               <dt>Email</dt>
               <dd>{{info.email}}</dd>
               <dt>Profile Type</dt>
               <dd>{{info.profile}}</dd>
            </dl>

            <div class="status-info">
               <dl v-if="info.standing != 'OK'">
                  <dt>Standing</dt>
                  <dd>{{info.standing}}</dd>
               </dl>

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

               <div class="button-bar">
                  <UpdateContactInfo />
                  <ChangePassword v-if="userStore.canChangePassword" />
               </div>

               <div v-if="info.sirsiUnavailable" class="standing-info">
                  User information is currently unavailable. Please try again later.
               </div>
               <div v-if="systemStore.ilsError" class="standing-info">{{systemStore.ilsError}}</div>

               <div v-if="isBillOwed || userStore.totalFines>0" class="outstanding-bill">
                  <h3 class="fines-head">Billing</h3>
                  <div class="fines-content">
                     <div class="notes">
                        Your account currently has an outstanding balance.
                        Click the totals below to see more details.
                     </div>
                     <div v-if="isBillOwed">
                        <AccordionContent borderWidth="0" id="bills">
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
                                 <h4>Replacement option</h4>
                                 <div>
                                    If you would like to supply a replacement copy rather than paying the bill, please contact the Library.
                                    The Library reserves the right to refuse a replacement copy.
                                 </div>
                              </div>
                              <div class="bill" v-for="(bill,idx) in userStore.bills" :key="idx">
                                 <table>
                                    <tbody>
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
                                       <tr><td/><td>{{bill.item.barcode}}</td></tr>
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        </AccordionContent>
                     </div>

                     <div v-if="userStore.totalFines>0">
                        <AccordionContent borderWidth="0" id="fines">
                           <template v-slot:title>
                              <label style='font-weight:bold;margin-right:5px'>Total Fines:</label>
                              <span>${{userStore.totalFines}}</span>
                           </template>
                           <div class="fines">
                              <div class="info">
                                 <p>
                                    This is what you currently owe in overdue fines.
                                    <em>Fines will continuing accruing until the item is returned</em>.
                                 </p>
                                 <p>
                                    <a href="https://www.library.virginia.edu/policies/circulation/" target="_blank" aria-describedby="new-window">
                                    Learn more about Library circulation and fines.
                                    </a>
                                 </p>
                              </div>
                              <div class="fine" v-for="(fine,idx) in userStore.itemsWithFines" :key="idx">
                                 <table>
                                    <tbody>
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
                                       <tr><td/><td>{{fine.barcode}}</td></tr>
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        </AccordionContent>
                     </div>

                     <div class="payment">
                        <h4>Payment Information</h4>
                        <div v-if="userStore.useSIS">
                           All bills must be paid using SIS.
                           <a target="_blank" href="https://sisuva.admin.virginia.edu/ihprd/signon.html">
                           Access the SIS system to pay now.</a>
                        </div>
                        <div v-else>
                           <div>
                              <p>
                                 <a href="https://pci.foc.virginia.edu/UVA_Library_Circulation" target="_blank" aria-describedby="new-window">The Library offers an online payment option</a>.
                                 You will need to enter the total amount billed to pay.
                              </p>
                              <p>
                                 To pay fines in person, visit Shannon Library. We can only accept cash for the exact amount or personal check.
                                 Please make the check out to <b>UVA Library</b>.<br/>
                                 To mail a check, send to:
                              </p>
                           </div>
                           <div class="addr">
                              <strong>Shannon Library</strong><br/>
                              P.O. Box 400113<br/>
                              160 McCormick Road<br/>
                              Charlottesville, VA<br/>
                              22904
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div class="account-group" v-if="userStore.canUseLEO">
            <h3>ILLiad</h3>
            <p class="sc" v-if="!userStore.hasIlliad">
               No ILLiad account found.<br/>
               To register <a target="_blank" aria-describedby="new-window" href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=80" aria-label="Illiad registration">
               please complete this form. <i class='fal fa-external-link-alt'></i></a>
            </p>
            <p v-else-if="userStore.illiadBlocked" class="standing-info">
               Your ILLiad account is blocked.<br/>
               Please contact <a href="mailto:4leo@virginia.edu">4leo@virginia.edu</a> for assistance.
            </p>
            <dl v-if="userStore.leoLocation">
               <dt>LEO Delivery Location:</dt>
               <dd>
                  {{userStore.leoLocation}}
               </dd>
               <p>
                  <a target="_blank" aria-describedby="new-window" href="https://uva.hosts.atlas-sys.com/Logon" aria-label="Illiad account">Visit ILLiad</a> to change your LEO delivery location.
               </p>
            </dl>
         </div>

         <div class="account-group">
            <h3>Special Collections</h3>
            <p class="sc">
               <a target="_blank" aria-describedby="new-window" href="https://virginia.aeon.atlas-sys.com/logon" aria-label="Special Collections Account" >
                  Make Small Special Collections requests
               </a>
               using your online researcher account.
            </p>
         </div>

      </div>
   </div>
</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountRequestForm from "@/components/account/AccountRequestForm.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import AccordionContent from "@/components/AccordionContent.vue"
import ChangePassword from "@/components/modals/ChangePassword.vue"
import UpdateContactInfo from "@/components/modals/UpdateContactInfo.vue"
import { ref, computed, onMounted } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import analytics from '@/analytics'

const userStore = useUserStore()
const systemStore = useSystemStore()
const expandBilling = ref(false)
const isBillOwed = computed(() => {
   let amtStr = userStore.accountInfo['amountOwed']
   return parseFloat(amtStr) > 0
})
const info = computed(() => {
   return userStore.accountInfo
})

onMounted(() =>{
   if ( userStore.isSignedIn ) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "My Information")
   }
})
</script>
<style lang="scss" scoped>
@media only screen and (min-width: 768px) {
   div.account  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.account  {
      width: 95%;
   }
   .standing-info {
      width: 90%;
   }
}
.account {
   position: relative;
   margin: 0 auto;
   text-align: left;
   padding-bottom: 50px;
   h4 {
      margin: 0 0 5px 0;
      text-decoration: underline;
   }
}
.groups {
   display: flex;
   flex-direction: column;
   gap: 25px;
}
.account-group {
   border: 1px solid $uva-grey-100;
   margin: 0;
   h3 {
      padding: 12px;
      margin: 0;
      background: $uva-grey-200;
      border-bottom: 1px solid $uva-grey-100;
   }
   dl {
      margin: 25px;
      dt {
         font-weight: bold;
         margin-bottom: 5px;
      }
      dd {
         margin: 0 0 20px 10px;

      }
   }
   .button-bar {
      padding: 0 15px;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-end;
      align-items: flex-start;
      gap: 5px;
   }
   .fines-head {
      font-weight: bold;
      border-bottom: 1px solid $uva-grey;
      border-top: 1px solid $uva-grey;
      margin-bottom: 5px;
   }
   .fines-content {
      margin: 20px;
   }
   .fines-content label {
      font-weight: bold;
      margin-right: 5px;
   }
   p.sc {
      margin:20px;
   }
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
   .standing {
      margin-left: 20px;
   }
}
.outstanding-bill {
   margin-top: 15px;
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
   border: 1px solid $uva-grey;
   border-radius: 0.3rem;
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
.payment {
   margin-top: 35px;
 }
.payment h3 {
   border-bottom: 1px solid $uva-brand-blue;
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
    margin: 15px 20px;
    border-radius: 0.3rem;
    color: $uva-text-color-dark;
    background-color: $uva-red-100;
}

</style>
