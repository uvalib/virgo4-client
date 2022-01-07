<template>
   <div class="ill">
      <div class="ill-content" v-if="canMakeRequests">
         <h2>Availability</h2>
         <div class="request-content">
            <div class="options-panel" v-if="requests.activePanel == 'OptionsPanel'">
               <V4Button mode="tertiary" @click="requestClicked">Request Item</V4Button>
               <p class="desc">Make an InterLibrary Loan request for this item.</p>
               <p class="desc"><a href="https://www.library.virginia.edu/services/ils/ill" target="_blank">Learn more about InterLibrary Loans.</a></p>
            </div>
            <SignInPanel v-if="requests.activePanel == 'SignInPanel'" :prefill="true" @canceled="cancelRequest" />
            <ILLBorrowItem v-if="requests.activePanel == 'ILLBorrowItem'" :prefill="true" @canceled="cancelRequest" />
            <ILLScanArticle v-if="requests.activePanel == 'ILLScanArticle'" :prefill="true" @canceled="cancelRequest" />
            <ILLBorrowAV v-if="requests.activePanel == 'ILLBorrowAV'" :prefill="true" @canceled="cancelRequest" />
            <p class="error" v-if="requests.alertText" >{{requests.alertText}}</p>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import SignInPanel from '../requests/panels/SignInPanel'
import ILLBorrowItem from '../requests/standalone/ILLBorrowItem'
import ILLBorrowAV from '../requests/standalone/ILLBorrowAV'
import ILLScanArticle from '../requests/standalone/ILLScanArticle'
export default {
   components: {
      SignInPanel, ILLBorrowItem, ILLScanArticle, ILLBorrowAV
   },
   computed: {
      ...mapFields(['requests']),
      ...mapState({
         details : state => state.item.details,
         noILSAccount: state => state.user.noILSAccount,
      }),
      ...mapGetters({
         isSignedIn: "user/isSignedIn",
         generalFormat: "item/generalFormat"
      }),
      canMakeRequests() {
         if ( this.noILSAccount) {
            return false
         }
         if ( this.generalFormat == "") {
            return false
         }
         return true
      },
   },
   methods: {
      cancelRequest() {
         this.requests.activePanel = 'OptionsPanel'
      },
      requestClicked() {
         // NOTE: this is crrently specific to WorldCat. If other sources are added, this will need to be generalized
         let genTypeF = this.details.basicFields.find( bf => bf.name == "general_format")
         if (!genTypeF) {
            this.requests.alertText = "Sorry, this item is not available for an InterLibrary Loan request."
            return
         }

         let tgtForm = "ILLBorrowItem"
         if ( genTypeF.value == "ArtChap") {
            tgtForm = "ILLScanArticle"
         } else if ( genTypeF.value == "Music" || genTypeF.value == "Video") {
            tgtForm = "ILLBorrowAV"
         }

         if ( this.isSignedIn ) {
            this.requests.activePanel = tgtForm
         } else {
            this.$store.commit('restore/setActiveRequest', tgtForm)
            this.requests.activePanel = "SignInPanel"
         }
      }
   },
   mounted() {
      let restoredPanel = this.$store.state.restore.activeRequest
      if (restoredPanel) {
         this.requests.activePanel = restoredPanel
         this.$store.commit("restore/clear")
      } else {
         this.requests.activePanel = 'OptionsPanel'
      }
   }
}
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
   .working {
      margin-bottom: 25px;
      text-align: center;
   }
}
.ill-content {
   margin: 0 0 20px 0;
   text-align: left;

   div.request-content {
      border: 1px solid var(--uvalib-grey-light);
      margin-top: 25px;
      box-shadow: $v4-box-shadow-light;
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
