<template>
   <div v-if="preferencesStore.enableBarcodeScan" class="v4-barcode-scanner">
      <V4Button v-if="showVideo==false" @click="videoShow" mode="text">
         Scan Barcode
      </V4Button>
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

<script setup>
import { usePreferencesStore } from "@/stores/preferences"
import { StreamBarcodeReader } from "vue-barcode-reader"
import analytics from '@/analytics'
import { ref } from 'vue'

const emit = defineEmits( ['scanned'] )

const preferencesStore = usePreferencesStore()
const showVideo = ref(false)

function onBarcodeDecode(result) {
   showVideo.value = false
   analytics.trigger('Search', 'BARCODE_SCAN', "success")
   emit('scanned', result)
}

function videoShow() {
   analytics.trigger('Search', 'BARCODE_SCAN', "started")
   showVideo.value = true
}

function cancelScan() {
   analytics.trigger('Search', 'BARCODE_SCAN', "canceled")
   showVideo.value = false
}
</script>

<style lang="scss" scoped>
.scan-wrapper {
   text-align: center;
   padding: 10px;
   box-shadow:  $v4-box-shadow-light;
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
.scan-wrapper .scan.controls .v4-button {
   margin: 5px 0 0 0;
}
</style>