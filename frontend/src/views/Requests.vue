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
               <h2>Holds</h2>
               <div class="request" v-for="(req,idx) in requests.holds" :key="idx">
                  <h3 class="title">{{req.title}}</h3>
                  <dl>
                     <dt>Status:</dt>
                     <dd>{{req.status}}</dd>
                     <dt>Position</dt>
                     <dd>{{req.queuePosition}} of {{req.queueLength}}</dd>
                     <dt>Date Placed:</dt>
                     <dd>{{formatDate(req.placedDate)}}</dd>
                     <dt>Current Location:</dt>
                     <dd>{{req.library}} {{req.currentLocation}}</dd>
                     <dt>Author:</dt>
                     <dd>{{req.author}}</dd>
                     <dt>Barcode:</dt>
                     <dd>{{req.barcode}}</dd>
                  </dl>
                  <p v-if="isDevServer">
                     <V4Button
                        mode="icon"
                        @click="deleteHold(req.id)"
                        aria-label="Delete this hold"
                        class="delete"
                     >
                        <i class="fas fa-trash"></i>
                     </V4Button>
                  </p>
               </div>
            </template>

            <template v-if="illiadRequests.length > 0">
               <h2>ILL Requests</h2>
               <div class="request" v-for="(req,idx) in illiadRequests" :key="idx">
                  <template v-if="req.requestType == 'Loan'">
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
                  </template>
                  <template v-else>
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
                        <dt>PDF Download:</dt>
                        <dd v-html="getDownloadLink(req)"></dd>
                     </dl>
                  </template>
               </div>
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
import AccountActivities from "@/components/AccountActivities";
export default {
   name: "requests",
   components: {
      AccountActivities
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
         return this.requests.illiad.filter( h=> h.transactionStatus != "Checked Out to Customer")
      }
   },
   methods: {
      formatDate(date) {
         return date.split("T")[0];
      },
      getDownloadLink(req) {
         let url = `https://uva.hosts.atlas-sys.com/LOGON/?Action=10&Form=75&Value=${req.transactionNumber}`;
         let icon = `<i style="margin-right:5px;" class="more fas fa-link"></i>`;
         return `<a href='${url}' target='_blank'>${icon}Download</a>`;
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

<style scoped>
.requests {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.request {
   font-size: 0.9em;
   color: #444;
   border-top: 1px solid #ccc;
   margin-bottom: 15px;
   padding-bottom: 0px;
}
.request .title {
   font-weight: bold;
}
.requests-content {
   width: 80%;
   margin: 0 auto;
   position: relative;
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
.none {
   text-align: center;
   font-size: 1.25em;
   margin-top: 35px;
}
.details {
   text-align: left;
}
dl {
   margin-top: 0;
   margin-left: 15px;
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
.delete {
   color: var(--uvalib-red);
}
</style>
