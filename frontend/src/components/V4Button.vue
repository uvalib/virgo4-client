<template>
   <button tabindex="0" role="button" class="v4-button" 
      :class="{'text-button': mode=='text', 'pure-button': mode!='text', 
               'pure-button-primary': mode == 'primary',
               'pure-button-secondary': mode == 'secondary',
               'pure-button-tertiary': mode == 'tertiary'}" 
      @click.stop="clicked" @keyup.stop.enter="clicked" @keydown.space.prevent.stop="clicked" >
      <slot></slot>
   </button>
</template>

<script>
export default {
   props: {
      mode: {
         type: String,
         required: true
      },
   },
   methods: {
      clicked() {
         this.$emit('click')
      }
   },
}
</script>

<style scoped>
button.text-button {
   border: none;
   background: none;
}
</style>