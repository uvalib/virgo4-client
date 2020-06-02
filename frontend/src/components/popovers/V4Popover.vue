<template>
   <v-popover placement="top-end" class="v4-popover" trigger="manual" :open="isOpen" @hide="hide" @show="opened">
      <V4Button  :id="`${id}-trigger`" :mode="triggerType" :aria-label="alabel" :aria-pressed="isOpen" @click="toggle" @esc="hide">
        <slot name="trigger"></slot>
      </V4Button>
      <div :id="id" class="v4-popover-dialog" role="dialog" :style="{'max-width': maxWidth}" slot="popover"
          :aria-labelledby="`${id}-title`" :aria-describedby="`${id}-content`" >
         <div class="v4-popover-title" :id="`${id}-title`">{{title}}</div>
         <div class="v4-popover-content" :id="`${id}-content`">
            <slot name="content"></slot>
         </div>
         <div class="controls">
            <slot v-if="$slots['controls']" name="controls"></slot>
            <V4Button v-else mode="tertiary" :id="`${id}-close`" class="close" @click="hide" @esc="hide"
               :focusNextOverride="true" @tabnext="lastFocusTabbed" 
               :focusBackOverride="true" @tabback="lastFocusTabbed" >
                Close
            </V4Button>
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
      firstFocusID: {
         type: String,
         default: ""
      }, 
      lastFocusID: {
         type: String,
         default: ""
      },
      title: {
         type: String,
         required: true
      },
      alabel: String,
      maxWidth: {
         type: String,
         default: "inherit"
      },
      triggerType: {
         type: String,
         default: "text"
      }
   },
   data: function() {
      return {
         isOpen: false
      }
   },
   methods: {
      lastFocusTabbed() {
         let tgt = this.firstFocusID
         if (tgt == "") {
            tgt = this.id+"-close"
         }
         this.setFocus(tgt)
      },
      firstFocusBackTabbed() {
         let tgt = this.lastFocusID
         if (tgt == "") {
            tgt = this.id+"-close"
         }
         this.setFocus(tgt)
      },
      setFocus(id) {
         let ele = document.getElementById(id)
         if (ele ) {
            ele.focus()
         } else {
            // if focus target doesn't exist, focus on the one item that is defined
            // by the basic vrpopover template; the close button
            ele = document.getElementById(this.id+"-close")
            if (ele) {
               ele.focus()
            }
         }
      },
      hide() {
         this.isOpen = false
         this.$emit('closed')
         this.setFocus(`${this.id}-trigger`)
      },
      toggle() {
         this.isOpen = !this.isOpen
         if ( this.isOpen == false) {
           this.setFocus(`${this.id}-trigger`)
         }
      },
      opened() {
         setTimeout(()=>{
            let tgt = this.firstFocusID
            if (tgt == "") {
               tgt = this.id+"-close"
            }
            this.setFocus(tgt)
            this.$emit('opened')
         }, 260)
      },
      hasControlSlot() {
         return this.$slots['controls']
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

   .controls {
      font-size: 0.9em;
      text-align: right;
      margin: 0 5px;
   }
}
</style>
