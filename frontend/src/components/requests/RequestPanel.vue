<template>
  <div id='stepper' >
    <div class="active-step" >
      <component v-bind:is="activeComponent()" />
    </div>
    <p class="error" v-if="requests.alertText" >{{requests.alertText}}</p>
    <div class="controls">
      <button v-if="currentStep != 0 && !isLastStep()" @click="previousStep()">Previous</button>
      <button v-if="!isLastStep()" @click="nextStep()" >Next</button>
    </div>
  </div>

</template>
<script>
import { mapFields } from 'vuex-map-fields';
import { mapGetters } from "vuex";
import SignInStep from './steps/SignInStep'
import PlaceHoldStep from './steps/PlaceHoldStep';
import SummaryStep from './steps/SummaryStep';
import PickupLibrary from '@/components/preferences/PickupLibrary'

export default {
  props: {
      titleId: String,
   },
   data: function() {
     return {
      currentStep: 0,
     }
   },
  components: {PickupLibrary, PlaceHoldStep, SummaryStep, SignInStep},

  computed: {
    ...mapFields(['requests', 'item/availability' ]),
    ...mapGetters({
        defaultPickupLibrary: 'preferences/pickupLibrary',
        isSignedIn: 'user/isSignedIn',
        isAdmin: 'user/isAdmin',
        totalSteps: 'requests/totalSteps'
    }),

  },
  created() {
    this.$store.commit('requests/reset')
  },
  methods: {
    activeComponent(){
      let active = this.requests.steps[this.currentStep]
      if(active == 'SignInStep' && this.isSignedIn) {
        this.nextStep()
        active = this.requests.steps[this.currentStep]
      }
      return active
    },
    isLastStep(){
      return this.currentStep == (this.totalSteps - 1)
    },
    nextStep(){
      this.currentStep += 1
    },
    previousStep(){
      this.currentStep -= 1
    }
  }
}
</script>
<style scoped>
#stepper {
    border: 1px solid black;
    padding: 1em;
}
.controls {
  padding: 1em;
}
p.error {
   color: var(--uvalib-red-emergency);
}
</style>