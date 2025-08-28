<template>
   <div class="ill-content" v-if="canMakeRequests" aria-live="polite">
      <h2>Availability</h2>
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <h3>Interlibrary Loan</h3>
            <template v-if="requestStore.activeRequest == 'none'">
               <div class="message">
                  This item is available with an Interlibrary Loan.
                  <a v-if="!system.isKiosk" href="https://www.library.virginia.edu/services/ils/ill" target="_blank" aria-describedby="new-window">Learn more about Interlibrary Loans.</a>
               </div>
               <VirgoButton @click="requestClicked" label="Request Interlibrary Loan" id="ill-request-btn"/>
            </template>

            <template v-if="requestStore.activeRequest != 'none' && !user.isSignedIn">
               <SignIn :embedded="true" />
               <VirgoButton severity="secondary" class="reset" @click="reset" label="Cancel"/>
            </template>
            <template v-else>
               <ILLBorrowItem v-if="requestStore.activeRequest == 'ILLBorrowItem'" :prefill="true" @canceled="cancelRequest" @submitted="requestSubmitted" />
               <ILLScanArticle v-if="requestStore.activeRequest == 'ILLScanArticle'" :prefill="true" @canceled="cancelRequest" @submitted="requestSubmitted" />
               <ILLBorrowAV v-if="requestStore.activeRequest == 'ILLBorrowAV'" :prefill="true" @canceled="cancelRequest" @submitted="requestSubmitted" />
            </template>

            <div  v-if="requestStore.activeRequest == 'SubmittedILL'" class="confirmation-panel">
            <h3>We have received your request.</h3>
            <dl>
               <dt>User ID:</dt>
               <dd>{{user.userId}}</dd>
               <dt>Item:</dt>
               <dd>{{submittedTitle}}</dd>
               <template v-if="submittedTitle">
                  <dt>Pickup Library:</dt>
                  <dd>{{submittedPickupLocation}}</dd>
               </template>
            </dl>
            <VirgoButton severity="secondary" class="reset" id="ill-reset" @click="reset" label="Back"/>
         </div>
         </div>
         <p class="error" v-if="requestStore.alertText" >{{requestStore.alertText}}</p>
      </div>
   </div>
</template>

<script setup>
import SignIn from "@/views/SignIn.vue"
import ILLBorrowItem from "../requests/standalone/ILLBorrowItem.vue"
import ILLBorrowAV from "../requests/standalone/ILLBorrowAV.vue"
import ILLScanArticle from "../requests/standalone/ILLScanArticle.vue"
import { useSystemStore } from "@/stores/system"
import { ref, computed, onMounted } from "vue"
import { useItemStore } from "@/stores/item"
import { useRequestStore } from "@/stores/request"
import { useRestoreStore } from "@/stores/restore"
import { useUserStore } from "@/stores/user"
import { setFocusID } from '@/utils'
import { useRoute } from "vue-router"

const system = useSystemStore()
const user = useUserStore()
const item = useItemStore()
const requestStore = useRequestStore()
const restore = useRestoreStore()
const route = useRoute()

const submittedTitle = ref("")
const submittedPickupLocation = ref("")

const canMakeRequests = computed(()=>{
   if ( user.noILSAccount) {
      return false
   }
   if ( item.generalFormat == "") {
      return false
   }
   return true
})

const reset = (() => {
   requestStore.resetData()
   setFocusID("ill-request-btn")
})

const requestSubmitted = (( data ) => {
   requestStore.activeRequest = 'SubmittedILL'
   submittedTitle.value = data.title
   submittedPickupLocation.value = data.pickup
   setFocusID("ill-reset")
})

const cancelRequest = (() => {
   requestStore.activeRequest = 'none'
   setFocusID("ill-request-btn")
})

const requestClicked = (() => {
   // NOTE: this is crrently specific to WorldCat. If other sources are added, this will need to be generalized
   let genTypeF = item.details.fields.find( bf => bf.name == "general_format")
   if (!genTypeF) {
      requestStore.alertText = "Sorry, this item is not available for an Interlibrary Loan request."
      return
   }

   let tgtForm = "ILLBorrowItem"
   if ( genTypeF.value == "ArtChap") {
      tgtForm = "ILLScanArticle"
   } else if ( genTypeF.value == "Music" || genTypeF.value == "Video") {
      tgtForm = "ILLBorrowAV"
   }

   requestStore.activeRequest = tgtForm
   if ( !user.isSignedIn ) {
      restore.setURL(route.fullPath)
      restore.setActiveRequest(tgtForm)
      restore.save()
   }
})

onMounted(()=>{
   let restoredPanel = restore.activeRequest
   if (restoredPanel) {
      requestStore.activeRequest = restoredPanel
      restore.clear()
   } else {
      requestStore.activeRequest = 'none'
   }
})
</script>

<style lang="scss" scoped>
.ill-content {
   margin: 0 0 20px 0;
   text-align: left;

   .reset {
      margin: 0 auto;
   }

   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: stretch;
      border-radius: 0.3rem;

      .gutter {
         flex: 0 0 17px;
         border-radius: 0.3rem  0 0 0.3rem;
         background-color:#BFE7F7;
      }
      .content {
         flex: 1;
         padding: 1rem;
         border: 1px solid $uva-grey-100;
         border-radius:  0 0.3rem  0.3rem 0;
         border-left: 0;
         h3 {
            font-size: 1.15em;
            padding-bottom: 1rem;
            border-bottom: 1px solid $uva-grey-100;
            margin: 0 0 1rem 0;
         }
         .message {
            padding: 0 0 15px 0;
            border-bottom: 1px solid $uva-grey-100;
            margin-bottom: 25px;
         }
      }
   }

   .confirmation-panel {
      text-align: center;
   }
   dl {
      margin-top: 15px;
      display: inline-grid;
      grid-template-columns: 1fr 1fr;
      grid-column-gap: 10px;
      width: 100%;
   }
   dt {
      font-weight: bold;
      text-align: right;
      padding: 4px 8px;
      white-space: nowrap;
      vertical-align: top;
   }
   dd {
      margin: 0;
      width: 100%;
      text-align: left;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      padding: 4px 0px;
   }

   div.request-content {
      border: 1px solid $uva-grey-100;
      margin-top: 25px;
      padding: 20px;
      position: relative;
      text-align: left;
   }

   .options-panel {
      text-align: center;
   }

   .desc {
      text-align: center;
      padding: 0;
      margin: 10px 0;
      font-size: 0.95em;
      font-weight: normal;
   }
}
@media only screen and (max-width: 700px) {
  .ill-content {
      position: relative;
      border-left: none;
      border-right: none;
  }
}
</style>
