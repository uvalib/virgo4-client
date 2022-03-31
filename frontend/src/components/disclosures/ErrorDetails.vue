<template>
   <V4Disclosure id="error-detail" ref="disclosure"
      backgroundColor="white"
      borderColor="white"
      mode="inline"
   >
      <template v-slot:summary>
         <span>Details</span>
      </template>
      <template v-slot:content>
         <div class="content" v-html="props.details"></div>
      </template>
   </V4Disclosure>
</template>

<script setup>
const props = defineProps({
   details: {
      type: String,
      required: true
   }
})
</script>

<style lang="scss" scoped>
</style>
