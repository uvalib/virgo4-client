<template>
   <VirgoButton @click="showDialog=true" :label="props.trigger" size="small" :disabled="props.disabled" />
   <Dialog v-model:visible="showDialog" :modal="true" position="center"
      :header="props.title" @show="emit('opened')" @hide="emit('closed')"
   >
      <slot></slot>
      <template #footer>
         <template v-if="props.showSubmit">
            <VirgoButton severity="secondary" @click="showDialog=false" label="Cancel"/>
            <VirgoButton :label="props.request" :disabled="props.disabled" @click="emit('submit')" />
         </template>
         <VirgoButton v-else severity="secondary" @click="showDialog=false" label="Close"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'

const props = defineProps({
   trigger: {
      type: String,
      required: true
   },
   title: {
      type: String,
      required: true
   },
   show: {
      type: Boolean,
      default: false
   },
   request: {
      type: String,
      required: true
   },
   showSubmit: {
      type: Boolean,
      requitred: true
   },
   disabled: {
      type: Boolean,
      default: false
   }
})

const emit = defineEmits( ['opened', 'closed', 'submit'] )

const showDialog = ref(props.show)

watch(() => props.show, (newVal) => {
   if ( newVal == true ) {
      showDialog.value = true
   }
})
</script>

<style lang="scss" scoped>
</style>