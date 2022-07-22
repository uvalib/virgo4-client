<template>
   <div class="form-controls" :class="props.buttonAlign">
      <FormKit :id="props.submitID" type="submit" :label="props.submitLabel" wrapper-class="submit-button"  @keydown.exact.tab="tabNext"/>
      <V4Button v-if="props.hasCancel" mode="tertiary" @click="emit('canceled')" >
         {{props.cancelLabel}}
      </V4Button>
   </div>
</template>

<script setup>
// NOTES: when a user is an a form and presses enter, the default button on the form is triggered.
// This is the first button in the layout... but the standard we have been using is cancel | ok, so
// cancel gets triggered on enter. Not good. To work around this, the buttons above are swapped so enter
// triggers submit. To make the layout match the rest of Virgo, the layout is row-reverse and justify-content
// is reversed; flex-start causes right align.
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
   disabled: {
      type: Boolean,
      default: false
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
   flex-flow: row-reverse nowrap;
   justify-content: flex-end;
   margin-top: 5px;
   text-align: right;
   padding: 10px 0;
   .v4-button {
      margin-left: 5px;
   }
   :deep(.submit-button button) {
      @include primary-button();
      width: auto;
   }
}
.form-controls.center {
   justify-content: center;
}
.form-controls.right {
   justify-content: flex-start;
}
</style>