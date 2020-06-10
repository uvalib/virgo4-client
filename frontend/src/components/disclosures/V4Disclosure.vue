<template>
   <div :id="id" class="disclosure">
      <V4Button mode="text" :aria-expanded="showFull.toString()" :aria-controls="`${id}-full`" 
         @click="toggle" @esc="hide" @blur.native="blurred">
         <i v-if="showFull" class="arrow fas fa-caret-down"></i>
         <i v-else class="arrow fas fa-caret-right"></i>
         <slot name="summary"></slot>
      </V4Button>
      <div aria-live="polite" v-show="showFull" :id="`${id}-full`" class="full-text" @keyup.stop.esc="hide">
         <slot name="content"></slot>
      </div>
   </div>
</template>

<script>
export default {
   props: {
      id: {
         type: String,
         required: true
      },
      closeOnBlur: {
         type: Boolean,
         default: true
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
      blurred() {
         if (this.closeOnBlur) {
            this.hide()       
         }
      },
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
   display: inline-block;
   text-align: left;
   .full-text {
      background: var(  --uvalib-blue-alt-light);
      border: 1px solid var(--uvalib-blue-alt);
      margin: 0 0 0 15px;
      padding: 0;
      position: absolute;
      box-shadow: $v4-box-shadow;
      font-size:0.95em;
      color: var(--uvalib-text-dark);
      font-weight: normal;
   }
   .arrow {
      padding-left: 2px;
      margin-right: 5px;
      width: 8px;
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
