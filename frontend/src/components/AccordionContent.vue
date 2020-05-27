<template>
   <div class="accordion" tabindex="0" :id="id" 
      @click="accordionClicked" @keyup.stop.enter="accordionClicked" @keydown.space.prevent="accordionClicked">
      <div class="header-wrap" >
         <div v-if="showHeader" :class="layout" class="title" role=heading
            :style="{ background: background, color: color, borderWidth: borderWidth, borderStyle: borderStyle, borderColor: borderColor }"
            v-bind:aria-expanded="isExpanded" :aria-controls="contentID">
            <span class="text" v-html="title"></span>
            <i class="accordion-icon fas fa-angle-down" :style="{ transform: rotation }"></i>
         </div>
         <div class="accordion-buttons" v-if="hasControlSlot()"
            :style="{ background: background, color: color, borderWidth: borderWidth, borderStyle: borderStyle, borderColor: borderColor }">
            <slot name="controls">
            </slot>
         </div>
      </div>
       <transition name="accordion"
            v-on:before-enter="beforeEnter" v-on:enter="enter"
            v-on:before-leave="beforeLeave" v-on:leave="leave">
         <div :id="contentID" class="accordion-content" v-show="isExpanded" 
            :style="{ background: backgroundContent, color: color }" 
            @click.stop @keyup.stop.enter @keydown.space.prevent.stop>
            <slot></slot>
            <div v-if="closeText" @click="accordionClicked" class="footer"
               :style="{ background: background, color: color, borderWidth: borderWidth, borderStyle: borderStyle, borderColor: borderColor }" >
               <span v-html="closeText"></span>
               <i class="accordion-icon fas fa-angle-down" :style="{ transform: rotation }"></i>
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
      title: String,
      subtitle: String,
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
      autoCollapseOn: {
         default: null
      },
      autoExpandID: {
         type: String,
         default: ""
      },
      closeText: {
         type: String,
         default: "",
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
      autoCollapseOn() {
         if (this.isExpanded) {
            this.isExpanded = false
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
         return !this.isExpanded ||  this.isExpanded && this.closeText.length == 0
      },
      contentID() {
         return `accordion-conttent-${this.id}`
      }
   },
   methods: {
      hasControlSlot() {
         return this.$slots['controls']
      },
      accordionClicked() {
         this.$emit('accordion-clicked')
         this.isExpanded = !this.isExpanded
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

      .accordion-buttons {
         display: flex;
         flex-flow: row nowrap;
         justify-content: space-between;   
         align-items: center;
      }
   }

   .title, .footer {
      cursor: pointer;
      margin: 0;
      padding: 3px 12px;
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
      padding: 3px 12px 3px 0;
   }
   .title.wide i {
      position: absolute;
      right: 10px;
   }
   .title .text {
      padding-right: 5px;
   }

   .accordion-content {
      overflow: hidden;
      transition: 250ms ease-out;
      margin:0;
      padding:0;
      text-align: left;
   }
}
.accordion {
   outline: none;
}
.accordion:focus {
   box-shadow: 0 0 0 3px rgba(21, 156, 228, 0.4);
}
</style>
