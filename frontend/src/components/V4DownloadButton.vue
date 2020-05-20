<template>
   <button tabindex="0" role="button" class="v4-download-button" 
      @click.stop="clicked" @keydown.prevent.stop.enter="clicked" @keydown.space.prevent.stop="clicked">
      <i class="icon" :class="icon"></i>
      <label>{{label}}</label>
   </button>
</template>

<script>
export default {
   props: {
      icon: {
         type: String,
         required: true
      },
      url: {
         type: String,
         required: true
      },
      label: {
         type: String,
         required: true   
      }
   },
   methods: {
      clicked() {
         window.location.href = this.url
      }
   },
}
</script>

<style lang="scss" scoped>
.pure-button.pure-button-primary:focus {
   box-shadow: 0 0 0 4px rgba(21, 156, 228, 0.4);
} 
.v4-download-button {
   border: none;
   outline: none;
   background: transparent;
   margin-right: 15px;
   cursor: pointer;

   .icon {
      font-size: 1.75em;
      display: block;
      color: var(--uvalib-text);
   }
   label {
      font-size: 0.8em;
      color: var(--uvalib-text);
      display: block;
      cursor: pointer;
      font-weight: normal;
   }
}
</style>