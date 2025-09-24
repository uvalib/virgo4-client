<template>
   <div class="form-controls" :class="props.buttonAlign">
      <FormKit  v-if="props.hasCancel" type="button" :label="props.cancelLabel" wrapper-class="cancel-button" @click="emit('canceled')" />
      <FormKit :id="props.submitID" type="submit" :label="props.submitLabel" wrapper-class="submit-button"  @keydown.exact.tab="tabNext"/>
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
   cancelLabel: {
      type: String,
      default: "Cancel"
   },
   buttonAlign: {
      type: String,
      default: "right"
   },
   tabNextOverride: {
      type: Boolean,
      default: false
   },
   submitID: {
      type: String,
      required: true
   }
})
const emit = defineEmits( ['canceled', 'tabnext'] )
function tabNext(event) {
   if (props.tabNextOverride) {
      event.stopPropagation()
      event.preventDefault()
      emit('tabnext')
   }
}
</script>

<style scoped lang="scss">
.form-controls {
   display: flex;
   flex-flow: row nowrap;
   justify-content: flex-end;
   align-items: flex-start;
   gap: 10px;
}
.form-controls.center {
   justify-content: center;
}
.form-controls.right {
   justify-content: flex-end;
}
.form-controls.spaced {
   justify-content: space-around;
}
</style>