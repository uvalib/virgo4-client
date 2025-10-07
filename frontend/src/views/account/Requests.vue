<template>
   <div class="requests">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="request information"/>
      <AccountActivities  v-if="userStore.isSignedIn"/>
      <div class="details" v-if="userStore.isSignedIn">
         <template v-if="userStore.canUseILLiad && !userStore.noILSAccount && !userStore.isBarred">
            <h3>Make a New Request</h3>
            <div v-if="userStore.isHSLUser" class="subcontent">
               <a :href="systemStore.hsILLiadURL" target="_blank">Health Sciences ILLiad Request<i aria-hidden="true" class="link-icon fal fa-external-link-alt"></i></a>
            </div>
            <div v-else-if="userStore.illiadBlocked" class="subcontent">
               <ILLiadMessages />
            </div>
            <div v-else class="subcontent">
               <div class="instructions"> <!-- add  v-if="request == ''" to hide instructions when a form is selected -->
                  <div>
                     To request an item for pickup, click the &quot;<strong>Request item</strong>&quot; button in the item's record and follow the prompts. This option will not be available for all items.
                  </div>
                  <div class="errors" v-if="requestStore.otherRequestsDisabled || requestStore.isRemediateDisabled">
                  <div class="reason ils-error" v-if="requestStore.otherRequestsDisabled">
                     You have reached the <a href="https://library.virginia.edu/services/ils/iss#limit " target="_blank">
                        limit<i aria-hidden="true" class="link-icon fal fa-external-link-alt"></i>
                     </a>
                     of {{ requestStore.requestStats.otherRequestsLimit }} active borrow and/or scan requests.
                  </div>
                  <div class="reason ils-error" v-if="requestStore.isRemediateDisabled">
                     You have reached the limit of {{ requestStore.requestStats.remediationLimit }} active remediation requests.
                  </div>
               </div>
                  <h4>For course materials</h4>
                  <div>
                     <ul>
                        <li>
                           <a href="#" @click="instructionalScanClick">Make an instructional scanning request</a>
                           for course materials or for materials posted to Canvas. </li>
                        <li>
                           <a href="#" @click="pdfRemediationClick">Make a PDF remediation request</a>
                           for updating or improving the accessibility of an older scan made from sources available in the UVA Library collection.
                        </li>
                     </ul>
                  </div>
                  <h4>For research materials</h4>
                  <ul>
                     <li>
                        <a href="#" @click="researchScanClick">Make a research scanning request</a>
                        for materials supporting your personal research.
                     </li>
                  </ul>
                  <h4>For items UVA doesn't own</h4>
                  <ul>
                     <li>Submit an interlibrary loan (ILL) request to borrow an item from another institution. Please note that items supplied from ILL are for personal research only (<strong>not</strong> for course materials) and are not eligible for the Library's accessibility remediation service.
                        <ul>
                           <li><a href="#" @click="illBorrowClick">ILL Borrow Item</a></li>
                           <li><a href="#" @click="illBorrowAVClick">ILL Borrow A/V</a></li>
                           <li><a href="#" @click="illScanClick">ILL Scan Chapter/Article</a></li>
                        </ul>
                     </li>
                     <li>
                        <a href="https://www.library.virginia.edu/services/purchase-requests/" target="_blank" aria-describedby="new-window">
                           Recommend a purchase<i aria-hidden="true" class="link-icon fal fa-external-link-alt"></i>
                        </a>
                     </li>
                  </ul>
               </div>
               <div class="helper">
                  Many of these actions can also be made directly from an item page in Virgo.<br/>
                  <a href="https://library.virginia.edu/services/request" target="_blank" aria-describedby="new-window">
                     Learn more about how to make a request in Virgo.<i aria-hidden="true" class="link-icon fal fa-external-link-alt"></i>
                  </a>
               </div>
            </div>

            <template v-if="request">
               <ILLBorrowAV v-if="request == 'ILLBorrowAV'" @canceled="cancelRequest" @submitted="requestSubmitted" />
               <ILLBorrowItem v-if="request == 'ILLBorrowItem'" @canceled="cancelRequest" @submitted="requestSubmitted"/>
               <ILLScanArticle v-if="request == 'ILLScanArticle'" @canceled="cancelRequest" @submitted="requestSubmitted"/>
               <InstructionalScan v-if="request == 'InstructionalScan'" @canceled="cancelRequest" @submitted="requestSubmitted"/>
               <ResearchScan v-if="request == 'ResearchScan'" @canceled="cancelRequest" @submitted="requestSubmitted"/>
               <PDFRemediation v-if="request == 'PDFRemediation'" @canceled="cancelRequest" @submitted="requestSubmitted"/>
            </template>
            <h3 class="gap">Outstanding Requests</h3>
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
                     :expanded="$route.hash == '#ils-holds'"
                     class="requests-accordion"
                     borderWidth="0 0 3px 0"
                     borderColor="#007BAC"
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
                           <dd>{{$formatDate(req.placedDate)}}</dd>
                           <dt>Position:</dt>
                           <dd>{{req.queuePosition}} of {{req.queueLength}}</dd>
                           <dt>Item Status:</dt>
                           <dd>{{req.itemStatus}}</dd>
                        </dl>
                        <p>
                           <VirgoButton ref="canceltrigger" severity="secondary" @click="showCancelHold(req, idx)" label="Cancel Request"/>
                        </p>
                     </div>
                  </div>
               </AccordionContent>
            </template>

            <template v-if="userStore.lookingUp == false && illLoans.length > 0">
               <AccordionContent
                     class="requests-accordion"
                     borderWidth="0 0 3px 0"
                     borderColor="#007BAC"
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
                           <dd>{{$formatDate(req.creationDate)}}</dd>
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
                     borderWidth="0 0 3px 0"
                     borderColor="#007BAC"
                     id="ill-holds"
               >
                  <template v-slot:title><span class="section-title">Digital Delivery Requests</span></template>
                  <div class="request-list">
                     <div class="request" v-for="(req,idx) in digitalRequests" :key="`digital-${idx}`">
                        <h3 class="title">{{req.photoJournalTitle}}</h3>
                        <dl>
                           <template v-if="req.photoArticleAuthor">
                              <dt>Author:</dt>
                              <dd>{{req.photoArticleAuthor}}</dd>
                              </template>
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
                           <dd>{{$formatDate(req.creationDate)}}</dd>
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

   <Dialog v-model:visible="showCancelModal" :modal="true" position="top" header="Cancel Hold" @hide="hideCancelHold" :draggable="false">
      <div class="cancel-panel">
         <dl>
            <dt>Title:</dt>
            <dd>{{ reqToCancel.title }}</dd>
            <dt>Call Number:</dt>
            <dd>{{reqToCancel.callNumber}}</dd>
            <dt>Hold Status:</dt>
            <dd>{{reqToCancel.status}}</dd>
            <dt>Date Placed:</dt>
            <dd>{{$formatDate(reqToCancel.placedDate)}}</dd>
         </dl>
         <FormKit type="form" :actions="false" id="cancelHoldForm" @submit="cancelHold" ref="cancelform">
            <p v-if="reqToCancel.cancellable">Are you sure you want to cancel this request?</p>
            <template v-else>
               <p>This hold request is already in progress and can not be cancelled automatically.</p>
               <p>By continuing, an email will be sent to begin the cancellation process.</p>
               <FormKit label="Confirmation Email" validation="required|email" type="email" v-model="reqToCancel.confirmationEmail" />
            </template>
         </FormKit>
      </div>
      <template #footer>
         <VirgoButton severity="secondary" @click="hideCancelHold" label="Back"/>
         <VirgoButton @click="cancelform.node.submit()" label="Cancel Request"/>
      </template>
   </Dialog>
</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import ILLBorrowAV from "@/components/requests/standalone/ILLBorrowAV.vue"
import ILLBorrowItem from "@/components/requests/standalone/ILLBorrowItem.vue"
import ILLScanArticle from "@/components/requests/standalone/ILLScanArticle.vue"
import InstructionalScan from "@/components/requests/standalone/InstructionalScan.vue"
import ResearchScan from "@/components/requests/standalone/ResearchScan.vue"
import PDFRemediation from "@/components/requests/standalone/PDFRemediation.vue"
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import { useRequestStore } from "@/stores/request"
import { ref, computed, onMounted } from 'vue'
import analytics from '@/analytics'
import AccordionContent from "@/components/AccordionContent.vue"
import Dialog from 'primevue/dialog'
import { setFocusID } from '@/utils'
import ILLiadMessages from "@/components/ILLiadMessages.vue"

const systemStore = useSystemStore()
const userStore = useUserStore()
const requestStore = useRequestStore()

const request = ref("")
const showCancelModal = ref(false)
const canceltrigger = ref()
const cancelform = ref()
const cancelButtonIdx = ref(-1)
const reqToCancel = ref(null)

const illiadRequests = computed(()=>{
   return userStore.requests.illiad.filter( h=> h.transactionStatus != "Checked Out to Customer" &&
      h.transactionStatus != "Request Finished" && h.transactionStatus != "Delivered to Web" )
})

const illLoans = computed(()=>{
   let out = []
   illiadRequests.value.forEach( r => {
      if (r.processType=="Borrowing" && r.requestType=="Loan") {
         out.push(r)
      }
   })
   return out
})

const digitalRequests = computed(()=>{
   let out = []
   illiadRequests.value.forEach( r => {
      if ((r.processType=="Borrowing" && r.requestType=="Article") ||
            ((r.processType=="Doc Del" || r.processType=="DocDel") && r.requestType=="Article") ||
            ((r.processType=="Doc Del" || r.processType=="DocDel") && r.requestType=="Article" && r.documentType=="Instructional")) {
         out.push(r)
      }
   })
   return out
})

const researchScanClick = ((event) => {
   event.preventDefault()
   request.value = "ResearchScan"
})

const instructionalScanClick = ((event) => {
   event.preventDefault()
   request.value = "InstructionalScan"
})

const illBorrowClick = ((event) => {
   event.preventDefault()
   request.value = "ILLBorrowItem"
})

const illBorrowAVClick = ((event) => {
   event.preventDefault()
   request.value = "ILLBorrowAV"
})

const illScanClick = ((event) => {
   event.preventDefault()
   request.value = "ILLScanArticle"
})

const pdfRemediationClick = ((event) => {
   event.preventDefault()
   request.value = "PDFRemediation"
})

const cancelRequest = (() => {
   request.value = ""
})

const requestSubmitted = (() => {
   if ( systemStore.hasError ) {
      return
   }

   request.value = ""
   userStore.getRequests()
   systemStore.setMessage("Your request has been submitted.")
   window.scrollTo(0,0)
})

const hasNoRequests = (() => {
   return illLoans.value.length == 0 && userStore.requests.holds.length == 0 && digitalRequests.value == 0 && systemStore.ilsError == ""
})

const cancelHold = (() => {
   if ( reqToCancel.value.cancellable ){
      analytics.trigger('Requests', 'REQUEST_CANCEL_SUBMITTED', "sirsi")
   } else {
      analytics.trigger('Requests', 'REQUEST_CANCEL_SUBMITTED', "email")
   }
   requestStore.cancelHold(reqToCancel.value)
   hideCancelHold()
})

const showCancelHold = ((req, reqIndex) => {
   reqToCancel.value = req
   reqToCancel.value.confirmationEmail = userStore.singleEmail.toLowerCase()
   showCancelModal.value = true
   cancelButtonIdx.value = reqIndex
   if ( reqToCancel.value.cancellable ){
      analytics.trigger('Requests', 'REQUEST_CANCEL_STARTED', "sirsi")
   } else {
      analytics.trigger('Requests', 'REQUEST_CANCEL_STARTED', "email")
   }
   setFocusID('cancelHoldButton')
})

const hideCancelHold = (() => {
   reqToCancel.value = null
   showCancelModal.value = false
   canceltrigger.value[cancelButtonIdx.value].$el.focus()
})

onMounted(() =>{
   if ( userStore.isSignedIn) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Requests")
      userStore.getRequests()

      // This data is used to disable the request buttons based upon active requests per user
      requestStore.getStandaloneRequestUsage()
   }
})
</script>

<style lang="scss" scoped>
.regional-alert{
   padding: 20px 10px 0 10px;
}
.requests {
   min-height: 400px;
   position: relative;
   margin: 0 auto;
   position: relative;
   text-align: left;
   padding-bottom: 75px;

   a {
      font-weight: bold;
      i.link-icon {
         margin-left: 5px !important;
      }
   }

   h3 {
      margin: 10px 0 5px 0;
      font-size: 1.25em;
      border-bottom: 1px solid;
   }
   h3.gap {
      margin: 25px 0 5px 0;
   }
   .subcontent {
      margin-bottom: 0px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      .errors {
         display: flex;
         flex-direction: column;
         gap: 10px;
         margin-top: 20px;
      }
      .instructions {
         h4 {
            margin-bottom: 10px;
         }
         ul {
            margin: 10px 0;
         }
         .p-button.p-component.p-button-link {
            padding: 0;
            :deep(span.p-button-label) {
               font-weight: bold;
            }
         }
         .p-button.p-component.p-button-link:disabled {
            opacity: 1;
            color: $uva-grey-A;
         }
      }
      .buttons {
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-start;
         gap: 10px;
      }
      a {
         margin-top: 20px;
      }
   }

   .ils-error {
      font-size: 1em;
      font-weight: bold;
      text-align: center;
      padding: 10px;
      margin: 15px 0;
      border-radius: 0.3rem;
      color: $uva-text-color-dark;
      background-color: $uva-red-100;
   }
   .reason.ils-error {
      margin: 0;
      a {
         text-decoration: underline;
         &:hover {
            text-decoration: none;
         }
      }
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
   .subcontent {
      .buttons button {
         flex-grow: 1;
      }
   }
}

dl {
   margin: 10px 0 0 10px;
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
