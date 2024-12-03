<template>
   <VirgoButton @click="showDialog=true" :label="props.trigger" :disabled="props.disabled" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" :draggable="false"
      :header="props.title" @show="showRequestDialog" @hide="hideRequestDialog"
   >
      <slot></slot>
      <template #footer>
         <template v-if="props.showSubmit">
            <VirgoButton severity="secondary" @click="showDialog=false" label="Cancel"/>
            <VirgoButton :label="props.request" :disabled="props.disabled" @click="emit('submit')" />
         </template>
         <VirgoButton v-else severity="secondary" id="request-done" @click="showDialog=false" label="Close"/>
      </template>
   </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { useSystemStore } from "@/stores/system"

const system = useSystemStore()

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

const showRequestDialog = (() => {
   system.hideScrollToTop = true
   emit('opened')
})

const hideRequestDialog = (() => {
   system.hideScrollToTop = false
   emit('closed')
})
</script>

<style lang="scss" scoped>
</style>