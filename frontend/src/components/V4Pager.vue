<template>
   <span class=v4-pager>
      <VirgoButton size="small" :disabled="!props.prevAvailable"  severity="secondary"
         icon="fal fa-arrow-left" @click="emit('prior')" aria-label="previous result" />
      <span class="page-info">
         {{$formatNum(props.page)}} of {{$formatNum(props.total)}}
      </span>
      <VirgoButton size="small"  :disabled="!props.nextAvailable" severity="secondary"
         icon="fal fa-arrow-right" @click="emit('next')" aria-label="next result" />
   </span>
</template>

<script setup>
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
   align-items: center;
   font-size: 16px;
   font-weight: normal;
   gap: 34px;
}
</style>