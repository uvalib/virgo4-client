<template>
   <div @click="expandClick" class="v4-select" v-bind:class="{attached: attached}">
      <div class="wrap-select">
         <span class="selection">
            <span>{{value.name}}</span>
            <i class="options-arrow fas fa-angle-down" :style="{ transform: rotation }"></i>
         </span>
      </div>
      <transition name="grow"
         v-on:before-enter="beforeEnter" v-on:enter="enter"
         v-on:before-leave="beforeLeave" v-on:leave="leave">
         <div class="options" v-if="expanded">
            <div @click="$emit('input', src)" class="option" v-for="src in selections" :key="src.id">
               {{src.name}}
            </div>
         </div>
      </transition>
   </div>
</template>

<script>
export default {
   props: {
      selections: {
         type: Array,
         required: true
      },
      attached: {
         type: Boolean,
         default: true
      },
      value: {
         type: Object
      }
   },
   data: function()  {
      return {
         expanded: false,
      }
   },
   watch: {
      expanded() {   
         if (this.expanded === false) {
            window.removeEventListener("click", this.globalClick)
         } else {
            window.addEventListener("click", this.globalClick)
         }
      }
   },
   computed: {
      rotation() {
         if (this.expanded) {
            return "rotate(180deg)"
         }
         return "rotate(0deg)"
      },
   },
   methods: {
      globalClick() {
         this.expanded = false
      },
      expandClick(e) {
         e.stopPropagation()
        this.expanded = !this.expanded
      },
      closeSources() {
        this.expanded = false;
      },
      beforeEnter: function(el) {
         el.style.height = '0'
      },
      enter: function(el) {
         el.style.height = (el.scrollHeight-20) + 'px'
         this.expandedItem = el
      },
      beforeLeave: function(el) {
         el.style.height = (el.scrollHeight-20) + 'px'
         this.expandedItem = el
      },
      leave: function(el) {
         el.style.height = '0'
      }
   }
};
</script>

<style scoped>
.v4-select {
  display: inline-block;
  outline: none;
  border: 1px solid var(--color-brand-blue);
  border-radius: 5px;
  cursor: pointer;
  background-color: var(--color-brand-blue);
  color: white;
  position: relative;
  text-align: left;
  align-self: stretch;
  padding: 0 5px;
}
.wrap-select {
   height: 100%;
   align-items: center;
   justify-content: center;
   display: flex;
}
.v4-select.attached {
   border-radius: 5px 0 0 5px;
}
.v4-select .selection {
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
}
.v4-select .options-arrow {
  margin: 0 0 0 5px;
  cursor: pointer;
  color: white;
  transform: rotate(0deg);
  transition-duration: 250ms;
  display: inline-block;
  vertical-align: middle;
}
.v4-select .options {
  text-align: left;
  background-color: var(--color-brand-blue);
  color: white;
  cursor: pointer;
  padding: 10px 0;
  border-radius: 0 0 5px 5px;
  position: absolute;
  left: -1px;
  right: -1px;
  border: 1px solid var(--color-brand-blue);
  border-top: 1px solid var(--color-lightest-blue);
  font-size: 0.9em;
  overflow: hidden;
  transition: 200ms ease-out;
  z-index: 5000;
}
.v4-select .option {
  padding: 4px 10px;
}
.v4-select .option:hover {
  background-color:  var(--color-light-blue);
}
</style>
