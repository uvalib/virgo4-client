<template>
   <div class="requests">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="request information"/>
      <AccountActivities  v-if="userStore.isSignedIn"/>
      <div class="details" v-if="userStore.isSignedIn">
         <template v-if="!userStore.noILSAccount && !userStore.isBarred">
            <h2>Make a New Request</h2>
            <div v-if="!userStore.isUVA">
               <!-- No ILL requests for community borrowers  -->
            </div>
            <div v-else-if="userStore.isHSLUser" class="subcontent">
               <a :href="systemStore.hsILLiadURL" target="_blank">Health Sciences ILLiad Request<i style="margin-left:5px;" class="fal fa-external-link-alt"></i></a>
            </div>
            <div v-else class="subcontent buttons">
               <V4Button mode="primary" @click="instructionalScanClick">Instructional Scanning</V4Button>
               <V4Button mode="primary" @click="illBorrowClick">ILL Borrow Item</V4Button>
               <V4Button mode="primary" @click="illBorrowAVClick">ILL Borrow A/V</V4Button>
               <V4Button mode="primary" @click="illScanClick">ILL Scan Chapter/Article</V4Button>
            </div>
            <div class="subcontent links">
               <a href="https://www.library.virginia.edu/services/purchase-requests/" target="_blank">Purchase Request<i style="margin-left:5px;" class="fal fa-external-link-alt"></i></a>
            </div>

            <template v-if="request">
               <ILLBorrowAV v-if="request == 'ILLBorrowAV'" @canceled="cancelRequest" @submitted="requestSubmitted" class="form-panel"/>
               <ILLBorrowItem v-if="request == 'ILLBorrowItem'" @canceled="cancelRequest" @submitted="requestSubmitted" class="form-panel"/>
               <ILLScanArticle v-if="request == 'ILLScanArticle'" @canceled="cancelRequest" @submitted="requestSubmitted" class="form-panel"/>
               <InstructionalScan v-if="request == 'InstructionalScan'" @canceled="cancelRequest" @submitted="requestSubmitted" class="form-panel"/>
            </template>

            <h2>Outstanding Requests</h2>
         </template>
         <div class="subcontent">
            <div class="working" v-if="userStore.lookingUp && userStore.isSignedIn">
               <V4Spinner message="Looking up requests..." />
            </div>
            <template v-if="userStore.lookingUp == false && systemStore.ilsError">
               <div class="ils-error">{{systemStore.ilsError}}</div>
            </template>
            <template v-if="userStore.lookingUp == false && !systemStore.ilsError && userStore.requests.holds.length > 0">
               <AccordionContent
                     class="requests-accordion"
                     background="var(--uvalib-blue-alt-lightest)"
                     borderWidth="0 0 3px 0"
                     borderColor="var(--uvalib-blue-alt)"
                     id="ils-holds"
               >
                  <template v-slot:title><span class="section-title">UVA Holds</span></template>
                  <div class="request-list">
                     <div class="request" v-for="(req,idx) in userStore.requests.holds" :key="`ils-${idx}`">
                        <h3 class="title">{{req.title}}</h3>
                        <dl>
                           <template v-if="req.author">
                              <dt>Author:</dt>
                              <dd>{{req.author}}</dd>
                           </template>
                           <dt>Call Number:</dt>
                           <dd>{{req.callNumber}}</dd>
                           <dt>Hold Status:</dt>
                           <dd>{{req.status}}</dd>
                           <dt>Deliver To:</dt>
                           <dd>{{req.pickupLocation}}</dd>
                           <dt>Date Placed:</dt>
                           <dd>{{formatDate(req.placedDate)}}</dd>
                           <dt>Position:</dt>
                           <dd>{{req.queuePosition}} of {{req.queueLength}}</dd>
                           <dt>Item Status:</dt>
                           <dd>{{req.itemStatus}}</dd>
                        </dl>
                        <p>
                           <V4Button :id="'showCancelModal-' + req.id" mode="tertiary" @click="showCancelHold(req)">Cancel Request</V4Button>
                        </p>
                     </div>
                  </div>
               </AccordionContent>
            </template>

            <template v-if="userStore.lookingUp == false && illLoans.length > 0">
               <AccordionContent
                     class="requests-accordion"
                     background="var(--uvalib-blue-alt-lightest)"
                     borderWidth="0 0 3px 0"
                     borderColor="var(--uvalib-blue-alt)"
                     id="ill-holds"
               >
                  <template v-slot:title><span class="section-title">ILL Loan</span></template>
                  <div class="request-list">
                     <div class="request" v-for="(req,idx) in illLoans" :key="`ill-loan-${idx}`">
                        <h3 class="title">{{req.loanTitle}}</h3>
                        <dl>
                           <dt>Author:</dt>
                           <dd>{{req.loanAuthor}}</dd>
                           <dt>Call Number:</dt>
                           <dd>{{req.callNumber}}</dd>
                           <dt>Transaction Number:</dt>
                           <dd>{{req.transactionNumber}}</dd>
                           <dt>Date Requested:</dt>
                           <dd>{{formatDate(req.creationDate)}}</dd>
                           <dt>Status:</dt>
                           <dd>{{req.transactionStatus}}</dd>
                        </dl>
                     </div>
                  </div>
               </AccordionContent>
            </template>

            <template v-if="userStore.lookingUp == false && digitalRequests.length > 0">
               <AccordionContent
                     class="requests-accordion"
                     background="var(--uvalib-blue-alt-lightest)"
                     borderWidth="0 0 3px 0"
                     borderColor="var(--uvalib-blue-alt)"
                     id="ill-holds"
               >
                  <template v-slot:title><span class="section-title">Digital Delivery Requests</span></template>
                  <div class="request-list">
                     <div class="request" v-for="(req,idx) in digitalRequests" :key="`digital-${idx}`">
                        <h3 class="title">{{req.photoJournalTitle}}</h3>
                        <dl>
                           <dt>Author:</dt>
                           <dd>{{req.photoArticleAuthor}}</dd>
                           <template v-if="req.photoArticleTitle">
                              <dt>Article Title:</dt>
                              <dd>{{req.photoArticleTitle}}</dd>
                           </template>
                           <template v-if="req.photoJournalVolume">
                              <dt>Volume:</dt>
                              <dd>{{req.photoJournalVolume}}</dd>
                           </template>
                           <template v-if="req.photoJournalVolume">
                              <dt>Issue:</dt>
                              <dd>{{req.photoJournalIssue}}</dd>
                           </template>
                           <template v-if="req.photoJournalMonth">
                              <dt>Month:</dt>
                              <dd>{{req.photoJournalMonth}}</dd>
                           </template>
                           <template v-if="req.photoIssueYear">
                              <dt>Year:</dt>
                              <dd>{{req.photoIssueYear}}</dd>
                           </template>
                           <template v-if="req.photoJournalInclusivePages">
                              <dt>Pages:</dt>
                              <dd>{{req.photoJournalInclusivePages}}</dd>
                           </template>
                           <template v-if="req.callNumber">
                              <dt>Call Number:</dt>
                              <dd>{{req.callNumber}}</dd>
                           </template>
                           <dt>Transaction Number:</dt>
                           <dd>{{req.transactionNumber}}</dd>
                           <dt>Date Requested:</dt>
                           <dd>{{formatDate(req.creationDate)}}</dd>
                           <dt>Status:</dt>
                           <dd>{{req.transactionStatus}}</dd>
                           <template v-if="req.transactionStatus == 'Delivered to Web'">
                              <dt>PDF Download:</dt>
                              <dd v-html="getDownloadLink(req)"></dd>
                           </template>
                        </dl>
                     </div>
                  </div>
               </AccordionContent>
            </template>
            <template v-if="hasNoRequests()">
               <div v-if="!userStore.lookingUp" class="none">You currently have no outstanding requests</div>
            </template>
         </div>
      </div>
   </div>

   <V4Modal ref="cancelHoldModal" class="cancel"
      title="Cancel Hold?"
      :buttonID="'showCancelModal-' + (reqToCancel ? reqToCancel.id : '')"
      buttonMode="tertiary"
      id="cancelHoldModal"
      >
      <template #content>
         <dl>
            <dt>Title:</dt>
            <dd>{{ reqToCancel.title }}</dd>
            <dt>Call Number:</dt>
            <dd>{{reqToCancel.callNumber}}</dd>
            <dt>Hold Status:</dt>
            <dd>{{reqToCancel.status}}</dd>
            <dt>Date Placed:</dt>
            <dd>{{formatDate(reqToCancel.placedDate)}}</dd>
         </dl>

         <template v-if="reqToCancel.cancellable">
         <p>Are you sure you want to cancel this request?</p>
         </template>
         <template v-else>
            <p>
               This hold request is already in progress and can not be cancelled automatically.
            </p>
            <p>
               By continuing, an email will be sent to begin the cancellation process.
            </p>
            <FormKit type="form" :actions="false" id="cancelHoldForm" @submit="cancelHold()">
               <FormKit label="Confirmation Email" id="confirmationEmail" validate="email" type="email" v-model="reqToCancel.confirmationEmail" />
            </FormKit>
         </template>
      </template>
      <template #controls>
         <V4Button id="cancelHoldBack" mode="tertiary" @click="hideCancelHold">
            Back
         </V4Button>

         <V4Button type="submit" id="cancelHoldButton" mode="primary" @click="cancelHold()">
            Cancel Request
         </V4Button>

      </template>
   </V4Modal>
</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import ILLBorrowAV from "@/components/requests/standalone/ILLBorrowAV.vue"
import ILLBorrowItem from "@/components/requests/standalone/ILLBorrowItem.vue"
import ILLScanArticle from "@/components/requests/standalone/ILLScanArticle.vue"
import InstructionalScan from "@/components/requests/standalone/InstructionalScan.vue"
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import { useRequestStore } from "@/stores/request"
import { ref, computed, onMounted } from 'vue'
import analytics from '@/analytics'
import AccordionContent from "@/components/AccordionContent.vue"


const systemStore = useSystemStore()
const userStore = useUserStore()
const requestStore = useRequestStore()

const request = ref("")
const cancelHoldModal = ref(null)
const reqToCancel = ref(null)

const illiadRequests = computed(()=>{
   return userStore.requests.illiad.filter( h=> h.transactionStatus != "Checked Out to Customer" &&
      h.transactionStatus != "Request Finished" && h.transactionStatus != "Delivered to Web" )
})

const illLoans = computed(()=>{
   let out = []
   illiadRequests.value.forEach( r => {
      // console.log(`PT=${r.processType} RT=${r.requestType}`)
      if (r.processType=="Borrowing" && r.requestType=="Loan") {
         out.push(r)
         // console.log("ADD LOAN")
      }
   })
   return out
})

const digitalRequests = computed(()=>{
   let out = []
   illiadRequests.value.forEach( r => {
      // console.log(`PT=${r.processType} RT=${r.requestType} DT=${r.documentType}`)
      if ((r.processType=="Borrowing" && r.requestType=="Article") ||
            ((r.processType=="Doc Del" || r.processType=="DocDel") && r.requestType=="Article") ||
            ((r.processType=="Doc Del" || r.processType=="DocDel") && r.requestType=="Article" && r.documentType=="Collab")) {
         out.push(r)
         // console.log("ADD DIGITAL")
      }
   })
   return out
})

function instructionalScanClick() {
   request.value = "InstructionalScan"
}
function illBorrowClick() {
   request.value = "ILLBorrowItem"
}
function illBorrowAVClick() {
   request.value = "ILLBorrowAV"
}
function illScanClick() {
   request.value = "ILLScanArticle"
}
function cancelRequest() {
   request.value = ""
}
function requestSubmitted() {
   if ( systemStore.hasError ) {
      return
   }

   request.value = ""
   userStore.getRequests()
   systemStore.setMessage("Your request has been submitted.")
   window.scrollTo(0,0)
}
function formatDate(date) {
   return date.split("T")[0];
}
function hasNoRequests() {
   return illLoans.value.length == 0 && userStore.requests.holds.length == 0 && digitalRequests.value == 0 && systemStore.ilsError == ""
}
function cancelHold() {

   let form = document.getElementById('cancelHoldForm')
   if (form && !form.checkValidity()) {
      if (form.reportValidity) {
         form.reportValidity();
      }
      return false
   }
   if( reqToCancel.value.cancellable ){
      analytics.trigger('Requests', 'REQUEST_CANCEL_SUBMITTED', "sirsi")
   }else{
      analytics.trigger('Requests', 'REQUEST_CANCEL_SUBMITTED', "email")
   }
   requestStore.cancelHold(reqToCancel.value)
   hideCancelHold()
}
async function showCancelHold(req) {
   reqToCancel.value = req
   reqToCancel.value.confirmationEmail = userStore.singleEmail.toLowerCase()
   await cancelHoldModal.value.show()
   if( reqToCancel.value.cancellable ){
      analytics.trigger('Requests', 'REQUEST_CANCEL_STARTED', "sirsi")
   }else{
      analytics.trigger('Requests', 'REQUEST_CANCEL_STARTED', "email")
   }
   let ele = document.getElementById('cancelHoldButton')
   if (ele) {
      ele.focus()
   }
}
function hideCancelHold(){
   reqToCancel.value = null
   cancelHoldModal.value.hide()
}

onMounted(() =>{
   if ( userStore.isSignedIn) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Requests")
      userStore.getRequests()
   }
})
</script>

<style lang="scss" scoped>

.requests {
   min-height: 400px;
   position: relative;
   color: var(--color-primary-text);
   width: 80%;
   margin: 2vw auto 0 auto;
   position: relative;
   text-align: left;

   h2 {
      margin: 10px 0 5px 0;
      font-size: 1.25em;
      border-bottom: 1px solid;
   }
   .form-panel {
      border: 1px solid var(--uvalib-blue-alt);
   }
   .subcontent {
      margin-bottom: 0px;
      padding: 10px;
   }
   .subcontent.links {
      padding-top: 10px;
   }

   .subcontent.buttons {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-content: center;
      .v4-button {
         margin:0 10px 10px 0;
         min-width: 275px;
         width: 40%;
      }
   }

   .ils-error {
      font-size: 1em;
      font-weight: bold;
      text-align: center;
      padding: 10px;
      margin: 15px 0;
      border-radius: 5px;
      color: var(--uvalib-text);
      background-color: var(--uvalib-red-lightest);
   }

   .working {
      text-align: center;
   }

   .requests-accordion {
      margin-bottom: 20px;
      font-size: 0.85em;
   }

   p {
      margin: 5px 0;
      padding: 0;
      text-align: right;
   }
   .none {
      text-align: center;
      font-size: 1.25em;
      margin-top: 35px;
   }

   .section-title {
      font-weight: bold;
      font-size:1.15em;
      padding: 5px;
   }

   .request-list {
      background-color: var(--uvalib-grey-lightest);
      border: 1px solid var(--uvalib-grey-light);

      .request {
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
      }
   }
}

@media only screen and (min-width: 768px) {
   div.requests {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.requests {
      width: 95%;
   }
}


dl {
   margin: 0 0 0 10px;
   display: inline-grid;
   grid-template-columns: max-content 2fr;
   grid-column-gap: 15px;
}
dt {
   font-weight: bold;
   text-align: right;
}
dd {
   margin: 0 0 10px 0;
}
</style>
