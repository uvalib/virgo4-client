<template>
   <div class="accordion">
      <div class="title" @click="accordionClicked" :class="align"
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
      align: {
         type: String,
         default: "right"
      },
      background: {
         type: String,
         default: "#fff"
      },
      color: {
         type: String,
         default: "#666666"
      },
      watched: {
         type: Array,
         default: null
      },
      expanded: {
         default: false,
         type: Boolean
      }
   },
   watch: {
      watchCount () {
         if (this.isExpanded) {
            setTimeout( () => {
               this.expandedItem.style.height = (this.expandedItem.scrollHeight-5) + 'px'
            }, 500)
         }
      }
   },
   data: function() {
      return {
         isExpanded: this.expanded,
         expandedItem: null
      };
   },
   computed: {
      watchCount() {
         if (this.watched == null) return 0
         return this.watched.length
      },
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
         setTimeout( ()=> {
            this.$emit('accordion-expanded')
         }, 250)
      },
      beforeLeave: function(el) {
         el.style.height = el.scrollHeight + 'px'
         this.expandedItem = el
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
div.title.right {
   text-align: right;
}
div.title.left,  div.title.left-narrow {
   text-align: left;
}
div.title.left-narrow {
   padding: 0;
}
div.title.left-narrow .accordion-icon {
   float: unset;
}

div.title.left .accordion-icon {
   float: right;
}
div.title {
   padding: 0px 8px;
   text-align: right;
   cursor: pointer;
   margin: 0;
   background: #f5f5f5;
   padding: 3px 12px;
}
.title .text {
   padding-right: 5px;
}
div.title:hover {
   color: #333;
}
div.title  .accordion-icon {
   font-size: 1.25em;
   position: relative;
   top: 2px;
   cursor: pointer;
   transform: rotate(0deg);
   transition-duration: 250ms;
   margin-left:10px;
}
</style>
