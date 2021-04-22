<template>
   <div class="accordion" :id="id"
      @click="accordionClicked" @keyup.stop.enter="accordionClicked" @keydown.space.prevent="accordionClicked">
      <div v-if="showHeader" :id="`${id}-header`"
         tabindex="0"
         :class="layout" class="title" role="button"
         :style="{ background: background, color: color, borderWidth: borderWidth, borderStyle: borderStyle, borderColor: borderColor }"
         :aria-expanded="expandedStr" :aria-controls="contentID">
         <slot name="title"></slot>
         <i class="accordion-icon fal" :style="{ transform: rotation }" :class="{'fa-minus': isExpanded,'fa-plus': !isExpanded}"></i>
      </div>
      <transition name="accordion"
            v-on:before-enter="beforeEnter" v-on:enter="enter"
            v-on:before-leave="beforeLeave" v-on:leave="leave">
         <div :id="contentID" class="accordion-content" v-show="isExpanded"
            :aria-labelledby="`${id}-header`" role="region"
            :style="{ background: backgroundContent, color: color }"
            @click.stop @keyup.stop.enter @keydown.space.stop>
            <slot></slot>
            <div v-if="hasFooterSlot" @click="accordionFooterClicked" class="footer"
               :style="{ background: background, color: color, borderWidth: borderWidth, borderStyle: borderStyle, borderColor: borderColor }" >
               <slot name="footer"></slot>
               <i class="accordion-icon fal" :style="{ transform: rotation }" :class="{'fa-minus': isExpanded,'fa-plus': !isExpanded}"></i>
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
         reqired: true
      },
      layoutChange: {
         default: null,
      },
      heightOffset: {
         type: Number,
         default: 0,
      },
      closeOthers: {
         type: Number,
         default: null,
      },
      autoExpandID: {
         type: String,
         default: ""
      },
      layout: {
         type: String,
         default: "normal"
      },
      background: {
         type: String,
         default: "#fff"
      },
      backgroundContent: {
         type: String,
         default: "#fff"
      },
      color: {
         type: String,
         default: "var(--uvalib-text-dark)"
      },
      borderWidth: {
         type: String,
         default: "1px 1px 1px 1px"
      },
      borderColor: {
         type: String,
         default: "var(--uvalib-grey-light)"
      },
      borderStyle: {
         type: String,
         default: "solid"
      },
      expanded: {
         default: false,
         type: Boolean
      },
      invert: {
         default: false,
         type: Boolean
      }
   },
   watch: {
      closeOthers() {
         if ( this.closeOthers > -1) {
            if ( this.closeOthers.toString() != this.id)
            this.isExpanded = false
         }
      },
      layoutChange() {
         if (this.isExpanded && this.id) {
            setTimeout( ()=> {
               let content = document.getElementById(this.id)
               if ( content) {
                  content.setAttribute("style", "height: inherit;")
               }
            })
         }
      },
      autoExpandID(newVal, _oldVal) {
         if (this.isExpanded === false && this.id && newVal != "") {
            if (this.id == newVal) {
               this.isExpanded = true
            }
         }
      }
   },
   data: function() {
      return {
         isExpanded: this.expanded,
      };
   },
   computed: {
      expandedStr() {
         if ( this.isExpanded ) {
            return "true"
         }
         return "false"
      },
      rotation() {
         if ( this.invert) {
            if (this.isExpanded) {
               return "rotate(0deg)"
            }
            return "rotate(180deg)"
         }
         if (this.isExpanded) {
            return "rotate(180deg)"
         }
         return "rotate(0deg)"
      },
      showHeader() {
         return !this.isExpanded ||  this.isExpanded && !this.hasFooterSlot
      },
      contentID() {
         return `accordion-conttent-${this.id}`
      },
      hasControlSlot() {
         return Object.prototype.hasOwnProperty.call(this.$slots, 'controls')
      },
      hasFooterSlot() {
         return Object.prototype.hasOwnProperty.call(this.$slots, 'footer')
      },
   },
   methods: {
      accordionClicked() {
         this.$emit('accordion-clicked')
         this.isExpanded = !this.isExpanded
      },
      accordionFooterClicked() {
         this.accordionClicked()
         setTimeout( ()=> {
            let hdr = document.getElementById(`${this.id}-header`)
            if (hdr) {
               hdr.focus()
            }
         }, 250)
      },
      beforeEnter: function(el) {
         document.getElementById(this.contentID).style.overflow = "hidden"
         el.style.height = '0'
      },
      enter: function(el) {
         el.style.height = `${el.scrollHeight - this.heightOffset}px`
         setTimeout( ()=> {
            this.$emit('accordion-expanded')
             document.getElementById(this.contentID).style.overflow = "visible"
         }, 250)
      },
      beforeLeave: function(el) {
         el.style.height = `${el.scrollHeight - this.heightOffset}px`
      },
      leave: function(el) {
         document.getElementById(this.contentID).style.overflow = "hidden"
         el.style.height = '0'
         setTimeout( ()=> {
            this.$emit('accordion-collapsed')
         }, 250)
      }
   }
};
</script>

<style lang="scss" scoped>
.accordion {
   margin:0;
   font-size: 1em;

   .header-wrap {
      display: flex;
      flex-flow: row nowrap;
      align-content: center;
      justify-content: space-between;
      align-items: stretch;
      height: 100%;
   }

   .title, .footer {
      cursor: pointer;
      margin: 0;
      padding: 5px 10px;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: space-between;
      position: relative;
      flex-grow: 1;
      text-align: left;

      .accordion-icon {
         margin-left: auto;
         font-size: 1.25em;
         transform: rotate(0deg);
         transition-duration: 250ms;
      }
   }

   .footer {
      padding: 3px 12px 3px 5px;
      font-weight: normal;
   }

   .title.narrow {
      justify-content: flex-start;
      padding: 0;
   }

   .accordion-content {
      overflow: hidden;
      transition: 250ms ease-out;
      margin:0;
      padding:0;
      text-align: left;
   }
}
.title {
   &:focus {
      @include be-accessible();
   }
}
</style>
