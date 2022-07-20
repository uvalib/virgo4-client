<template>
   <div class="form-controls" :class="props.buttonAlign">
      <V4Button v-if="props.hasCancel" mode="tertiary" @click="emit('canceled')">
         Cancel
      </V4Button>
      <FormKit type="submit" :label="props.submitLabel" wrapper-class="submit-button"/>
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
   buttonAlign: {
      type: String,
      default: "right"
   }
})
const emit = defineEmits( ['canceled'] )
</script>

<style lang="scss">
.form-controls {
   display: flex;
   flex-flow: row nowrap;
   justify-content: flex-end;
   margin-top: 15px;
   text-align: right;
   .v4-button {
      margin-left: 5px;
   }
   .submit-button button {
      @include primary-button();
      width: auto;
   }
}
.form-controls.center {
   justify-content: center;
}
.form-controls.right {
   justify-content: flex-end;
}
</style>