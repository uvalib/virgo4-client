<template>
   <div class="availability">
      <div class="working" v-if="lookingUp" >
         <div>Loading...</div>
         <img src="../assets/spinner2.gif">
      </div>
      <template v-else>
         <h2 v-if="!lookingUp">Availability</h2>
         <table class="fields">
            <thead>
               <tr>
                  <th v-for="(column, idx) in availability.columns" :key="idx">
                     {{column}}
                  </th>
               </tr>
            </thead>

            <tr v-for="(holding,idx) in availability.holdings" :key="idx">
               <template v-for="(field) in holding.fields" >
                  <template v-if="field.visible" >
                     <!-- <td class="label">{{field.name}}:</td> -->
                     <td class="value">{{field.value}}</td>
                  </template>
               </template>
            </tr>
         </table>

      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   components: {
   },
   props: {
      titleId: String
   },
   data: function() {
      return {
         lookingUp: true,
         // found: false
      };
   },
   computed: {
      ...mapGetters({
         availability : 'item/availability'
      })
   },
   methods: {
   },
   created() {
      this.lookingUp = true
      this.$store.dispatch("item/getAvailability", this.titleId ).then(() => {
         this.lookingUp = false
      })
   }
}
</script>

<style scoped>
   h2 {
      color: var(--color-primary-orange)
   }
   table {
      border-collapse: collapse;
      width: 100%;
   }
   td, th {
      padding: 0.5rem;
      text-align: left;
   }
   tr {
      border: 1px solid black;
   }
</style>
