<template>
   <div class="availability">
      <div class="availability-content" v-if="showAvailability">
         <h2>Availability</h2>
         <div class="ra-box ra-fiy" v-if="hasItems || hasRequestOptions">
            <strong>Please note that stacks browsing is not available because of building restrictions due to COVID-19.</strong>
            Many items are available for pickup. To make a request, sign in and use the "Request" button in the item record.
            If you have questions, or need help accessing materials, use Ask a Librarian web chat.
            <a href="https://www.library.virginia.edu/news/covid-19/" target="_blank">Learn more about Library resources during COVID-19</a>.
         </div>
         <div class="ra-box ra-fiy" v-if="availabilityStatement" v-html="availabilityStatement"></div>
         <div class="ra-box ra-fiy" v-if="accessRestriction" v-html="accessRestriction"></div>
         <div class="ra-box ra-fiy" v-if="extentOfDigitization" v-html="extentOfDigitization"></div>

         <p class="error" v-if="availability.error" v-html="availability.error"></p>

         <div class="working" v-if="availability.searching" >
            <V4Spinner message="Loading Availability..."/>
         </div>

         <BoundWithItems v-if="hasBoundWithItems"/>

         <div class="items" v-if="hasItems || hasRequestOptions">
            <RequestContainer :titleId="titleId" v-if="!isGuest" />
            <ul class="holdings" v-if="details.holdings.libraries">
               <li v-for="(lib, idx) in details.holdings.libraries" :key="`lib${idx}`">
                  {{lib.library}}
                  <ul class="location">
                     <li v-for="(loc, lidx) in lib.locations" :key="`loc${lidx}`">
                        <span class="location">{{loc.location}}</span>
                        <ul class="call">
                           <li v-for="(cn, cidx) in loc.call_numbers" :key="`cn${cidx}`">
                              {{cn.call_number}}
                              <ul class="copy">
                                 <div v-for="(txt, tnidx) in cn.text_notes" :key="`t${tnidx}`">
                                   <li>{{txt.text}}</li>
                                   <li class="note" v-if="txt.note">{{txt.note}}</li>
                                 </div>
                              </ul>
                           </li>
                        </ul>
                     </li>
                  </ul>
               </li>
            </ul>
            <table class="fields" v-if="hasItems">
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
                        <AvailabilityNotice :label="formatValue(item.barcode)" :message="item.notice" />
                     </template>
                     <template v-else>
                        {{formatValue(item.barcode)}}
                     </template>
                  </td>
               </tr>
            </table>
         </div>
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
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
      showAvailability() {
         return this.availability.searching == false && (this.hasItems || this.hasRequestOptions || this.availabilityFields.length > 0 )
      },
      ...mapState({
         details : state => state.item.details,
      }),
      ...mapGetters({
         availability: 'item/availability',
         hasRequestOptions: 'requests/hasRequestOptions',
         hasBoundWithItems: 'item/hasBoundWithItems',
         isGuest: 'user/isGuest',
      }),
      hasItems(){
         return Array.isArray(this.availability.items) && this.availability.items.length > 0

      },
      availabilityStatement() {
         let f = this.details.detailFields.find( f=>f.name == "availability_statement")
         if (f) {
            return f.value
         }
         return ""
      },
      accessRestriction() {
         let f = this.details.detailFields.find( f=>f.name == "access_note")
         if (f) {
            return f.value
         }
         return ""
      },
      extentOfDigitization() {
         let f = this.details.detailFields.find( f=>f.name == "extent_of_digitization")
         if (f) {
            return f.label + ": " + f.value
         }
         return ""
      },
      availabilityFields() {
         return this.details.detailFields.filter( f => f.display == "availability")
      }
   },
   methods: {
      formatValue(val) {
         if ( val == "On Shelf" ) {
            return "On Shelf Now"
         }
         return val
      },
   },
   created() {
      this.$store.dispatch("item/getAvailability", this.titleId )
   }
}
</script>
<style lang="scss" scoped>
.availability {
   width: 95%;
   margin: 0 auto;

   h2 {
      color: var(--color-primary-orange);
      text-align: center;
      margin: 50px 0 30px 0;
   }
   .ra-box.ra-fiy {
      margin: 40px 30px 40px 30px;
   }
   .working {
      margin-bottom: 25px;
      text-align: center;
   }
}
.availability-content {
   margin: 0 0 20px 0;
   text-align: left;

   div.items {
      border: 1px solid var(--uvalib-grey-light);
      // border-radius: 5px;
      margin-top: 25px;
      box-shadow: $v4-box-shadow-light;
   }

   div.value {
      margin: 10px 0 0 20px;
   }
   div.google {
      margin: 25px 0 0 0;
   }
   label {
      font-weight: bold;
      display: block;
   }

   ul {
      list-style: none;
   }

   ul.holdings {
      padding: 15px;
      border-top: 1px solid var(--uvalib-grey-light);
      font-weight: bold;
      margin: 0;
   }

   ul.location  {
      font-weight: normal;
      padding-left: 40px;
      padding-bottom: 10px;
      span.location {
         text-decoration: underline;
      }
      li {
         margin-top: 5px;
      }
   }
   ul.call, ul.copy  {
      padding-left: 10px;
   }
   ul.copy  {
      padding-bottom: 10px;
   }
   li.note {
      font-style: italic;
   }

   table {
      width: 100%;
      font-weight: normal;
      text-align: left;
      border-collapse: collapse;
      box-shadow: $v4-box-shadow-light;
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
      position: relative;
      border-left: none;
      border-right: none;
  }
}
</style>
