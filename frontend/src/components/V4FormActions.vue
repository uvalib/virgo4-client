<template>
   <div class="controls">
      <V4Button v-if="props.hasCancel" mode="tertiary" @click="emit('canceled')">
         Cancel
      </V4Button>
      <V4Button mode="primary" @click="emit('submitted')" :disabled="props.disabled">
         {{props.submitLabel}}
      </V4Button>
   </div>
</template>

<script setup>
const props = defineProps({
   hasCancel: {
      type: Boolean,
      default: true
   },
   submitLabel: {
      type: String,
      default: "Submit"
   },
   disabled: {
      type: Boolean,
      default: false
   },
})
const emit = defineEmits( ['click', 'submitted' ] )
</script>

<style lang="scss" scoped>
.controls {
   text-align: right;
   margin-top: 10px;
   .v4-button {
      margin-left: 5px;
   }
}
</style>