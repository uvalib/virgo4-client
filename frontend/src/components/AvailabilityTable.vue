<template>
   <div class="availability">
      <div class="working" v-if="availability.searching" >
         <V4Spinner message="Loading Availability..."/>
      </div>
      <p class="error" v-if="availability.error" v-html="availability.error"> </p>
      <template v-else>
         <template v-if="availability.items || availability.request_options">
            <h2>Availability</h2>
            <div class="availability-content">
               <RequestContainer :titleId="titleId" />

               <table class="fields" v-if="availability.items && availability.items.length > 0">
                  <thead>
                     <tr>
                        <th v-for="(column, idx) in availability.columns" :key="idx">
                           {{column}}
                        </th>
                     </tr>
                  </thead>

                  <tr v-for="(item,idx) in availability.items" :key="idx">
                     <td class="value" v-for="(field, id) in visibleFields(item)" :key="id">
                        <template v-if="id == visibleFields(item).length-1 && item.notice">
                           <AvailabilityNotice :label="formatValue(field.value)" :message="item.notice" />
                        </template>
                        <template v-else>
                           {{formatValue(field.value)}}
                        </template>
                     </td>
                  </tr>
               </table>
            </div>
         </template>
      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import AvailabilityNotice from "@/components/disclosures/AvailabilityNotice"
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
         isDevServer: 'system/isDevServer',
      }),
   },
   methods: {
      formatValue(val) {
         if ( val == "On Shelf" ) {
            return "On Shelf Now"
         }
         return val
      },
      visibleFields: function(item) {
         if (!item.fields) {
            return []
         }
         return item.fields.filter(h => h.visible)
      }
   },
   created() {
      this.$store.dispatch("item/getAvailability", this.titleId )
   }
}
</script>
<style lang="scss" scoped>
h2 {
   color: var(--color-primary-orange)
}
.availability-content {
   border: 1px solid var(--uvalib-grey);
   margin: 0 0 10vh 0;
   table {
      width: 100%;
      font-weight: normal;
      text-align: left;
   }
   table td {
      padding: 4px 5px;
      border-top: 1px solid var(--uvalib-grey-light);
   }
   table th {
      padding: 4px 5px;
      background: var(--uvalib-grey-lightest);
      border-top: 1px solid var(--uvalib-grey);
      border-bottom: 1px solid var(--uvalib-grey);
   }
}
@media only screen and (max-width: 700px) {
  td, th {
     font-size: 2.5vw;
     word-break: break-word;
  }
  .availability-content {
   width: 100vw;
   position: relative;
   left: calc(-50vw + 50% );
   border-left: none;
   border-right: none;
  }
}
</style>
