<template>
   <div class="barcode-scanning">
      <h2>Barcode Scanning</h2>
      <p>
         The camera on your device can be used to scan barcodes for a search.<br/>
         Check the box below to enable this functionality.
      </p>
      <p class="note">
         <b>NOTE:</b>On iOS devices, this functionality can only be used from within the Safari browser.
         Other browsers will <i>NOT</i> work.
      </p>
      <div class="check">
         <label>
            <input @change="scanClicked" class="scan" :checked="enableBarcodeScan" type="checkbox"/>Barcode Scanning Enabled
         </label>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         enableBarcodeScan: state => state.preferences.enableBarcodeScan,
      })
   },
   methods: {
      scanClicked() {
         this.$store.dispatch("preferences/toggleBarcodeScan")
      }
   }
};
</script>

<style scoped>
b {
   margin-right: 10px;
}
.check {
   padding-bottom:20px;
}
input.scan {
   margin: 5px 10px;
   width: 15px;
   height: 15px;
}
</style>