<template>
   <button tabindex="0" class="v4-button"
      @keydown.esc="escClicked"
      :class="{'text-button': props.mode=='text',
               'icon-button': props.mode=='icon',
               'link-button': props.mode=='link',
               'primary-button': props.mode == 'primary',
               'small-button': props.mode == 'small',
               'tertiary-button': props.mode == 'tertiary'}"
      @click.prevent.stop="clicked" @keydown.prevent.stop.enter="clicked" @keydown.space.prevent.stop="clicked">
      <slot></slot>
   </button>
</template>

<script setup>
const props = defineProps({
   mode: {
      type: String,
      required: true
   },
   url: {
      type: String,
      default: ""
   },
   target: {
      type: String,
      default: ""
   },
})
const emit = defineEmits( ['click', 'esc' ] )

const escClicked = (() => {
   emit('esc')
})

const clicked = (() => {
   if ( props.url != "") {
      if (props.target != ""){
         window.open(props.url, props.target)
      } else{
         window.location.href = props.url
      }
   }
   emit('click')
})
</script>

<style lang="scss" scoped>
button.v4-button {
   @include base-button();
}
button.text-button {
   border: none;
   background: none;
   padding: 0;
   font-weight: 500;
   color: var(--color-link);
   cursor: pointer;
   display: inline-block;
   border-radius: 0;
   &:hover {
      opacity: 1;
      text-decoration: underline;
      background: none;
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
button.v4-button.link-button {
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
.v4-button.primary-button, .v4-button.small-button {
   @include primary-button();
}

.v4-button.small-button {
   padding: 4px 12px;
   color: white;
   border-radius: 5px;
   font-weight: normal;
   margin: 0;
}

.v4-button.tertiary-button {
   background-color: var(--uvalib-grey-lightest);
   border: 1px solid var(--uvalib-grey);
   color: black;
   margin: 0 0 5px 10px;
   border-radius: 5px;
   font-weight: normal;
   &:focus {
      @include be-accessible();
   }
   &:hover {
      background-color: var(--uvalib-grey-light);
      background-image: -webkit-gradient(linear,left top,left bottom,from(transparent),color-stop(40%,rgba(0,0,0,.05)),to(rgba(0,0,0,.1)));
      background-image: linear-gradient(transparent,rgba(0,0,0,.05) 40%,rgba(0,0,0,.1));
   }
}

.v4-button.disabled, .v4-button:disabled {
   cursor: default;
   opacity: 0.25;
}
</style>