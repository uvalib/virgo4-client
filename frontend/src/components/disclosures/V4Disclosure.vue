<template>
   <div :id="id" class="disclosure">
      <V4Button mode="text" :aria-expanded="showFull.toString()" :aria-controls="`${id}-full`"
         @click="toggle" @esc="hide" @blur.native="blurred">
         <i class="arrow fas fa-caret-right" :style="{ transform: rotation }"></i>
         <slot name="summary"></slot>
      </V4Button>
      <transition name="fade">
         <div aria-live="polite" v-show="showFull" :id="`${id}-full`" class="full-text"
            :style="{background: backgroundColor, 'border-color': borderColor}"
            @keyup.stop.esc="hide">
            <slot name="content"></slot>
         </div>
      </transition>
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
      },
      backgroundColor: {
         type: String,
         default: "var(--uvalib-blue-alt-light)"
      },
      borderColor: {
         type: String,
         default: "var(--uvalib-blue-alt)"
      }
   },
   data: function() {
      return {
         showFull: false
      }
   },
   computed: {
      rotation() {
         if (this.showFull) {
            return "rotate(90deg)"
         }
         return "rotate(0deg)"
      },
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
         this.$emit("click")
      },
   }
}
</script>

<style lang="scss" scoped>
.disclosure {
   display: inline-block;
   text-align: left;
   .full-text {
      margin: 0px 10px 5px 15px;
      padding: 0;
      position: absolute;
      box-shadow: $v4-box-shadow;
      font-size:0.95em;
      color: var(--uvalib-text-dark);
      font-weight: normal;
      z-index: 9999;
      min-width: 20%;
      max-width: 50%;
   }
   .arrow {
      padding-left: 2px;
      margin-right: 5px;
      width: 8px;
      transform: rotate(0deg);
      transition-duration: 100ms;
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
