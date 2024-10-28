<template>
   <section class="library-items">
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <div class="name">{{props.library.name}}</div>
            <table>
               <thead>
                  <tr>
                     <th>Location/Status</th>
                     <th>Call Number</th>
                     <th>Barcode</th>
                  </tr>
               </thead>
               <tr v-for="(item,idx) in library.items" :key="`val-${idx}`">
                  <td class="value">{{ item.current_location }}</td>
                  <td class="value">{{ item.call_number }}</td>
                  <td class="value">
                     <template v-if="item.notice">
                        <AvailabilityNotice :label="item.barcode" :message="item.notice" />
                     </template>
                     <template v-else>
                        {{ item.barcode }}
                     </template>
                  </td>
               </tr>
            </table>
         </div>
      </div>
   </section>
</template>

<script setup>
import AvailabilityNotice from "@/components/disclosures/AvailabilityNotice.vue"

const props = defineProps({
   library: {
      type: Object,
      required: true
   },
})
</script>

<style lang="scss" scoped>
.library-items {
   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: stretch;
      border-radius: 5px;
      .gutter {
         flex: 0 0 17px;
         border-radius: 5px  0 0 5px;
         background-color:#BFE7F7;
      }
      .content {
         flex: 1;
         padding: 20px;
         border: 1px solid var(--uvalib-grey-light);
         border-radius:  0 5px  5px 0;
         border-left: 0;
         .name {
            font-weight: bold;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--uvalib-grey-light);
            margin-bottom: 10px;
         }
         table {
            width: 100%;
            font-size: 0.9em;
            th, td {
               padding: 5px;
               width: 32%;
            }
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
