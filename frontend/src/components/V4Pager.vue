<template>
   <span class=v4-pager>
      <VirgoButton class="small" :disabled="!props.prevAvailable" icon="pi pi-arrow-left" @click="emit('prior')" aria-label="previous result" />
      <span class="page-info">
         {{utils.formatNum(props.page)}} of {{utils.formatNum(props.total)}}
      </span>
      <VirgoButton class="small" :disabled="!props.nextAvailable" icon="pi pi-arrow-right" @click="emit('next')" aria-label="next result" />
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
   margin: 0, 5px ;
   button.small {
      margin: 0;
   }
   .page-info {
      margin: 0 10px;
      font-size: 12px;
   }
}
</style>