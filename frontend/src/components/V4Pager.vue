<template>
   <span class=v4-pager>
      <button :disabled="!prevAvailable"  :class="{disabled: !prevAvailable}"  @click="$emit('prior')" aria-label="previous result">
         <i class="fas fa-arrow-left"></i>
      </button>
      <span class="page-info">
         {{formatNum(page)}} of {{formatNum(total)}}
      </span>
      <button :disabled="!nextAvailable"  :class="{disabled: !nextAvailable}" @click="$emit('next')" aria-label="next result">
         <i class="fas fa-arrow-right"></i>
      </button>
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
      margin: 0 5px;
      font-size: 14px;
   }
   button {
      padding: 2px 10px;
   }
   button.disabled {
      opacity: 0.6;
      cursor: default;
   }
}
</style>