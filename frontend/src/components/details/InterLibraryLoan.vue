<template>
   <div class="ill">
      <div class="ill-content" v-if="canMakeRequests">
         <h2>Availability</h2>
         <div class="request-content">
            <div class="options-panel" v-if="requestStore.activePanel == 'OptionsPanel'">
               <VirgoButton severity="secondary" @click="requestClicked" label="Request Item"/>
               <p class="desc">Make an Interlibrary Loan request for this item.</p>
               <p class="desc"><a href="https://www.library.virginia.edu/services/ils/ill" target="_blank">Learn more about Interlibrary Loans.</a></p>
            </div>
            <SignInPanel v-if="requestStore.activePanel == 'SignInPanel'" :prefill="true" @canceled="cancelRequest" />
            <ILLBorrowItem v-if="requestStore.activePanel == 'ILLBorrowItem'" :prefill="true" @canceled="cancelRequest" @submitted="requestSubmitted" />
            <ILLScanArticle v-if="requestStore.activePanel == 'ILLScanArticle'" :prefill="true" @canceled="cancelRequest" @submitted="requestSubmitted" />
            <ILLBorrowAV v-if="requestStore.activePanel == 'ILLBorrowAV'" :prefill="true" @canceled="cancelRequest" @submitted="requestSubmitted" />
            <div  v-if="requestStore.activePanel == 'SubmittedILL'" class="confirmation-panel">
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
            <p class="error" v-if="requestStore.alertText" >{{requestStore.alertText}}</p>
         </div>
      </div>
   </div>
</template>

<script setup>
import SignInPanel from "../requests/panels/SignInPanel.vue"
import ILLBorrowItem from "../requests/standalone/ILLBorrowItem.vue"
import ILLBorrowAV from "../requests/standalone/ILLBorrowAV.vue"
import ILLScanArticle from "../requests/standalone/ILLScanArticle.vue"
import { ref, computed, nextTick, onMounted } from "vue"
import { useItemStore } from "@/stores/item"
import { useRequestStore } from "@/stores/request"
import { useRestoreStore } from "@/stores/restore"
import { useUserStore } from "@/stores/user"
import { setFocusClass, setFocusID } from '@/utils'

const user = useUserStore()
const item = useItemStore()
const requestStore = useRequestStore()
const restore = useRestoreStore()

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

function reset(){
   requestStore.reset()
   setFocusClass("option-button")
}
function requestSubmitted( data ) {
   requestStore.activePanel = 'SubmittedILL'
   submittedTitle.value = data.title
   submittedPickupLocation.value = data.pickup
   setFocusID("ill-reset")
}
function cancelRequest() {
   requestStore.activePanel = 'OptionsPanel'
}
function requestClicked() {
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

   if ( user.isSignedIn ) {
      requestStore.activePanel = tgtForm
   } else {
      restore.setActiveRequest(tgtForm)
      requestStore.activePanel = "SignInPanel"
   }
}

onMounted(()=>{
   let restoredPanel = restore.activeRequest
   if (restoredPanel) {
      requestStore.activePanel = restoredPanel
      restore.clear()
   } else {
      requestStore.activePanel = 'OptionsPanel'
   }
})
</script>
<style lang="scss" scoped>
.ill {
   width: 95%;
   margin: 0 auto;

   h2 {
      color: var(--color-primary-orange);
      text-align: center;
      margin: 50px 0 30px 0;
   }
   h3 {
      color: var(--color-primary-orange);
      text-align: center;
      margin: 0;
   }
}
.ill-content {
   margin: 0 0 20px 0;
   text-align: left;
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
      border: 1px solid var(--uvalib-grey-light);
      margin-top: 25px;
      box-shadow: var(--uvalib-box-shadow);
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
