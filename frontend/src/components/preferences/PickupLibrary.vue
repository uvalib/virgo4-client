<template>
  <div class="pickup-options">
    <h2>Pickup Library</h2>
    <p>Select the library where you would like items delivered. </p>
    <p>Current pickup library:
      <select v-model="pickupLibrary" @change="update">
        <option disabled selected hidden value="">Select a Location</option>
        <option v-bind:key="lib" v-for="lib in pickupLibraries">{{lib}}</option>
      </select>
    </p>
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
        'ALDERMAN', 'CLEMONS', 'DARDEN', 'FINE-ARTS',
        'HEALTHSCI', 'JAG', 'LAW', 'MATH', 'MUSIC', 'PHYSICS', 'SCI-ENG'
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
<style scoped>
</style>