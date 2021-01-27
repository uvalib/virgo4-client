<template>
   <button tabindex="0" role="button" class="v4-download-button"
      @click.stop="clicked" @keydown.prevent.stop.enter="clicked" @keydown.space.prevent.stop="clicked">
      <template v-if="icon && iconInline">
         <span class="download-text">
            {{label}}<i class="icon-inline" :class="icon"></i>
         </span>
      </template>
      <template v-else-if="icon">
         <i class="icon" :class="icon"></i>
         <label>{{label}}</label>
      </template>
      <span v-else class="download-text">{{label}}</span>
   </button>
</template>

<script>
export default {
   props: {
      icon: {
         type: String,
         default: ""
      },
      iconInline: {
         type: Boolean,
         default: false
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
         this.$emit('click')
         window.location.href = this.url
      }
   },
}
</script>

<style lang="scss" scoped>
::v-deep .icon {
   font-size: 1.75em;
   display: block;
   color: var(--uvalib-text);
}
::v-deep  .icon-inline {
   margin-left: 6px;
   font-size: 0.9em;
}
.v4-download-button {
   border: none;
   outline: none;
   background: transparent;
   margin: 0 15px 0 0;
   padding:2px;
   cursor: pointer;

   &:focus {
      @include be-accessible();
   }

   label {
      font-size: 0.8em;
      color: var(--uvalib-text);
      display: block;
      cursor: pointer;
      font-weight: normal;
   }
   .download-text {
      color: var(--color-link);
      font-weight: 500;
   }
   .download-text:hover {
      text-decoration: underline;
   }
}
</style>
