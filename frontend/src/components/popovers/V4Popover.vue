<template>
   <v-popover placement="top-end" class="v4-popover" trigger="manual" :open="isOpen" @hide="hide" @show="opened">
      <V4Button  :id="`${id}trigger`" mode="text" :aria-pressed="isOpen" @click="toggle" @esc="hide">
        <slot name="trigger"></slot>
      </V4Button>
      <div class="v4-popover-dialog" role="dialog" :style="{'max-width': maxWidth}" slot="popover">
         <div tabindex="-1" :id="id" class="v4-popover-title">
           {{title}}
         </div>
         <div class="v4-popover-content">
            <slot name="content"></slot>
         </div>
         <div v-if="hasControlSlot" class="ctls">
            <slot name="controls"></slot>
         </div>
         <div class="ctls">
             <V4Button mode="tertiary" class="close" @click="hide">Close</V4Button>
         </div>
      </div>
   </v-popover>
</template>

<script>
export default {
   props: {
      id: {
         type: String,
         required: true
      },
      title: {
         type: String,
         required: true
      },
      maxWidth: {
         type: String,
         default: "inherit"
      }
   },
   data: function() {
      return {
         isOpen: false
      }
   },
   methods: {
      focusTrigger() {
         let ele = document.getElementById(`${this.id}trigger`)
         if (ele ) {
            ele.focus()
         }
      },
      hide() {
         this.isOpen = false
         this.focusTrigger()
      },
      toggle() {
         this.isOpen = !this.isOpen
         if ( this.isOpen == false) {
           this.focusTrigger()
         }
      },
      opened() {
         setTimeout(()=>{
            document.getElementById(this.id).focus()
         },300)
      },
      hasControlSlot() {
         return !!this.$slots.controls
      }
   }
};
</script>
<style lang="scss" scoped>
.v4-popover-dialog {
   background: white;
   box-shadow: $v4-box-shadow;
   color: var(--uvalib-text);
   font-weight: normal;
   display: inline-block;
   border-radius: 5px;
   border: 1px solid var(--uvalib-grey-dark);

   .v4-popover-title {
      padding: 5px 10px;
      color: white;
      background-color: var(--uvalib-grey-dark);
      font-weight: 500;
      text-align: center;
   }

   .v4-popover-content {
      margin: 0;
      padding: 15px 20px;
      font-weight: normal;
   }

   .ctls {
      font-size: 0.9em;
      text-align: right;
      margin: 0 5px;
   }
}
</style>
