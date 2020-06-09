<template>
   <div :id="id" class="disclosure">
      <V4Button mode="text" :aria-expanded="showFull" :aria-controls="`${id}-full`" 
         @click="toggle" @esc="hide">
         <i v-if="showFull" class="arrow fas fa-caret-down"></i>
         <i v-else class="arrow fas fa-caret-right"></i>
         <span class="message">What am I searching&nbsp;</span>
         <i class="icon fas fa-question-circle"></i>
      </V4Button>
      <div v-show="showFull" :id="`${id}-full`" class="full-text">
         Resource Types are collections of related items that are available to be searched by Virgo.    
      </div>
   </div>
</template>

<script>
export default {
   props: {
      id: {
         type: String,
         required: true
      }
   },
   data: function() {
      return {
         showFull: false
      }
   },
   computed: {
   },
   methods: {
      hide() {
         this.showFull = false
      },
      toggle() {
         this.showFull = !this.showFull
      },
   }
}
</script>

<style lang="scss" scoped>
.disclosure {
   text-align: left;
   .full-text {
      background: var(  --uvalib-teal-lightest);
      margin: 0 0 0 15px;
      padding: 10px 15px;
   }
   .arrow {
      padding-left: 2px;
      margin-right: 5px;
      width: 10px;
   }
   button {
      display: inline-block;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      cursor: default;
      background: transparent;
      border: none;
      margin: 0;
      padding: 0;
      text-align: left;
      box-sizing: border-box;
      &:focus {
         @include be-accessible();
      }
   }
}

</style>
