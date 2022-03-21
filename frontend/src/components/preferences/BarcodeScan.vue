<template>
   <div class="barcode-scanning">
      <h2>Barcode Scanning</h2>
      <div class="content">
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
               <input @change="scanClicked" class="scan" :checked="preferencesStore.enableBarcodeScan" type="checkbox"
                  aria-label="toggle barcode scanning functionality"/>Barcode Scanning enabled
            </label>
            <p>Once enabled, the Barcode Scanning option will appear under the main Search bar.</p>
         </div>
      </div>
   </div>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences"
const preferencesStore = usePreferencesStore()
function scanClicked() {
   preferencesStore.toggleBarcodeScan()
}
</script>

<style lang="scss" scoped>
.barcode-scanning {
   h2 {
      margin: 0;
      padding: 10px 15px;
      background: var(--uvalib-grey-lightest);
      border-bottom: 1px solid var(--uvalib-grey-light);
      font-size: 1.2em;
   }
   .content {
      padding: 5px 20px 0px 20px;
   }
   b {
      margin-right: 10px;
   }
   .check {
      padding-bottom:15px;
   }
   input.scan {
      margin: 5px 10px;
      width: 15px;
      height: 15px;
   }
}
</style>