<template>
   <div class="availability-wrapper">
      <span class="label">Availability&nbsp;</span>
      <span @click="availClicked('any')" class="pure-button pure-button-primary avail">
         <span class="label">Any</span>
         <i v-if="isChecked('any')" class="far fa-check-circle"></i>
         <i v-else class="far fa-circle"></i>
      </span>
      <span @click="availClicked('online')" class="pure-button pure-button-primary avail">
         <span class="label">Online</span>
         <i v-if="isChecked('online')" class="far fa-check-circle"></i>
         <i v-else class="far fa-circle"></i>
      </span>
      <span @click="availClicked('shelf')"  class="pure-button pure-button-primary avail">
         <span class="label">On Shelf</span>
         <i v-if="isChecked('shelf')" class="far fa-check-circle"></i>
         <i v-else class="far fa-circle"></i>
      </span>
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
      isChecked(avail) {
         return this.globalAvailability == avail
      },
      availClicked( availType ) {
         this.$store.commit("filters/setGlobalAvailability", availType)  
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
   flex-flow: row wrap;
   align-items: center;
   background: var(--color-pale-blue);
   color: white;
   border-radius: 5px;
   margin: 10px 0 5px 0;
   padding: 4px 4px 4px 10px;
}
.label {
   font-weight: bold;
}
input[type=radio] {
   margin: 0 5px 0 15px;
}
</style>
