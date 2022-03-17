<template>
   <div class="ill">
      <div class="ill-content" v-if="canMakeRequests">
         <h2>Availability</h2>
         <div class="request-content">
            <div class="options-panel" v-if="requests.activePanel == 'OptionsPanel'">
               <V4Button mode="tertiary" @click="requestClicked">Request Item</V4Button>
               <p class="desc">Make an Interlibrary Loan request for this item.</p>
               <p class="desc"><a href="https://www.library.virginia.edu/services/ils/ill" target="_blank">Learn more about Interlibrary Loans.</a></p>
            </div>
            <SignInPanel v-if="requests.activePanel == 'SignInPanel'" :prefill="true" @canceled="cancelRequest" />
            <ILLBorrowItem v-if="requests.activePanel == 'ILLBorrowItem'" :prefill="true" @canceled="cancelRequest" @submitted="requestSubmitted" />
            <ILLScanArticle v-if="requests.activePanel == 'ILLScanArticle'" :prefill="true" @canceled="cancelRequest" @submitted="requestSubmitted" />
            <ILLBorrowAV v-if="requests.activePanel == 'ILLBorrowAV'" :prefill="true" @canceled="cancelRequest" @submitted="requestSubmitted" />
            <div  v-if="requests.activePanel == 'SubmittedILL'" class="confirmation-panel">
               <h3>We have received your request.</h3>
               <dl>
                  <dt>User ID:</dt>
                  <dd>{{userId}}</dd>
                  <dt>Item:</dt>
                  <dd>{{submittedTitle}}</dd>
                  <template v-if="submittedTitle">
                     <dt>Pickup Library:</dt>
                     <dd>{{submittedPickupLocation}}</dd>
                  </template>
               </dl>
               <V4Button mode="tertiary" class="reset" id="ill-reset" @click="reset">Back</V4Button>
            </div>
            <p class="error" v-if="requests.alertText" >{{requests.alertText}}</p>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import { mapFields } from "vuex-map-fields"
import SignInPanel from "../requests/panels/SignInPanel.vue"
import ILLBorrowItem from "../requests/standalone/ILLBorrowItem.vue"
import ILLBorrowAV from "../requests/standalone/ILLBorrowAV.vue"
import ILLScanArticle from "../requests/standalone/ILLScanArticle.vue"
export default {
   data: function()  {
      return {
         submittedTitle: "",
         submittedPickupLocation: "",
      }
   },
   components: {
      SignInPanel, ILLBorrowItem, ILLScanArticle, ILLBorrowAV
   },
   computed: {
      ...mapFields(['requests']),
      ...mapState({
         details : state => state.item.details,
         noILSAccount: state => state.user.noILSAccount,
         userId: state => state.user.signedInUser
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
      reset(){
         this.$store.commit('requests/reset')
         setTimeout( () => {
            let opts = document.getElementById("option-button")
            if (opts.length > 0) {
               opts[0].focus()
            }
         },150)
      },
      requestSubmitted( data ) {
         this.requests.activePanel = 'SubmittedILL'
         this.submittedTitle = data.title
         this.submittedPickupLocation = data.pickup
         this.$nextTick( () => {
            let btn = document.getElementById("ill-reset")
            if (btn) {
               btn.focus()
            }
         })
      },
      cancelRequest() {
         this.requests.activePanel = 'OptionsPanel'
      },
      requestClicked() {
         // NOTE: this is crrently specific to WorldCat. If other sources are added, this will need to be generalized
         let genTypeF = this.details.basicFields.find( bf => bf.name == "general_format")
         if (!genTypeF) {
            this.requests.alertText = "Sorry, this item is not available for an Interlibrary Loan request."
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
   h3 {
      color: var(--color-primary-orange);
      text-align: center;
      margin: 0;
   }
   .working {
      margin-bottom: 25px;
      text-align: center;
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
