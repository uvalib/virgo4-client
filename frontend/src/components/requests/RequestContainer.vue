<template>
   <div id="active-panel" ref="activePanel" >
      <component v-bind:is="requests.activePanel" />
      <V4Button mode="tertiary" v-if="showReset()" class="reset" @click="reset" v-html="resetLabel()"></V4Button>
      <p class="error" v-if="requests.alertText" >{{requests.alertText}}</p>
   </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields';
import { mapGetters } from "vuex";
import OptionsPanel from './panels/OptionsPanel'
import SignInPanel from './panels/SignInPanel'
import PlaceHoldPanel from './panels/PlaceHoldPanel';
import PDAPanel from './panels/PDAPanel';
import AeonPanel from './panels/AeonPanel';
import ScanPanel from './panels/ScanPanel';
import VideoReservePanel from './panels/VideoReservePanel';
import ConfirmationPanel from './panels/ConfirmationPanel';

export default {
   props: {
      titleId: String,
   },
   components: {OptionsPanel, SignInPanel, PlaceHoldPanel, PDAPanel, ConfirmationPanel, AeonPanel,ScanPanel, VideoReservePanel},

   computed: {
      ...mapFields(['requests', 'item/availability' ]),
      ...mapGetters({
         isSignedIn: 'user/isSignedIn',
         isAdmin: 'user/isAdmin',
         restoredPanel: 'restore/activeRequest',
         findOption: "requests/findOption",
      }),

   },
   mounted() {
      this.$store.commit('requests/reset')
      this.restore()
   },
   methods: {
      restore(){
         let restoredPanel = this.$store.state.restore.activeRequest
         if (restoredPanel) {
            this.requests.activePanel = restoredPanel
            let optionSettings = this.findOption(restoredPanel)
            if (optionSettings){
               this.requests.activeOption = optionSettings
            } else {
               // selected option not found
               this.requests.alertText = "Sorry, the selected request type ("+restoredPanel.replace('Panel','')+") is not available for your account."
               this.requests.activePanel = 'OptionsPanel'
            }
            let requestPanel = this.$refs.activePanel
            requestPanel.scrollIntoView({behavior: 'smooth', block: 'center'})
            this.$store.commit("restore/clear")
         }
         if (!this.requests.activePanel){
            this.requests.activePanel = 'OptionsPanel'
         }
      },
      reset(){
         this.$store.commit('requests/reset')
         setTimeout( () => {
            let opts = document.getElementsByClassName("option-button")
            if (opts.length > 0) {
               opts[0].focus()
            }
         },150)
      },
      showReset(){
         // Don't show reset on first and last panel
         return !['OptionsPanel', 'PDAPanel'].includes(this.requests.activePanel)
      },
      resetLabel(){
            if (this.requests.activePanel == 'ConfirmationPanel'){
               return "Back"
            }else{
               return "Reset"
            }
      }
   },

}
</script>
<style lang="scss" scoped>
#active-panel {
   padding: 10px;
   position: relative;
   ::v-deep .v4-button {
      margin:0 !important;
   }
   .reset {
      position: absolute;
      right: 2vw;
      top: 2vw;
   }
   p.error {
      color: var(--uvalib-red-emergency);
   }
}
</style>