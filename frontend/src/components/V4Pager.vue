<template>
   <span class=v4-pager>
      <V4Button mode="small" :disabled="!props.prevAvailable"  @click="emit('prior')" aria-label="previous result">
         <i class="fal fa-arrow-left"></i>
      </V4Button>
      <span class="page-info">
         {{utils.formatNum(props.page)}} of {{utils.formatNum(props.total)}}
      </span>
      <V4Button mode="small"  :disabled="!props.nextAvailable" @click="emit('next')" aria-label="next result">
         <i class="fal fa-arrow-right"></i>
      </V4Button>
   </span>
</template>

<script setup>
import * as utils from '@/utils'
const props = defineProps({
   total: {
      type: Number,
      required: true
   },
   page: {
      type: Number,
      required: true
   },
   prevAvailable: {
      type: Boolean,
      required: true
   },
   nextAvailable: {
      type: Boolean,
      required: true
   }
})
const emit = defineEmits( ['prior', 'next' ] )
</script>

<style lang="scss" scoped>
.v4-pager {
   display: flex;
   flex-flow: row nowrap;
   justify-content: flex-end;
   align-content: center;
   align-items: center;
   font-size: 16px;
   font-weight: normal;
   color: var( --uvalib-text);
   margin: 0, 5px;
   .page-info {
      margin: 0 10px;
      font-size: 12px;
   }
   .v4-button {
      padding: 4px 12px;
      color: white;
      border-radius: 5px;
      font-weight: normal;
   }
}
</style>