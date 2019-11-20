<template>
   <div class="accordion">
      <div v-if="showHeader" class="title" @click="accordionClicked" :class="layout"
         :style="{ background: background, color: color }">
         <span class="text" v-html="title"></span>
         <i class="accordion-icon fas fa-angle-down" :style="{ transform: rotation }"></i>
      </div>
       <transition name="accordion"
         v-on:before-enter="beforeEnter" v-on:enter="enter"
         v-on:before-leave="beforeLeave" v-on:leave="leave">
         <div :id="id" class="accordion-content"  v-show="isExpanded" :style="{ background: background, color: color }">
            <slot></slot>
            <div v-if="closeText" @click="accordionClicked" class="footer">
               <b>{{ closeText }}</b>
               <i class="accordion-icon fas fa-angle-down" :style="{ transform: rotation }"></i>
            </div>
         </div>
      </transition>
   </div>
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
      color: {
         type: String,
         default: "#666666"
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
      layoutChange() {
         if (this.isExpanded && this.id) {
            setTimeout( ()=> {
               let content = document.getElementById(this.id)
               content.setAttribute("style", "height: inherit;")
            })
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
   text-align: right;
   cursor: pointer;
   margin: 0;
   background: #f5f5f5;
   padding: 3px 12px;
   display: flex;
   flex-flow: row nowrap;
   align-content: center;
   justify-content: space-between;
}
div.title, div.footer {
   background: white;
}
div.title.narrow {
   justify-content: flex-start;
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
</style>
