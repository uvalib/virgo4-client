<template>
   <section class="library-items">
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <div class="name">{{props.library.name}}</div>

         </div>
      </div>
   </section>
   <!-- <table class="fields" v-if="hasItems">
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
            </table> -->
</template>

<script setup>
import { computed } from "vue"
import AvailabilityNotice from "@/components/disclosures/AvailabilityNotice.vue"

const props = defineProps({
   library: {
      type: Object,
      required: true
   },
})

function formatValue(val) {
   if ( val == "On Shelf" ) {
      return "On Shelf Now"
   }
   return val
}
</script>

<style lang="scss" scoped>
.library-items {
   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: stretch;
      border: 1px solid var(--uvalib-grey-light);
      border-radius: 0 5px 5px 0;
      gap: 20px;
      .gutter {
         flex: 0 0 17px;
         background-color:#E6F2F7;
         border-right: 1px solid var(--uvalib-grey-light);
      }
      .content {
         flex: 1;
         padding: 15px 15px 15px 0;
         .name {
            font-size: 1.1em;
            font-weight: bold;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--uvalib-grey-light);
            margin-bottom: 10px;
         }
      }
   }
}
@media only screen and (min-width: 768px) {
   .buttons {
      justify-content: flex-start;
      gap: 5px 50px;
   }
}
@media only screen and (max-width: 768px) {
   .buttons {
      justify-content: space-between;
      gap: 5px 10px;
   }
}
</style>
