<template>
   <span class=v4-pager>
      <V4Button mode="small" :disabled="!prevAvailable"  @click="$emit('prior')" aria-label="previous result">
         <i class="fas fa-arrow-left"></i>
      </V4Button>
      <span class="page-info">
         {{formatNum(page)}} of {{formatNum(total)}}
      </span>
      <V4Button mode="small"  :disabled="!nextAvailable" @click="$emit('next')" aria-label="next result">
         <i class="fas fa-arrow-right"></i>
      </V4Button>
   </span>
</template>

<script>
export default {
   props: {
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
   },
   computed: {
   },
   methods: {
      formatNum(num) {
         return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      },
   },
}
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