<template>
   <div class="availability">
      <div class="working" v-if="item.availability.searching" >
         <V4Spinner message="Loading Availability..."/>
      </div>
      <div class="availability-content" v-else>
         <h2>Availability</h2>

         <div class="online" v-if="hasOnlineContent">
            <OnlineAccessPanel v-if="item.onlineAccessSources.length > 0 && !system.isKiosk"
               :title="item.details.header.title" :pool="item.details.source" :sources="item.onlineAccessSources" />
            <DiBSViewer :items="dibsItems" v-if="dibsItems.length > 0"></DiBSViewer>
         </div>

         <div v-if="hasItems" class="on-shelf">
            <h3>On shelf</h3>
            <div class="avail-messages-container" v-if="system.isKiosk == false && hasAvailMessage">
               <div class="avail-message" v-if="availabilityStatement" v-html="availabilityStatement"></div>
               <div class="avail-message" v-if="accessRestriction" v-html="accessRestriction"></div>
               <div class="avail-message" v-if="extentOfDigitization" v-html="extentOfDigitization"></div>
               <div class="avail-message" v-if="libraryAvailabilityNotes" v-for="(note, nidx) in libraryAvailabilityNotes" v-html="note" :key="`note${nidx}`"></div>
               <p class="error" v-if="item.availability.error" v-html="item.availability.error"></p>
            </div>
            <RequestsPanel v-if="canMakeRequests"/>
            <ul class="holdings" v-if="item.details.holdings.libraries">
               <li v-for="lib in item.details.holdings.libraries">
                  <div class="library">{{lib.library}}</div>
                  <div v-for="(loc, lidx) in lib.locations" :key="`loc${lidx}`" class="locations">
                     <div class="location">{{loc.location}}</div>
                     <div v-for="cn in loc.call_numbers">
                        <div class="call">{{ cn.call_number }}</div>
                        <div class="note" v-for="txt in  cn.text_notes">{{ txt.text }}</div>
                     </div>
                  </div>
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
import DiBSViewer from "@/components/details/DiBSViewer.vue"
import OnlineAccessPanel from "@/components/details/OnlineAccessPanel.vue"
import RequestsPanel from "@/components/details/RequestsPanel.vue"
import { useItemStore } from "@/stores/item"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"

const item = useItemStore()
const request = useRequestStore()
const user = useUserStore()
const system = useSystemStore()

const hasOnlineContent = computed( () => {
   if (item.onlineAccessSources.length > 0 && !system.isKiosk) return true
   if (dibsItems.length > 0) return true
   return false
})
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
   return request.hasOptions
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
      padding: 1rem;
      border: 1px solid $uva-brand-orange;
      margin-bottom: 30px;
      border-radius: 0.3rem;
      background-color: $uva-brand-orange-300;
      .avail-message {
         :deep(p) {
            margin: 0;
            padding: 0;
         }
      }
   }
   .online {
      display: flex;
      flex-direction: column;
      gap: 1rem;
   }
   .on-shelf {
      display: flex;
      flex-direction: column;
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
            margin-bottom: 5px;
         }
      }
      .location, .call, .note {
         margin: 5px;
         padding: 0 0 0 10px;
      }
   }
   .libraries {
      display: flex;
      flex-direction: column;
      gap: 2rem;
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
