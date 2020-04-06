<template>
  <div class="pickup-options">
    <h2>Pickup Library</h2>
    <p>Select the library where you would like held books delivered. </p>
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
  data: ()=> {
    return {
    pickupLibraries: ['ALDERMAN', 'CLEMONS', 'DARDEN', 'FINE-ARTS',
    'HEALTHSCI', 'JAG', 'LAW', 'LEO', 'MATH', 'MUSIC', 'PHYSICS', 'SCI-ENG'
    ]}
  },
  computed: {
    ...mapFields({
        pickupLibrary: 'preferences.pickupLibrary',
    }),
  },
    methods: {
      update() {
        this.$store.dispatch("preferences/savePreferences")
      },
  }
}
</script>
<style scoped>
</style>