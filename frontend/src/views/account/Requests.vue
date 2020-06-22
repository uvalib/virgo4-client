<template>
   <div class="requests">
      <h1>My Account</h1>
      <div class="requests-content">
         <AccountActivities />
         <div class="working" v-if="lookingUp">
            <V4Spinner message="Looking up requests..." />
         </div>
         <div class="details">
            <template v-if="requests.holds.length > 0">
               <AccordionContent
                     class="requests-accordion"
                     background="var(--uvalib-blue-alt-lightest)"
                     borderWidth="0 0 3px 0"
                     borderColor="var(--uvalib-blue-alt)"
                     id="ils-holds"
               >
                  <template v-slot:title><span class="section-title">UVA Holds</span></template>
                  <div class="request-list">
                     <div class="request" v-for="(req,idx) in requests.holds" :key="`ils-${idx}`">
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
                        <p  v-if="isDevServer">
                           <V4Button
                              mode="tertiary"
                              @click="deleteHold(req.id)"
                              :aria-label="`Delete hold on ${req.title}`"
                              class="delete"
                           >
                              Delete Hold
                           </V4Button>
                        </p>
                     </div>
                  </div>
               </AccordionContent>
            </template>

            <template v-if="illLoans.length > 0">
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

            <template v-if="digitalRequests.length > 0">
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
                           <dt>Call Number:</dt>
                           <dd>{{req.callNumber}}</dd>
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
               <div v-if="!lookingUp" class="none">You currently have no outstanding requests</div>
            </template>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex";
import { mapGetters } from "vuex";
import AccountActivities from "@/components/AccountActivities"
import AccordionContent from "@/components/AccordionContent"
export default {
   name: "requests",
   components: {
      AccountActivities,AccordionContent
   },
   computed: {
      ...mapState({
         requests: state => state.user.requests,
         lookingUp: state => state.user.lookingUp
      }),
      ...mapGetters({
         isDevServer: "system/isDevServer"
      }),
      illiadRequests() {
         return this.requests.illiad.filter( h=> h.transactionStatus != "Checked Out to Customer" && 
          h.transactionStatus != "Request Finished" && h.transactionStatus != "Delivered to Web" )
      },
      illLoans() {
         let out = []
         this.illiadRequests.forEach( r => {
            // console.log(`PT=${r.processType} RT=${r.requestType}`)
            if (r.processType=="Borrowing" && r.requestType=="Loan") {
               out.push(r)
               // console.log("ADD LOAN")
            }
         })
         return out
      },
      digitalRequests() {
         let out = []
         this.illiadRequests.forEach( r => {
            // console.log(`PT=${r.processType} RT=${r.requestType} DT=${r.documentType}`)
            if ((r.processType=="Borrowing" && r.requestType=="Article") ||
                ((r.processType=="Doc Del" || r.processType=="DocDel") && r.requestType=="Article") ||
                ((r.processType=="Doc Del" || r.processType=="DocDel") && r.requestType=="Article" && r.documentType=="Collab")) {
               out.push(r)
               // console.log("ADD DIGITAL")
            }
         })
         return out
      }
   },
   methods: {
      formatDate(date) {
         return date.split("T")[0];
      },
      hasNoRequests() {
         return !(this.requests.illiad || this.requests.holds);
      },
      deleteHold(id) {
         this.$store.dispatch("requests/deleteHold", id);
      }
   },
   created() {
      this.$store.dispatch("system/getConfig");
      this.$store.dispatch("user/getRequests");
      setTimeout(() => {
         document.getElementById("requests-submenu").focus();
      }, 250);
   }
};
</script>

<style lang="scss" scoped>

.requests-content {
   width: 80%;
   margin: 0 auto;
   position: relative;
   text-align: left;

   .requests-accordion {
      margin-bottom: 20px;
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
   div.requests-content {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.requests-content {
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
