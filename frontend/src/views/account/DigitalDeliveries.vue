<template>
   <div class="digital-deliveries">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="digital deliveries"/>
      <AccountActivities v-if="userStore.isSignedIn"/>
      <V4Spinner v-if="userStore.lookingUp && userStore.isSignedIn" message="Working..." v-bind:overlay="true"/>
      <div class="details" v-if="userStore.isSignedIn">
         <div class="notice">
            PDF links are available for 30 days after delivery
            <a href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=60" target="_blank">
               <span>View Request History</span>
               <i class="link-icon fal fa-external-link-alt"></i>
            </a>
         </div>
         <template v-if="webDeliveries.length > 0">
            <div class="item" v-for="(co,idx) in webDeliveries" :key="idx">
               <h3 class="title">{{co.photoJournalTitle}}</h3>
               <dl>
                  <dt>Author:</dt>
                  <dd>{{co.photoArticleAuthor}}</dd>
                  <template v-if="co.photoArticleTitle">
                     <dt>Article Title:</dt>
                     <dd>{{co.photoArticleTitle}}</dd>
                  </template>
                  <template v-if="co.photoJournalVolume">
                     <dt>Volume:</dt>
                     <dd>{{co.photoJournalVolume}}</dd>
                  </template>
                  <template v-if="co.photoJournalVolume">
                     <dt>Issue:</dt>
                     <dd>{{co.photoJournalIssue}}</dd>
                  </template>
                  <template v-if="co.photoJournalMonth">
                     <dt>Month:</dt>
                     <dd>{{co.photoJournalMonth}}</dd>
                  </template>
                  <template v-if="co.photoIssueYear">
                     <dt>Year:</dt>
                     <dd>{{co.photoIssueYear}}</dd>
                  </template>
                  <template v-if="co.photoJournalInclusivePages">
                     <dt>Pages:</dt>
                     <dd>{{co.photoJournalInclusivePages}}</dd>
                  </template>
                  <template v-if="co.callNumber">
                     <dt>Call Number:</dt>
                     <dd>{{co.callNumber}}</dd>
                     </template>
                  <dt>Transaction Number:</dt>
                  <dd>{{co.transactionNumber}}</dd>
                  <dt>Date Requested:</dt>
                  <dd>{{$formatDate(co.creationDate)}}</dd>
                  <dt>PDF Download:</dt>
                  <dd v-html="getDownloadLink(co)"></dd>
               </dl>
            </div>
         </template>
         <template v-if="!userStore.lookingUp && webDeliveries.length == 0" >
            <div class="none">
               You currently have no digital deliveries available
            </div>
         </template>
      </div>
   </div>
</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import { useUserStore } from "@/stores/user"
import { computed, onMounted } from 'vue'
import analytics from '@/analytics'

const userStore = useUserStore()
const webDeliveries = computed(()=>{
   return userStore.requests.illiad.filter( h=> h.transactionStatus == "Delivered to Web")
})

function getDownloadLink(req) {
   let url = `https://uva.hosts.atlas-sys.com/LOGON/?Action=10&Form=75&Value=${req.transactionNumber}`
   let icon = `<i style="margin-right:5px;" class="more fas fa-link"></i>`
   let aria = `aria-label="download pdf for ${req.photoJournalTitle}"`
   return `<a class='pdf-link' href='${url}' ${aria} target='_blank'>${icon}Download</a>`;
}

onMounted(()=>{
   if ( userStore.isSignedIn) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Digital Deliveries")
   }
})

</script>

<style lang="scss" scoped>
div.notice {
   padding: 10px 10px;
   background: $uva-grey-200;
   margin: 0 0 15px 0;
   font-weight: bold;
   border: 1px solid $uva-grey;
   text-align: center;
   a {
      margin-top: 10px;
      display: block;
   }
}
.details {
   margin-bottom: 25px;
   h3 {
      margin: 0 0 10px 0;
      background: $uva-blue-alt-300;
      padding: 5px 10px;
      border-bottom: 1px solid $uva-blue-alt;
   }
   .item {
      font-size: 0.9em;
      color: #444;
      border: 1px solid $uva-grey;
      margin: 0 0 15px 0;
      padding: 0;
      dl {
         margin: 0 0 0 15px;
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
   }
}
.digital-deliveries {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   margin: 0 auto;
   position: relative;
   padding-bottom: 25px;
}
@media only screen and (min-width: 768px) {
   div.digital-deliveries {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.digital-deliveries  {
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
</style>
