<template>
   <h3 tabindex="0" class="accordion" v-bind:aria-expanded="isExpanded" role="button" 
      @click="accordionClicked" @keyup.stop.enter="accordionClicked" @keydown.space.prevent="accordionClicked">
      <div  v-if="showHeader" class="title" :class="layout"
         :style="{ background: background, color: color, borderWidth: borderWidth, borderStyle: borderStyle, borderColor: borderColor }">
         <span class="text" v-html="title"></span>
         <span class="accordion-buttons">
            <i class="accordion-icon fas fa-angle-down" :style="{ transform: rotation }"></i>
            <slot name="controls">
            </slot>
         </span>
      </div>
       <transition name="accordion"
         v-on:before-enter="beforeEnter" v-on:enter="enter"
         v-on:before-leave="beforeLeave" v-on:leave="leave">
         <div :id="id" class="accordion-content" v-show="isExpanded" :style="{ backgroundContent: backgroundContent, color: color }" 
            @click.stop @keyup.stop.enter @keydown.space.prevent.stop>
            <slot></slot>
            <div v-if="closeText" @click="accordionClicked" class="footer">
               <b>{{ closeText }}</b>
               <i class="accordion-icon fas fa-angle-down" :style="{ transform: rotation }"></i>
            </div>
         </div>
      </transition>
   </h3>
</template>

<script>
export default {
   props: {
      id: String,
      title: String,
      subtitle: String,
      layoutChange: {
         default: null,
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
   },
   methods: {
      accordionClicked() {
         this.$emit('accordion-clicked')
         this.isExpanded = !this.isExpanded
      },
      beforeEnter: function(el) {
         el.style.height = '0'
      },
      enter: function(el) {
         el.style.height = el.scrollHeight + 'px'
         setTimeout( ()=> {
            this.$emit('accordion-expanded')
         }, 250)
      },
      beforeLeave: function(el) {
         el.style.height = el.scrollHeight + 'px'
      },
      leave: function(el) {
         el.style.height = '0'
         setTimeout( ()=> {
            this.$emit('accordion-collapsed')
         }, 250)
      }
   }
};
</script>

<style scoped>
.accordion {
   margin:0;
   font-size: 1em;
}
.accordion-content {
   overflow: hidden;
   transition: 250ms ease-out;
   background: white;
   margin:0;
   padding:0;
   text-align: left;
}
div.title, div.footer {
   padding: 0px 8px;
   cursor: pointer;
   margin: 0;
   background: white;
   padding: 3px 12px;
   display: flex;
   flex-flow: row nowrap;
   align-content: center;
   justify-content: space-between;
   position: relative;
   outline: none;
}
.accordion {
   outline: none;
}
.accordion:focus {
   box-shadow: 0 0 0 3px rgba(21, 156, 228, 0.4);
}
div.title.narrow {
   justify-content: flex-start;
   padding: 3px 12px 3px 0;
}
div.title.wide i {
   position: absolute;
   right: 10px;
}
.title .text {
   padding-right: 5px;
}
div.title:hover {
   color: #333;
}
div.title  .accordion-icon {
   font-size: 1.25em;
   transform: rotate(0deg);
   transition-duration: 250ms;
}
.accordion-buttons {
   display: flex;
   flex-flow: row nowrap;
}
</style>
