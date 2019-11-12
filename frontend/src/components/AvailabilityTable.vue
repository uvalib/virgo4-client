<template>
   <div class="availability">
      <div class="working" v-if="availability.searching" >
         <p>Loading Availability...</p>
         <img src="../assets/spinner2.gif">
      </div>
      <template v-if="availability.items.length">
         <h2>Availability</h2>
         <table class="fields">
            <thead>
               <tr>
                  <th v-for="(column, idx) in availability.columns" :key="idx">
                     {{column}}
                  </th>
               </tr>
            </thead>

            <tr v-for="(item,idx) in availability.items" :key="idx">
               <td class="value" v-for="(field, id) in visibleFields(item)" :key="id">
                  {{field.value}}
               </td>
            </tr>
         </table>

      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      titleId: String
   },
   computed: {
      ...mapGetters({
         availability : 'item/availability'
      }),
   },
   methods: {
      visibleFields: function(item) {
         return item.fields.filter(h => h.visible)
      }
   },
   created() {
      this.$store.dispatch("item/getAvailability", this.titleId )
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
