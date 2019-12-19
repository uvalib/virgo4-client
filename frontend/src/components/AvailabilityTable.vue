<template>
   <div class="availability">
      <div class="working" v-if="availability.searching" >
         <div>Loading Availability...</div>
         <div class="spinner">
           <div class="bounce1"></div>
           <div class="bounce2"></div>
           <div class="bounce3"></div>
         </div>
      </div>
      <template v-if="availability.items.length">
         <h2>Availability</h2>
         <table class="fields">
            <thead>
               <tr>
                  <th v-for="(column, idx) in availability.columns" :key="idx">
                     {{column}}
                  </th>
               </tr>
            </thead>

            <tr v-for="(item,idx) in availability.items" :key="idx">
               <td class="value" v-for="(field, id) in visibleFields(item)" :key="id">
                  {{field.value}}
                 <span class="notice" v-if="(id == visibleFields(item).length - 1) && (item.notice)">
                   <AvailabilityNotice v-bind:message="item.notice" />
                 </span>
               </td>
            </tr>
         </table>

      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import AvailabilityNotice from "@/components/popovers/AvailabilityNotice"
export default {
  components: {
    AvailabilityNotice
  },
   props: {
      titleId: String
   },
   computed: {
      ...mapGetters({
         availability : 'item/availability'
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
   }
   td, th {
      padding: 0.5rem;
      text-align: left;
   }
   tr {
      border: 1px solid black;
   }
   .spinner {
     margin: 0 auto;
     width: 80px;
     text-align: center;
   }
   .spinner > div {
     width: 18px;
     height: 18px;
     background-color: var(--uvalib-brand-orange);
     border-radius: 100%;
     display: inline-block;
     -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
     animation: sk-bouncedelay 1.4s infinite ease-in-out both;
     margin: 0 2px;
   }
   .spinner .bounce1 {
     -webkit-animation-delay: -0.32s;
     animation-delay: -0.32s;
   }
   .spinner .bounce2 {
     -webkit-animation-delay: -0.16s;
     animation-delay: -0.16s;
   }
   @-webkit-keyframes sk-bouncedelay {
     0%, 80%, 100% { -webkit-transform: scale(0) }
     40% { -webkit-transform: scale(1.0) }
   }
   @keyframes sk-bouncedelay {
     0%, 80%, 100% {
       -webkit-transform: scale(0);
       transform: scale(0);
     } 40% {
       -webkit-transform: scale(1.0);
       transform: scale(1.0);
     }
   }
</style>
