<template>
   <div class="availability">
      <div class="working" v-if="availability.searching" >
         <V4Spinner message="Loading Availability..."/>
      </div>
      <template v-else>
         <template v-if="availability.items.length">
            <h2>Availability</h2>
            <p>{{alertText}}</p>
            <table class="fields">
               <thead>
                  <tr>
                     <th v-for="(column, idx) in availability.columns" :key="idx">
                        {{column}}
                     </th>
                     <th></th>
                     <th></th>
                  </tr>
               </thead>

               <tr v-for="(item,idx) in availability.items" :key="idx">
                  <td class="value" v-for="(field, id) in visibleFields(item)" :key="id">
                     {{field.value}}
                  </td>
                  <td>
                    <span class="notice" v-if="item.notice">
                       <AvailabilityNotice v-bind:message="item.notice" />
                    </span>
                  </td>
                  <td>
                    <PlaceHoldButton v-if="isAdmin"
                      :titleId="titleId" :barcode="item.barcode" />
                  </td>
               </tr>
            </table>
         </template>
      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import AvailabilityNotice from "@/components/popovers/AvailabilityNotice"
import V4Spinner from "@/components/V4Spinner"
import PlaceHoldButton from "@/components/requests/PlaceHoldButton"
export default {
  components: {
    AvailabilityNotice, V4Spinner, PlaceHoldButton
  },
   props: {
      titleId: String
   },
   computed: {
      ...mapGetters({
         availability: 'item/availability',
         isAdmin: 'user/isAdmin',
         alertText: 'requests/alertText',
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
   margin-bottom: 10vh;
}
td, th {
   padding: 0.5rem;
   text-align: left;
}
tr {
   border: 1px solid black;
}
</style>
