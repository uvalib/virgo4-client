<template>
   <div class="availability">
      <div class="working" v-if="item.availability.searching" >
         <V4Spinner message="Loading Availability..."/>
      </div>
      <div class="availability-content" v-else-if="showAvailability">
         <h2>Availability</h2>
         <div class="avail-message" v-if="availabilityStatement" v-html="availabilityStatement"></div>
         <div class="avail-message" v-if="accessRestriction" v-html="accessRestriction"></div>
         <div class="avail-message" v-if="extentOfDigitization" v-html="extentOfDigitization"></div>
         <template v-if="libraryAvailabilityNotes">
            <div class="avail-message" v-for="(note, nidx) in libraryAvailabilityNotes" v-html="note" :key="`note${nidx}`"></div>
         </template>

         <p class="error" v-if="item.availability.error" v-html="item.availability.error"></p>

         <DiBSViewer :barcode="dibsBarcode" v-if="systemStore.isDevServer && dibsBarcode "></DiBSViewer>

         <BoundWithItems v-if="item.hasBoundWithItems"/>
         <div class="items" v-if="hasItems || request.hasRequestOptions">
            <RequestContainer v-if="canMakeRequests && !user.isBarred" />
            <ul class="holdings" v-if="item.details.holdings.libraries">
               <li v-for="(lib, idx) in item.details.holdings.libraries" :key="`lib${idx}`">
                  <span class="library">{{lib.library}}</span>
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

               <tr v-for="(avalItem,idx) in item.availability.items" :key="`val-${idx}`">
                  <td class="value">{{formatValue(avalItem.library)}}</td>
                  <td class="value">{{formatValue(avalItem.current_location)}}</td>
                  <td class="value">{{formatValue(avalItem.call_number)}}</td>
                  <td class="value">
                     <template v-if="avalItem.notice">
                        <AvailabilityNotice :label="formatValue(avalItem.barcode)" :message="avalItem.notice" />
                     </template>
                     <template v-else>
                        {{formatValue(avalItem.barcode)}}
                     </template>
                  </td>
               </tr>
            </table>
         </div>
      </div>
   </div>
</template>

<script setup>
import { computed } from "vue"
import AvailabilityNotice from "@/components/disclosures/AvailabilityNotice.vue"
import RequestContainer from "@/components/requests/RequestContainer.vue"
import BoundWithItems from "@/components/details/BoundWithItems.vue"
import DiBSViewer from "@/components/details/DiBSViewer.vue"
import { useSystemStore } from "@/stores/system"
import { useItemStore } from "@/stores/item"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"

const item = useItemStore()
const request = useRequestStore()
const user = useUserStore()
const systemStore = useSystemStore()

const hasItems = computed(()=>{
   return Array.isArray(item.availability.items) && item.availability.items.length > 0
})
const availabilityFields = computed(()=>{
   return item.details.detailFields.filter( f => f.display == "availability")
})
const showAvailability = computed(()=>{
   return hasItems.value || request.hasRequestOptions || availabilityFields.value.length > 0 || item.hasBoundWithItems
})
const canMakeRequests = computed(()=>{
   if ( user.noILSAccount) {
      if (request.requestOptions.find( ro => ro.sign_in_required === false)) {
         return true
      }
      return false
   }
   return request.hasRequestOptions
})
const availabilityStatement = computed(()=>{
   let f = item.details.detailFields.find( f=>f.name == "availability_statement")
   if (f) {
      return f.value
   }
   return ""
})
const accessRestriction = computed(()=>{
   let f = item.details.detailFields.find( f=>f.name == "access_note")
   if (f) {
      return f.value
   }
   return ""
})
const extentOfDigitization = computed(()=>{
   let f = item.details.detailFields.find( f=>f.name == "extent_of_digitization")
   if (f) {
      return f.label + ": " + f.value
   }
   return ""
})
const libraryAvailabilityNotes = computed(()=>{
   let af = item.details.detailFields.find( f => f.name == "library_availability_note")
   if (af ) {
      if (Array.isArray(af.value) == false) {
         return [af.value]
      }
      return af.value
   }
   return []
})

const dibsBarcode = computed(()=>{
  let f = item.availability.items.find( f => f.home_location_id == "DIBS")
  return f.barcode
})

function formatValue(val) {
   if ( val == "On Shelf" ) {
      return "On Shelf Now"
   }
   return val
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
   .working {
      margin: 25px;
      text-align: center;
   }
}
.availability-content {
   margin: 0 0 20px 0;
   text-align: left;

   .avail-message {
      text-align: center;
      margin-bottom: 2.5rem;
   }
   div.items {
      border: 1px solid var(--uvalib-grey-light);
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

   span.library {
      font-size: 1.15em;
   }

   ul.location  {
      font-weight: normal;
      padding-left: 40px;
      padding-bottom: 10px;
      span.location {
         font-weight: bold;
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
