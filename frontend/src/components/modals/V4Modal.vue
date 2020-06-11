<template>
   <div class="v4-modal-wrapper">
      <slot name="button"></slot>
      <transition name="fade">
         <div class="v4-modal-dimmer" v-if="isOpen">
            <div role="dialog" :aria-labeledby="`${id}-title`" :id="id" class="v4-modal">
               <div :id="`${id}-title`" class="v4-modal-title">{{title}}</div>
               <div class="v4-modal-content">
                  <slot name="content"></slot>
               </div>
               <div class="v4-modal-controls">
                  <slot v-if="hasControlSlot()" name="controls"></slot>
                  <V4Button v-else mode="tertiary" :id="`${id}-close`" class="close" @click="hide" 
                     :focusNextOverride="true" @tabnext="lastFocusTabbed" 
                     :focusBackOverride="true" @tabback="lastFocusTabbed" >
                        Close
                  </V4Button>
               </div>
            </div>
         </div>
      </transition>
   </div>
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
      firstFocusID: {
         type: String,
         default: ""
      }, 
      lastFocusID: {
         type: String,
         default: ""
      },
      buttonID: {
         type: String,
         required: true
      }
   },
   data: function()  {
      return {
         isOpen: false
      }
   },
   methods: {
      hide() {
         this.isOpen=false
         this.setFocus(this.buttonID)
         this.$emit('closed')
      },
      show() {
         this.isOpen=true
         setTimeout(()=>{
            let tgt = this.firstFocusID
            if (tgt == "") {
               tgt = this.id+"-close"
            }
            this.setFocus(tgt)
            this.$emit('opened')
         }, 150)
      },
      hasControlSlot() {
         return this.$slots['controls']
      },
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
         } 
      },
   },
}
</script>

<style lang="scss" scoped>
.v4-modal-dimmer {
   position: fixed;
   left: 0;
   top: 0;
   width: 100%;
   height: 100%;
   z-index: 1000;
   background: rgba(0, 0, 0, 0.2);
}
div.v4-modal {
   color: var(--uvalib-text);
   position: fixed;
   height: auto;
   top: 15%;
   z-index: 8000;
   background: white;
   left: 50%;
   transform: translate(-50%, 0%);
   box-shadow: $v4-box-shadow;
   border-radius: 5px;

   div.v4-modal-content {
      padding: 10px 10px 0 10px;
      text-align: left;
   }
   div.v4-modal-title {
      background: var(--uvalib-teal-lightest);
      font-size: 1.1em;
      color: var(--uvalib-text-dark);
      font-weight: bold;
      padding: 10px;
      border-radius: 5px 5px 0 0;
   }
   div.v4-modal-controls {
      padding: 0 10px 10px 10px;
      font-size: 0.9em;
      text-align: right;
      margin: 0 5px;
   }
}

</style>