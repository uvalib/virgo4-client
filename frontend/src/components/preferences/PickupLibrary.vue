<template>
  <div class="pickup-options pure-form">
    <h2>Pickup Library</h2>
    <p>Select the library where you would like items delivered. </p>
    <label for="pickup-sel">Current pickup library:
      <select id="pickup-sel" v-model="pickupLibrary" @change="update">
        <option disabled selected hidden value="">Select a Location</option>
        <option v-bind:key="lib" v-for="lib in pickupLibraries">{{lib}}</option>
      </select>
    </label>
  </div>
</template>
<script>
import { mapFields } from 'vuex-map-fields';

export default {
  computed: {
    ...mapFields({
        pickupLibrary: 'preferences.pickupLibrary',
    }),
    pickupLibraries(){
      return [...(this.$store.getters['user/canUseLEO'] ? ['LEO'] : []),
        'CLEMONS',
        //'DARDEN', 'FINE-ARTS',
        //'HEALTHSCI', 'JAG', 'LAW', 'LEO', 'MATH', 'MUSIC', 'PHYSICS', 'SCI-ENG'
      ]
    }

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
   }
   select {
      width: 100%;
      font-weight: normal;
      margin-top: 5px;
   }
}
</style>