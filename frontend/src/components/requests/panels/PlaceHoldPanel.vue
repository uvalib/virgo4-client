<template>
   <div class="place-hold  pure-form">
      <div v-if="itemOptions.length > 1" class="item-selector">
         <h3>Select the item you want:</h3>
         <select id="hold-select" v-model="selectedItem" @change="itemSelected" aria-required="true" required="required">
            <option :value="{}">Select an item</option>
            <option v-for="l in itemOptions" :key="l.barcode" :value="l">{{l.label}}</option>
         </select>
         <p class="error" v-if="errors.item_barcode">{{errors.item_barcode.join(', ')}}</p>
      </div>
      <PickupLibrary />
      <V4Button mode="primary" class="request-button" @click="placeHold" :disabled="buttonDisabled">Place Hold</V4Button>
      <div v-if="pickupLibrary.id == 'LEO' && (noILLiadAccount==true || leoAddress=='')" class="illiad-prompt ra-box ra-fiy">
         It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
         <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank">here</a> and let us know where you would like your item to be delivered.
      </div>
      <p class="error" v-if="errors.sirsi">{{errors.sirsi.join(', ')}}</p>
   </div>
</template>
<script>
import { mapFields } from "vuex-map-fields"
import { mapState, mapGetters } from "vuex"
import PickupLibrary from "@/components/preferences/PickupLibrary"

export default {
   components: {
      PickupLibrary
   },
   data: () => {
      return { selectedItem: {} };
   },
   computed: {
      ...mapState({
         noILLiadAccount: state => state.user.noILLiadAccount,
         leoAddress: state => state.user.accountInfo.leoAddress,
      }),
      ...mapFields({
         hold: "requests.hold",
         itemOptions: "requests.activeOption.item_options",
         errors: "requests.errors",
         buttonDisabled: "requests.buttonDisabled",
         pickupLibrary: 'preferences.pickupLibrary',
      }),
      ...mapGetters({
         isDevServer: 'system/isDevServer',
      }),
   },
   created() {
      this.$analytics.trigger('Requests', 'REQUEST_STARTED', "placeHold")
      if (this.itemOptions.length == 1) {
         this.selectedItem = this.itemOptions[0];
      }
      setTimeout( () => {
         let ele = document.getElementById("hold-select")
         if ( ele ) {
            ele.focus()
         } else {
            ele = document.getElementById("pickup-sel")
            if ( ele ) {
               ele.focus()
            }
         }
      }, 150)
   },
   methods: {
      itemSelected() {
         this.hold.itemLabel = this.selectedItem.label
         this.hold.itemBarcode = this.selectedItem.barcode
         this.errors.item_barcode = null;
      },
      placeHold() {
         this.$store.dispatch("requests/createHold");
      },
   }
};
</script>
<style lang="scss" >
.illiad-prompt {
   margin: 15px;
   min-height: initial !important;
   a {
      text-decoration: underline !important;
      font-weight: 500;
   }
}
div.place-hold {
   display: flex;
   flex-flow: column wrap;
   justify-content: space-around;
   align-items: center;
   align-content: space-around;

   h2 {
      margin: 5px 0 10px 0 !important;
      background: white !important;
      border: 0 !important;
      padding: 0px !important;
   }

   @media only screen and (max-width: 768px) {
      align-items: flex-start;
   }
}
.place-hold > * {
   margin-bottom: 10px;
   min-height: 2em;
}
.item-selector {
   padding-bottom: 20px;
}
.request-button {
   padding: 10px;
}
.error {
  color: var(--color-error)
}

</style>
