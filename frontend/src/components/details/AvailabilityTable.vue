<template>
   <div class="availability">
      <div class="working" v-if="availability.searching" >
         <V4Spinner message="Loading Availability..."/>
      </div>
      <p class="error" v-if="availability.error" v-html="availability.error"> </p>
      <template v-else>
         <BoundWithItems v-if="hasBoundWithItems"/>

         <template v-if="hasItems() || hasRequestOptions">
            <h2>Availability</h2>
            <div class="ra-box ra-fiy">
               <strong>Please note that stacks browsing is not available because of building restrictions due to COVID-19.</strong>
               Physical materials must be requested. To make a request, sign in and click the "Request Item" button in an
               item record.
               <a href="https://www.library.virginia.edu/news/covid-19/" target="_blank">Learn more about Library resources during COVID-19</a>.
            </div>
            <div class="availability-content">
               <RequestContainer :titleId="titleId" />

               <table class="fields" v-if="hasItems()">
                  <thead>
                     <tr>
                        <th>Library</th>
                        <th>Current Location</th>
                        <th>Call Number</th>
                        <th>Barcode</th>
                     </tr>
                  </thead>

                  <tr v-for="(item,idx) in availability.items" :key="`val-${idx}`">
                     <td class="value">{{formatValue(item.library)}}</td>
                     <td class="value">{{formatValue(item.current_location)}}</td>
                     <td class="value">{{formatValue(item.call_number)}}</td>
                     <td class="value">
                        <template v-if="item.notice">
                           <AvailabilityNotice :label="formatValue(field.barcode)" :message="item.notice" />
                        </template>
                        <template v-else>
                           {{formatValue(item.barcode)}}
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
import BoundWithItems from "@/components/details/BoundWithItems"
export default {
  components: {
    AvailabilityNotice, RequestContainer, BoundWithItems
  },
   props: {
      titleId: String
   },
   computed: {
      ...mapGetters({
         availability: 'item/availability',
         isDevServer: 'system/isDevServer',
         hasRequestOptions: 'requests/hasRequestOptions',
         hasBoundWithItems: 'item/hasBoundWithItems'
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
      },
      hasItems(){
         return Array.isArray(this.availability.items) && this.availability.items.length > 0

      },
   },
   created() {
      this.$store.dispatch("item/getAvailability", this.titleId )
   }
}
</script>
<style lang="scss" scoped>
.availability {
   h2 {
      color: var(--color-primary-orange)
   }
   .ra-box.ra-fiy {
      margin-bottom: 30px;
   }
}
.availability-content {
   border: 1px solid var(--uvalib-grey-light);
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
