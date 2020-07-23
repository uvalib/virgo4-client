<template>
   <div tabindex="0" role="checkbox" class="v4-checkbox" 
      :class="{inline: !hasLabelSlot(), disabled: disabled}" 
      :aria-checked="isChecked"
      :aria-disabled="disabled" 
      @click.stop="clicked" @keyup.stop.enter="clicked" @keydown.space.prevent.stop="clicked">
      <i class="box" :class="checkClass"></i>
      <label v-if="hasLabelSlot()">
         <slot></slot>
      </label>
   </div>
</template>

<script>
export default {
   props: {
      // If the component is passed a v-model, value non-null 
      // otherwise use the checked property
      value: {
         type: Boolean,
         default: null
      },
      checked: {
         type: Boolean,
         default: false
      },
      disabled: {
         type: Boolean, 
         default: false
      }
   },
   computed: {
      checkClass() {
         if ( this.isChecked )  {
            return "fas fa-check-square"
         } else {
            return "far fa-square"
         }
      },
      isChecked() {
         if ( this.value != null ) {
            return this.value
         }
         return this.checked
      }
   },
   methods: {
      hasLabelSlot() {
         return !(typeof this.$slots.default === 'undefined')
      },
      clicked() {
         if ( this.disabled) {
            return
         }

         if ( this.value != null ) {
            let state = !this.value
            this.$emit('input', state)
         } 
         this.$emit('click')
      },
   },
}
</script>

<style lang="scss" scoped>
div.v4-checkbox.inline {
   display: inline-block;
   i.box {
      margin-right:0 !important;
   }
} 
div.v4-checkbox {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   cursor: pointer;
   outline:none;
   padding: 1px;

   label {
      font-weight: normal;
      font-size: 1em;
      cursor: pointer;
   }
   i.box {
      margin-right: 10px;
      color: var(--uvalib-text);
      font-size: 1.2em;
   }
   &:focus {
      @include be-accessible();
   }
}
div.v4-checkbox.disabled {
   opacity: 0.6;
   cursor: default;
   label {
      cursor: default;
   }
}
</style>