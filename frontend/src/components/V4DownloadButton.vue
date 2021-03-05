<template>
   <button tabindex="0" role="button" class="v4-download-button" :class="{text: mode != 'button'}"
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
      },
      mode: {
         type: String,
         default: "text"
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
   background-color: var(--uvalib-brand-blue-light);
   border: 1px solid var(--uvalib-brand-blue-light);
   margin: 0 0 5px 10px;
   border-radius: 5px;
   font-weight: normal;
   padding: 0;
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
      color: white;
      font-weight: 500;
      margin: .5em 1em;
      display: inline-block;
   }
   .download-text:hover {
      text-decoration: underline;
   }
}
.v4-download-button.text {
   border: none;
   outline: none;
   background: transparent;
   margin: 0 15px 0 0;
   padding: 2px;
   .download-text {
      color: var(--color-link);
      font-weight: 500;
      margin: 0;
      display: inline-block;
   }
}
</style>
