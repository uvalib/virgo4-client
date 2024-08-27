<template>
   <div class="availability">
      <div class="working" v-if="item.availability.searching" >
         <V4Spinner message="Loading Availability..."/>
      </div>
      <div class="availability-content" v-else>
         <h2>Availability</h2>

         <OnlineAccessPanel v-if="item.onlineAccessSources.length > 0 && !system.isKiosk"
            :title="item.details.header.title" :pool="item.details.source" :sources="item.onlineAccessSources" />

         <DiBSViewer :items="dibsItems" v-if="dibsItems.length > 0"></DiBSViewer>

         <div v-if="hasItems" class="on-shelf">
            <h3>
               <span>On shelf</span>
               <span v-if="canMakeRequests" class="req-opts">
                  <!-- TODO fMORE REQUESTS -->
                  <PlaceHoldDialog v-if="request.hasRequestOption('hold')" :settings="request.requestOption('hold')" :show="request.activePanel=='hold'"/>
               </span>
            </h3>
            <div class="avail-messages-container" v-if="system.isKiosk == false && hasAvailMessage">
               <div class="avail-message" v-if="availabilityStatement" v-html="availabilityStatement"></div>
               <div class="avail-message" v-if="accessRestriction" v-html="accessRestriction"></div>
               <div class="avail-message" v-if="extentOfDigitization" v-html="extentOfDigitization"></div>
               <div class="avail-message" v-if="libraryAvailabilityNotes" v-for="(note, nidx) in libraryAvailabilityNotes" v-html="note" :key="`note${nidx}`"></div>
               <p class="error" v-if="item.availability.error" v-html="item.availability.error"></p>
            </div>
            <ul class="holdings" v-if="item.details.holdings.libraries">
               <li v-for="lib in item.details.holdings.libraries">
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
            <div class="libraries">
               <LibraryItemsPanel v-for="lib in item.availability.libraries" :library="lib"/>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import { computed } from "vue"
import LibraryItemsPanel from "@/components/details/LibraryItemsPanel.vue"
import PlaceHoldDialog from "@/components/requests/PlaceHoldDialog.vue"
import DiBSViewer from "@/components/details/DiBSViewer.vue"
import OnlineAccessPanel from "@/components/details/OnlineAccessPanel.vue"
import { useItemStore } from "@/stores/item"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"

const item = useItemStore()
const request = useRequestStore()
const user = useUserStore()
const system = useSystemStore()

const hasItems = computed(()=>{
   return item.availability.libraries.length > 0
})
const hasAvailMessage = computed( () => {
   if ( item.availability.error) return true
   let hasMessage = false
   item.details.fields.some( f => {
      if ( f.name == "availability_statement" ||  f.name == "access_note" ||
           f.name == "extent_of_digitization" ||  f.name == "library_availability_note") {
         hasMessage = true
      }
      return hasMessage == true
   })
   return hasMessage
})
const canMakeRequests = computed(()=>{
   if ( system.isKiosk) return false
   if ( user.isBarred ) return false
   if ( user.noILSAccount) {
      if (request.requestOptions.find( ro => ro.sign_in_required === false)) {
         return true
      }
      return false
   }
   return request.hasRequestOptions
})
const availabilityStatement = computed(()=>{
   let f = item.details.fields.find( f=>f.name == "availability_statement")
   if (f) {
      return f.value
   }
   return ""
})
const accessRestriction = computed(()=>{
   let f = item.details.fields.find( f=>f.name == "access_note")
   if (f) {
      return f.value
   }
   return ""
})
const extentOfDigitization = computed(()=>{
   let f = item.details.fields.find( f=>f.name == "extent_of_digitization")
   if (f) {
      return f.label + ": " + f.value
   }
   return ""
})
const libraryAvailabilityNotes = computed(()=>{
   let af = item.details.fields.find( f => f.name == "library_availability_note")
   if (af ) {
      if (Array.isArray(af.value) == false) {
         return [af.value]
      }
      return af.value
   }
   return []
})

const dibsItems = computed(()=>{
   let items = []
   item.availability.libraries.forEach( lib => {
      lib.items.forEach( item => {
         if ( item.home_location_id == "DIBS") {
            items.push(item)
         }
      })
   })
   return items
})

</script>
<style lang="scss" scoped>
.availability {
   .working {
      margin: 25px;
      text-align: center;
   }
}
.availability-content {
   margin: 0 0 20px 0;
   text-align: left;

   .avail-messages-container {
      display: flex;
      flex-direction: column;
      justify-self: flex-start;
      align-items: flex-start;
      gap: 10px;
      padding: 15px 0;
      border-bottom: 1px solid var(--uvalib-grey-light);
      border-top: 1px solid var(--uvalib-grey-light);
      margin-bottom: 30px;
      .avail-message {
         display: flex;
         flex-direction: column;
         justify-self: flex-start;
         align-items: flex-start;
         gap: 5px;
         :deep(p) {
            margin: 0;
            padding: 0;
         }
      }
   }
   .on-shelf {
      h3 {
         margin: 30px 0;
         display: flex;
         flex-flow: row wrap;
         justify-content: space-between;
         align-items: center;
         .req-opts {
            display: flex;
            flex-flow: row wrap;
            justify-content: flex-end;
            align-items: flex-start;
            gap: 5px;
         }
      }
   }
   ul.holdings {
      list-style: none;
      padding: 0;
      margin: 15px 0 30px 0;
      li {
         margin-bottom: 15px;
         .library {
            font-weight: bold;
            margin-bottom: 15px;
         }
      }
      .location, .call {
         margin: 5px;
         list-style: none;
         padding: 0 0 0 5px;
      }
      .copy {
         padding: 0;
         list-style: none;
      }
   }
   .libraries {
      display: flex;
      flex-direction: column;
      gap: 20px;
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
