<template>
   <button tabindex="0" :role="role" class="v4-button"
      @keydown.esc="escClicked"
      @keydown.exact.tab="tabNext"
      @keydown.shift.tab="tabBack"
      :class="{'text-button': mode=='text', 'icon-button': mode=='icon',
               'link-button': mode=='link',
               'pure-button': isButton,
               'pure-button-primary': mode == 'primary',
               'pure-button-small': mode == 'small',
               'pure-button-tertiary': mode == 'tertiary'}"
      @click.prevent.stop="clicked" @keydown.prevent.stop.enter="clicked" @keydown.space.prevent.stop="clicked">
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
      focusNextOverride: {
         type: Boolean,
         default: false
      },
      focusBackOverride: {
         type: Boolean,
         default: false
      },
      url: {
         type: String,
         default: ""
      },
      target: {
         type: String,
         default: ""
      },
      role: {
         type: String,
         default: "button"
      },
   },
   emits: ['click', 'esc', 'tabback', 'tabnext' ],
   computed: {
      isButton() {
         return this.mode != 'text' && this.mode!='icon' && this.mode!='link'
      }
   },
   methods: {
      escClicked() {
         this.$emit('esc')
      },
      clicked() {
         if ( this.url != "") {
            if (this.target != ""){
               window.open(this.url, this.target)
            } else{
               window.location.href = this.url
            }
         }
         this.$emit('click')
      },
      tabBack(event) {
         if (this.focusBackOverride ) {
            event.stopPropagation()
            event.preventDefault()
            this.$emit('tabback')
         }
      },
      tabNext(event) {
         if (this.focusNextOverride ) {
            event.stopPropagation()
            event.preventDefault()
            this.$emit('tabnext')
         }
      }
   },
}
</script>

<style lang="scss" scoped>
button.text-button {
   border: none;
   background: none;
   padding: 0;
   font-weight: 500;
   color: var(--color-link);
   cursor: pointer;
   display: inline-block;
   &:hover {
      opacity: 1;
      text-decoration: underline;
   }
   &:focus {
      @include be-accessible();
   }
}

button.v4-button.icon-button {
   border: none;
   background: none;
   padding:2px;
   margin:0;
   outline: none;
   cursor: pointer;
   &:focus {
      @include be-accessible();
   }

   :deep(.close-icon) {
      font-size: 20px;
      color: var(--uvalib-blue-alt-darkest);
      &:hover {
         color: var(--uvalib-blue-alt);
      }
   }
}
.link-button {
  border-radius: 5px;
  font-weight: normal;
  text-transform: uppercase;
  background-color: var(--uvalib-brand-orange);
  color: white;
  border: none;
  padding: 10px 12px;
   &:hover  {
      background-color: var(--uvalib-grey-light);
      color: var(--uvalib-text-dark);
   }
   &:focus {
      @include be-accessible();
   }
}
.pure-button.pure-button-primary, .pure-button.pure-button-small {
   background-color: var(--uvalib-brand-blue-light);
   border: 1px solid var(--uvalib-brand-blue-light);
   &:hover {
      background-color: var(--uvalib-brand-blue-lighter);
      border: 1px solid var(--uvalib-brand-blue-lighter);
      transition: all 0.3s ease;
   }
}

.pure-button.pure-button-tertiary {
   background-color: var(--uvalib-grey-lightest);
   border: 1px solid var(--uvalib-grey);
   color: black;
}
.pure-button.pure-button-tertiary:hover {
   background-color: var(--uvalib-grey-light);
}
.pure-button.pure-button-primary,
.pure-button.pure-button-small,
.pure-button.pure-button-tertiary {
   margin: 0 0 5px 10px;
   border-radius: 5px;
   font-weight: normal;
   &:focus {
      @include be-accessible();
   }
}
.pure-button.disabled {
   cursor: default;
   opacity: 0.25;
}
</style>