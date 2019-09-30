<template>
   <div class="availability-wrapper">
      <span class="label">Availability: </span>
      <label for="any" class="pure-radio">
         <input id="any" v-model="globalAvailability" type="radio" name="availability" value="any" checked> 
         Any
      </label>
      <label for="online" class="pure-radio">
         <input id="online" v-model="globalAvailability" type="radio" name="availability" value="online"> 
         Online
      </label>
      <label for="shelf" class="pure-radio">
         <input id="shelf" v-model="globalAvailability" type="radio" name="availability" value="shelf"> 
         On Shelf
      </label>
   </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'
export default {
   computed: {
      ...mapFields('filters',[
         'globalAvailability',
      ])
   },
   watch: {
      globalAvailability () {
         this.$store.dispatch("searchAllPools")
      }
   },
   methods: {
   }
}
</script>

<style scoped>
div.availability-wrapper {
   text-align: left;
   margin: 10px 0;
}
.label {
   font-weight: bold;
}
input[type=radio] {
   margin: 0 5px 0 15px;
}
</style>
