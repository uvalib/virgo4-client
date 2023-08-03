<template>
   <VirgoButton text @click="clicked" class="disclosure">
      <i class="arrow fas fa-caret-right"  :style="{ transform: rotation }"></i>
      <slot></slot>
   </VirgoButton>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits( ['clicked'] )

const rotation = ref("rotate(0deg)")

const clicked = ((event) => {
   emit('clicked', event)
   if ( rotation.value == "rotate(90deg)" ) {
      rotation.value = "rotate(0deg)"
   } else {
      rotation.value = "rotate(90deg)"
   }
})
</script>

<style lang="scss" scoped>
</style>
