<template>
   <div class="availability">
      <div class="working" v-if="availability.searching" >
         <V4Spinner message="Loading Availability..."/>
      </div>
      <template v-else>
         <template v-if="availability.items.length">
            <h2>Availability</h2>

            <RequestContainer v-if="isAdmin" :titleId="titleId" />

            <table class="fields">
               <thead>
                  <tr>
                     <th v-for="(column, idx) in availability.columns" :key="idx">
                        {{column}}
                     </th>
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
               </tr>
            </table>
         </template>
      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import AvailabilityNotice from "@/components/popovers/AvailabilityNotice"
import RequestContainer from "@/components/requests/RequestContainer"
export default {
  components: {
    AvailabilityNotice, RequestContainer
  },
   props: {
      titleId: String
   },
   computed: {
      ...mapGetters({
         availability: 'item/availability',
         isAdmin: 'user/isAdmin',
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
   padding: 0.5em;
   text-align: left;
   font-size: 1rem;
}
@media only screen and (max-width: 768px) {
  td, th {
     padding: 0.5em 0.1em;
     font-size: 0.9rem;
  }
}
tr {
   border: 1px solid black;
}
</style>
