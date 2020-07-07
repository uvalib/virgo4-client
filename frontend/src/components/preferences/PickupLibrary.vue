<template>
  <div class="pickup-options pure-form">
    <h2>Pickup Location</h2>
    <p>
      This pickup location is where you will go to retrieve items you’ve requested from Ivy Stacks or are receiving as a result of a hold or a recall.
    </p>

    <p>
      IMPORTANT: Because of safety measures during COVID-19, pickup locations may be limited. Options may change over the course of the semester — for the most up-to-date information,
      <a target="_blank" href="https://www.library.virginia.edu/news/covid-19">read our FAQ about Library services during COVID-19</a>.
    </p>
    <label for="pickup-sel">Preferred pickup location:
      <V4Select id="pickup-sel" v-model="pickupLibrary" :selections="pickupLibraries"
        pad="5px 10px"
        @changed="update"
      />
      <!--
        <option disabled selected hidden value="">Select a Location</option>
        <option v-bind:key="lib" v-for="lib in pickupLibraries">{{lib}}</option>
        -->
    </label>

  </div>
</template>
<script>
import { mapFields } from 'vuex-map-fields';

export default {
  data: function() {
    return { pickupLibraries: [
      {
        id: 'CLEMONS',
        name: 'Clemons'
      }

    ]
  }},
  computed: {
    ...mapFields({
        pickupLibrary: 'preferences.pickupLibrary',
    }),
   //pickupLibraries(){
   //  // Clemons is the only pickup library at launch
   //  return [//...(this.$store.getters['user/canUseLEO'] ? ['LEO'] : []),
   //    'CLEMONS',
   //    //'DARDEN', 'FINE-ARTS',
   //    //'HEALTHSCI', 'JAG', 'LAW', 'LEO', 'MATH', 'MUSIC', 'PHYSICS', 'SCI-ENG'
   //  ]
   //}

  },
  methods: {
    update() {
      this.$store.dispatch("preferences/savePreferences")
    },
  },

}
</script>
<style lang="scss" scoped>
.pickup-options {
  text-align: left;
  h2 {
    margin:5px 0 10px 0;
  }
  label {
    font-weight: 500;
    margin-top: 30px;
  }
  #pickup-sel{
    width: fit-content;
    display: inline-flex;
    margin-bottom: 30px;
  }
}
</style>