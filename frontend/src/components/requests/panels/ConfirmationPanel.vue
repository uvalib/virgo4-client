<template>
   <div class="confirmation-panel">
      <h2>We have received your request.</h2>
      <div class="ra-box ra-notice" v-if="showClosedMessage">
         Please note that the Library is closed from December 19, 2020 - January 3, 2021. No staff will be available to process
         requests during this time. Your request will be processed as soon as possible after we reopen.
      </div>
      <dl>
         <dt>User ID:</dt>
         <dd>{{userId}}</dd>
         <template v-if="hold.itemLabel">
            <dt>Item:</dt>
            <dd>{{hold.itemLabel}}</dd>
            <dt>Pickup Library:</dt>
            <dd>{{hold.pickupLibrary}}</dd>
         </template>
         <template v-if="aeon.callNumber">
            <dt>CallNumber:</dt>
            <dd>{{aeon.callNumber}}</dd>
            <dt>Request Note:</dt>
            <dd>{{aeon.specialRequest}}</dd>
         </template>
      </dl>

   </div>
</template>
<script>
import { mapState } from "vuex";
export default {
   computed: {
      ...mapState({
         hold: state => state.requests.hold,
         aeon: state => state.requests.aeon,
         userId: state => state.user.signedInUser
      }),
      showClosedMessage() {
         let d0 = new Date("2020-12-15")
         let d1 = new Date("2021-01-04")
         let today = new Date()
         return today >= d0 && today <= d1
      }
   },
   methods: {
      reset() {
         this.$store.commit("requests/reset");
      }
   },
   created() {
      setTimeout( () => {
         let ele = document.getElementById("request-done")
         if ( ele ) {
            ele.focus()
         }
      }, 150)
   }
};
</script>
<style scoped>
dl {
   margin-top: 15px;
   display: inline-grid;
   grid-template-columns: 1fr 1fr;
   grid-column-gap: 10px;
   width: 100%;
}
dt {
   font-weight: bold;
   text-align: right;
   padding: 4px 8px;
   white-space: nowrap;
   vertical-align: top;
}
dd {
   margin: 0;
   width: 100%;
   text-align: left;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   padding: 4px 0px;
}
</style>