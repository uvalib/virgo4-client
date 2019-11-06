<template>
   <div class="availability-wrapper">
      <span class="label">Availability</span>
      <V4Select :selections="options" v-bind:attached="false" 
         background="var(--color-primary-blue)" color="white" 
         v-model="globalAvailability"/>
   </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'
import V4Select from "@/components/V4Select"
export default {
   components: {
      V4Select
   },
   computed: {
      ...mapFields('filters',[
         'globalAvailability',
      ]),
      options() {
         return [
            {id: "any", name: "Any"},
            {id: "online", name: "Online"},
            {id: "shelf", name: "On Shelf"},
         ]
      }
   },
   watch: {
      globalAvailability () {
         this.$store.dispatch("searchAllPools")
      }
   }
}
</script>

<style scoped>
#app span.pure-button.pure-button-primary.avail{
   padding: 3px 8px;
   font-size: 0.9em;
   display: flex;
   margin: 2px 4px;
   flex-flow: row nowrap;
   align-items: center;
}
span.pure-button.avail i {
   margin-left: 10px;
}
.availability-wrapper {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   background: var(--color-pale-blue);
   color: white;
   border-radius: 5px;
   margin: 0;
   padding: 0.5em 0.5em;
   justify-content: space-between;
}
.label {
   font-weight: bold;
   margin-right: 0.5em;
}
input[type=radio] {
   margin: 0 5px 0 15px;
}
</style>
