<template>
   <div v-if="enableBarcodeScan" class="v4-barcode-scanner">
      <span v-if="showVideo==false" @click="videoShow" class="text-button">
         Scan Barcode&nbsp;<i class="fas fa-camera"></i>
      </span>
      <div class="scan-wrapper" v-if="showVideo">
         <span>Scan a barcode with the camera on your device</span>
         <StreamBarcodeReader 
            @decode="onBarcodeDecode"
         ></StreamBarcodeReader>
         <div class="scan controls">
            <V4Button mode="primary" @click="cancelScan">Cancel</V4Button>
         </div>
      </div>
   </div>
</template>

<script>
import { StreamBarcodeReader } from "vue-barcode-reader"
import { mapState } from "vuex"
export default {
   components: {
     StreamBarcodeReader
   },
   computed: {
      ...mapState({
         enableBarcodeScan: state => state.preferences.enableBarcodeScan,
      })
   },
   data: function() {
      return {
         showVideo: false
      }
   },
   methods: {
      onBarcodeDecode(result) {
         this.showVideo = false
         this.$emit('scanned', result)
      },
      videoShow() {
         this.showVideo = true
      },
      cancelScan() {
         this.showVideo = false
      }
   }
}
</script>

<style scoped>
.scan-wrapper {
   text-align: center;
   padding: 10px; 
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.12);
   border: 1px solid var(--uvalib-grey-light);
}
.scan-wrapper span {
   margin: 0 0 10px 0;
   display: inline-block;
   color: 1px solid var(--uvalib-grey);
}
.scan-wrapper .scan.controls {
   text-align: right;
   display: block;
   margin:0;
   padding:0;
   color:white;
}
.scan-wrapper .scan.controls .pure-button.pure-button-primary {
   margin: 5px 0 0 0;
}
</style>