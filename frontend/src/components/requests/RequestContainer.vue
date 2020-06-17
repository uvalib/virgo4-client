<template>
  <div >
    <div class="active-panel">

      <V4Button mode="tertiary" v-if="showReset(requests.activePanel)" class="reset" @click="reset">Reset</V4Button>
      <component v-bind:is="requests.activePanel" />

      <p class="error" v-if="requests.alertText" >{{requests.alertText}}</p>
    </div>
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
import ConfirmationPanel from './panels/ConfirmationPanel';

export default {
  props: {
      titleId: String,
   },
  components: {OptionsPanel, SignInPanel, PlaceHoldPanel, PDAPanel, ConfirmationPanel, AeonPanel},

  computed: {
    ...mapFields(['requests', 'item/availability' ]),
    ...mapGetters({
        defaultPickupLibrary: 'preferences/pickupLibrary',
        isSignedIn: 'user/isSignedIn',
        isAdmin: 'user/isAdmin',
    }),

  },
  created() {
    this.$store.commit('requests/reset')
    if (!this.requests.activePanel){
      this.requests.activePanel = 'OptionsPanel'
    }
  },
  methods: {
    reset(){
      this.$store.commit('requests/reset')
    },
    showReset(panel){
      // Don't show reset on first and last panel
      return !['ConfirmationPanel', 'OptionsPanel'].includes(panel)
    }
  },
}
</script>
<style lang="scss" scoped>
.active-panel {
   padding: 15px;
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