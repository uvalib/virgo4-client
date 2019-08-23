<template>
   <div class="accordion">
      <div class="title" @click="accordionClicked" :class="align">
         <span class="text">{{title}}</span>
         <i class="accordion-icon fas fa-angle-down" v-bind:style="{ transform: rotation }"></i>
      </div>
       <transition name="accordion"
         v-on:before-enter="beforeEnter" v-on:enter="enter"
         v-on:before-leave="beforeLeave" v-on:leave="leave">
         <div class="accordion-content"  v-show="isExpanded">
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
               this.expandedItem.style.height = this.expandedItem.scrollHeight + 'px'
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
      },
      beforeLeave: function(el) {
         el.style.height = el.scrollHeight + 'px'
         this.expandedItem = el
      },
      leave: function(el) {
         el.style.height = '0'
      }
   }
};
</script>

<style scoped>
.accordion-content {
   overflow: hidden;
   transition: 500ms ease-out;
   background: white;
   padding: 0 10px 5px 10px;
}
div.title.right {
   text-align: right;
}
div.title.left {
   text-align: left;
}
div.title {
   padding: 0px 8px;
   text-align: right;
   cursor: pointer;
   margin: 2px 0 0 0;
   color: #666;
   background: white;
}
.title .text {
   padding-right: 5px;
}
div.title :hover {
   color: #444;
}
div.title  .accordion-icon {
   font-size: 1.25em;
   position: relative;
   top: 2px;
   color:#999;
   cursor: pointer;
   transform: rotate(0deg);
   transition-duration: 500ms;
}
</style>