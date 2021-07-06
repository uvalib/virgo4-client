<template>
   <div :id="id" class="disclosure">
      <V4Button mode="text" :aria-expanded="showFull.toString()" :aria-controls="`${id}-full`"
         @click="toggle" @esc="hide" @blur="blurred">
         <i class="arrow fas fa-caret-right" :style="{ transform: rotation }"></i>
         <slot name="summary"></slot>
      </V4Button>
      <transition name="fade">
         <div aria-live="polite" v-show="showFull" :id="`${id}-full`" class="full-text"
            :class="{inline: mode!='overlay', left: align=='left'}"
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
      align: {
         type: String,
         default: "default"
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
      },
      mode: {
         type: String,
         default: "overlay"
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
      right: 10%;
      box-shadow: $v4-box-shadow;
      font-size:0.95em;
      color: var(--uvalib-text);
      font-weight: normal;
      z-index: 9999;
      min-width: 20%;
      max-width: 75%;
   }
   .full-text.left {
      left: 5px;
   }
   .full-text.inline {
      position: relative;
      box-shadow: none;
      margin: 6px 0 0 15px;
      width:100%;
      min-width: auto;
      max-width: inherit;
      // background-color: var(--uvalib-grey-lightest) !important;
      padding: 10px 20px;
      border: 1px solid var(--uvalib-grey-light) !important;
      box-sizing: border-box;
   }
   .arrow {
      padding-left: 2px;
      margin-right: 5px;
      width: 8px;
      transform: rotate(0deg);
      transition-duration: 100ms;
   }
}

</style>
