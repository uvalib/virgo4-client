<template>
   <button tabindex="0" role="button" class="v4-button" 
      @keydown.exact.tab="tabNext" 
      @keydown.shift.tab="tabBack"
      :class="{'text-button': mode=='text', 'icon-button': mode=='icon', 
               'pure-button': isButton, 
               'pure-button-primary': mode == 'primary',
               'pure-button-secondary': mode == 'secondary',
               'pure-button-tertiary': mode == 'tertiary'}" 
      @click.stop="clicked" @keydown.prevent.stop.enter="clicked" @keydown.space.prevent.stop="clicked" @keyup.stop.esc="escClicked">
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
      }
   },
   computed: {
      isButton() {
         return this.mode != 'text' && this.mode!='icon'
      }
   },
   methods: {
      escClicked() {
         this.$emit('esc')
      },
      clicked() {
         this.$emit('click')
      },
      tabBack() {
         if (this.focusBackOverride ) {
            event.stopPropagation()
            event.preventDefault()
            this.$emit('tabback')
         }
      },
      tabNext( ) {
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
}
button.text-button:hover {
   opacity: 1;
   text-decoration: underline;
}
button.v4-button.icon-button {
   border: none;
   background: none;
   padding: 0;
   margin:0;
}
.pure-button.pure-button-primary {
   background-color: var(--uvalib-brand-blue-light);
   border: 1px solid var(--uvalib-brand-blue-light);
}
.pure-button.pure-button-primary:hover {
   background-color: var(--uvalib-brand-blue-lighter);
   border: 1px solid var(--uvalib-brand-blue-lighter);
   transition: all 0.3s ease;
}
// .pure-button.pure-button-primary:focus {
//    box-shadow: 0 0 0 4px rgba(21, 156, 228, 0.4);
// } 
.pure-button.pure-button-secondary {
   background-color: var(--uvalib-brand-blue-lighter);
   color: black;
}
.pure-button.pure-button-secondary:hover {
   background-color: var(--uvalib-brand-blue-lightest);
}
.pure-button.pure-button-tertiary {
   background-color: var(--uvalib-grey-lightest);
   border: 1px solid var(--uvalib-grey);
   color: black;
}
// .pure-button.pure-button-tertiary:focus {
//    box-shadow: 0 0 0 4px rgba(150,150,150, 0.3); 
// }
.pure-button.pure-button-tertiary:hover {
   background-color: var(--uvalib-grey-light);
}
.pure-button.pure-button-primary,
.pure-button.pure-button-secondary,
.pure-button.pure-button-tertiary {
   margin: 0 0 5px 10px;
   border-radius: 5px;
   font-weight: normal;
}
.pure-button.disabled {
   cursor: default;
   opacity: 0.25;
}
// I'm currently trying to get this code to work for the Give button
#give-button.pure-button.pure-button-give {
  margin-top: 25px;
  border-radius: 5px;
  font-weight: normal;
  text-transform: uppercase;
  background-color: var(--uvalib-brand-orange);
  color: white !important;
  font-size: 1.2em;
}
#give-button.pure-button.pure-button-give:hover {
   background-color: var(--uvalib-grey-light);
   color: var(--uvalib-text-dark) !important;
}
// end Give button

button, button.pure-button:focus, a.pure-button:focus {
   @include be-accessible-button();
}
button.text-button:focus {
   @include be-accessible();
}

</style>