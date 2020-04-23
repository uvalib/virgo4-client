<template>
   <div tabindex="0" role="checkbox" class="v4-checkbox" :aria-checked="isChecked"
      @click.stop="clicked" @keyup.stop.enter="clicked" @keydown.space.prevent.stop="clicked">
      <i class="box" :class="checkClass"></i>
      <label>
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
      clicked() {
         if ( this.value != null ) {
            let state = !this.value
            this.$emit('input', state)
         } 
         this.$emit('click')
      },
   },
}
</script>

<style scoped>
div.v4-checkbox {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   cursor: pointer;
   outline:none;
   padding: 1px;
}
.v4-checkbox:focus {
   box-shadow: 0 0 0 3px rgba(21, 156, 228, 0.4);
}
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
</style>