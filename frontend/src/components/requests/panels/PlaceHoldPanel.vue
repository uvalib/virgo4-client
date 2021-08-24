<template>
   <div class="place-hold">
      <div v-if="items.length > 1" class="item-selector">
         <h3>Select the item you want:</h3>
         <V4Select
            id="hold-select"
            style="height:2em;"
            :selections="items"
            v-model="selectedItem"
            v-bind:attached="false"
            placeholder="Make a selection"
            aria-required="true" required="required"
         />
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
import { mapState } from "vuex"
import PickupLibrary from "@/components/preferences/PickupLibrary"

export default {
   components: {
      PickupLibrary,
   },
   data: () => {
      return { selectedItem: {} };
   },
   watch: {
      selectedItem(newVal, _oldVal) {
         this.hold.itemLabel = newVal.label;
         this.hold.itemBarcode = newVal.barcode;
         this.errors.item_barcode = null;
      }
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
      items() {
         let items = this.itemOptions;
         for (let i in items) {
            items[i].id = items[i].barcode;
            items[i].name = items[i].label;
         }
         return items;
      }
   },
   created() {
      this.$analytics.trigger('Requests', 'REQUEST_STARTED', "placeHold")
      if (this.items.length == 1) {
         this.selectedItem = this.items[0];
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
      placeHold() {
         this.$store.dispatch("requests/createHold");
      }
   }
};
</script>
<style lang="scss" scoped>
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
