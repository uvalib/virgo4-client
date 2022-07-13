<template>
 <div class="dibs">
  <iframe
  :src="'https://reserves-dev.library.virginia.edu/item/' + props.barcode"
  width="100%"
  height="600"
  ></iframe>
 </div>
</template>
<script setup>
const props = defineProps({
   barcode: {
      type: String,
      required: true,
   }
})
</script>
<style >
</style>