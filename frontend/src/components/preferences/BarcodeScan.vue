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
            <input @change="scanClicked" class="scan" :checked="enableBarcodeScan" type="checkbox"
               aria-label="toggle barcode scanning functionality"/>Barcode Scanning enabled
         </label>
         <p>Once enabled, the Barcode Scanning option will appear under the main Search bar.</p>
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

<style lang="scss" scoped>
.barcode-scanning {
   h2 {
     margin:5px 0 10px 0;
   }
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
}
</style>