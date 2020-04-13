<template>
  <div >
    <div class="active-panel" >
      <div v-if="requests.activePanel != 'OptionsPanel'" class="reset pure-button"
        @click="reset"
        >Cancel</div>

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
import SummaryPanel from './panels/SummaryPanel';

export default {
  props: {
      titleId: String,
   },
  components: {OptionsPanel, PlaceHoldPanel, SummaryPanel, SignInPanel},

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
    this.requests.activePanel = 'OptionsPanel'
  },
  methods: {
    reset(){
      this.$store.commit('requests/reset')
      this.requests.activePanel = 'OptionsPanel'

    }
  }
}
</script>
<style scoped>
.active-panel {
  padding: 2vw;
  border: 1px solid black;
  position: relative;
}
.reset {
  position: absolute;
  right: 2vw;
  bottom: 2vw;
}
p.error {
   color: var(--uvalib-red-emergency);
}
</style>