<template>
   <div class="accordion">
      <div class="title" @click="accordionClicked" :class="layout"
         :style="{ background: background, color: color }">
         <span class="text" v-html="title"></span>
         <i class="accordion-icon fas fa-angle-down" :style="{ transform: rotation }"></i>
      </div>
       <transition name="accordion"
         v-on:before-enter="beforeEnter" v-on:enter="enter"
         v-on:before-leave="beforeLeave" v-on:leave="leave">
         <div class="accordion-content"  v-show="isExpanded" :style="{ background: background, color: color }">
            <slot></slot>
         </div>
      </transition>
   </div>
</template>

<script>
export default {
   props: {
      title: String,
      subtitle: String,
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
      }
   },
   data: function() {
      return {
         isExpanded: this.expanded,
         expandedItem: null
      };
   },
   computed: {
      rotation() {
         if (this.isExpanded) {
            return "rotate(180deg)"
         }
         return "rotate(0deg)"
      }
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
         this.expandedItem = el
         console.log("ENTER EXP: "+this.expandedItem)
         setTimeout( ()=> {
            this.$emit('accordion-expanded')
         }, 250)
      },
      beforeLeave: function(el) {
         el.style.height = el.scrollHeight + 'px'
         this.expandedItem = el
         console.log("BEFORE LEAVE EXP: "+this.expandedItem)
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
div.title {
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
