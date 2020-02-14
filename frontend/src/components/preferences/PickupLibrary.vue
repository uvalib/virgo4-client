<template>
  <div class="pickup-options">
    <h2>Pickup Library</h2>
    <p>Select the library where you would like held books delivered. </p>
    <p>Current pickup library:
      <select v-model="pickupLibrary" @change="update">
        <option disabled value="">None</option>
        <option v-bind:key="lib" v-for="lib in pickupLibraries">{{lib}}</option>
      </select>
    </p>
  </div>
</template>
<script>
//import { mapGetters } from "vuex"
//import { mapState } from "vuex"
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
   // ...mapGetters({
   //   isPoolExcluded: "preferences/isPoolExcluded",
   //   isTargetPool: "preferences/isTargetPool",
   //   pools: "pools/sortedList",
   // })
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