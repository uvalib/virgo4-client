<template>
   <div class="v4-select">
      <button ref="v4select" @click.stop="toggleExpand" class="v4-select" tabindex="0"
           @keyup.up.stop="handleKeypress"
           @keyup.down.stop="handleKeypress"
         :class="{attached: attached}" :aria-pressed="expanded" aria-haspopup="listbox"
         :style="{ 'background-color': background, padding: pad,
                  color: color, 'border': border }">
         <div class="wrap-select">
            <span class="selection">
               <span v-if="value && value.id" v-html="value.name"></span>
               <span v-else v-html="placeholder"></span>
               <i class="options-arrow fas fa-angle-down" :style="{ transform: rotation, color: color }"></i>
            </span>
         </div>
      </button>
      <transition name="grow"
         v-on:before-enter="beforeEnter" v-on:enter="enter"
         v-on:before-leave="beforeLeave" v-on:leave="leave">
         <ul tabindex="-1" ref="selectOptions" class="options" role="listbox" v-show="expanded"
            @keyup.stop='handleKeypress'
            v-bind:class="{right: alignment=='right', left: alignment=='left'}"
            :style="{ 'border': optborder }">
            <li v-for="src in selections" @click="optionClicked(src)"
               :class="{disabled: src.disabled, selected: src.id==value.id, highlighted: highlightedID == src.id}"
               class="option" :ref="`O${src.id}`" tabindex="-1"
               :key="src.id">
               <span v-html="src.name"></span>
            </li>
         </ul>
      </transition>
   </div>
</template>

<script>
export default {
   props: {
      alignment: {
         type: String,
         default: "left"
      },
      placeholder: {
         type: String,
         default: "Make a selection"
      },
      pad: {
         type: String,
         default: "0 10px"
      },
      background: {
         type: String,
         default: "var(--uvalib-brand-blue)"
      },
      border: {
        type: String,
        default: "1px solid var(--uvalib-grey-light)"
      },
      optborder: {
        type: String,
        default: "1px solid var(--uvalib-grey-light)"
      },
      color: {
         type: String,
         default: "white"
      },
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
         highlightedIdx: 0,
         highlightedID: 0,
         currVal: this.value
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
      handleKeypress() {
         //console.log("KEY "+event.keyCode)
         if (event.keyCode == 38 && this.highlightedIdx > 0) {
            // up arrow
            this.highlightedIdx--
            if ( this.expanded == false ) {
               this.toggleExpand()
            } else {
               this.setSelectedItem()
            }
         } else if (event.keyCode == 40 && this.highlightedIdx < this.selections.length-1) {
            // down arrow
            this.highlightedIdx++
            if ( this.expanded == false ) {
               this.expanded = true
            }
               this.setSelectedItem()

         } else if (event.keyCode == 13 ) {
            // enter toggles expand
            this.toggleExpand()
         } else if ( event.keyCode == 27 && this.expanded) {
            // esc closes
            this.expanded = false
            let v4sel = this.$refs.v4select
            v4sel.focus()
         } else if ( event.keyCode == 36  && this.expanded ) {
            // Home selects the first
            this.highlightedIdx = 0
            this.setSelectedItem()
         } else if ( event.keyCode == 35 && this.expanded ) {
            // end selects the last
            this.highlightedIdx = this.selections.length - 1
            this.setSelectedItem()
         }
      },
      setSelectedItem() {
         this.highlightedID = this.selections[this.highlightedIdx].id
         let item = this.$refs["O"+this.highlightedID][0]
         item.focus()
         this.currVal =  this.selections[this.highlightedIdx]
         this.$emit('input', this.currVal)
      },
      optionClicked(src) {
         if (src.disabled ) return
         this.$emit('input', src)
         this.currVal = src
         this.highlightedIdx = this.selections.findIndex( o => o.id == this.currVal.id)
         if (this.highlightedIdx > -1) {
            this.highlightedID = this.selections[this.highlightedIdx].id
            let item = this.$refs["O"+this.highlightedID][0]
            item.focus()
         }
      },
      globalClick() {
         this.expanded = false
      },
      toggleExpand() {
         this.expanded = !this.expanded
         setTimeout(() => {
            if (this.expanded) {
               if ( this.currVal ) {
                  this.highlightedIdx = this.selections.findIndex( o => o.id == this.currVal.id)
                  if (this.highlightedIdx > -1) {
                     this.highlightedID = this.selections[this.highlightedIdx].id
                     let item = this.$refs["O"+this.highlightedID][0]
                     item.focus()
                  }
               }
            } else {
               let v4sel = this.$refs.v4select
               v4sel.focus()
            }
         }, 260)
      },
      closeSources() {
        this.expanded = false;
      },
      beforeEnter: function(el) {
         el.style.height = '0'
      },
      enter: function(el) {
         el.style.height = (el.scrollHeight-10) + 'px'
         this.expandedItem = el
      },
      beforeLeave: function(el) {
         el.style.height = (el.scrollHeight-10) + 'px'
         this.expandedItem = el
      },
      leave: function(el) {
         el.style.height = '0'
      }
   }
};
</script>

<style lang="scss" scoped>
div.v4-select {
   align-self: stretch;
   position: relative;
}
button.v4-select {
  display: inline-block;
  outline: none;
  border-radius: 5px;
  cursor: pointer;
  color: white;
  text-align: left;
  padding: 0 10px;
  text-align: left;
  height:100%;
  width:100%;
}
button.v4-select:focus {
@include be-accessible();
   z-index: 10;
}
.wrap-select {
   height: 100%;
   align-items: center;
   justify-content: left;
   display: flex;
}
.v4-select.attached {
   border-radius: 5px 0 0 5px;
}
.v4-select .selection {
   display: inline-block;
   vertical-align: middle;
   white-space: nowrap;
   width: 100%;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
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
  min-width: 100%;
  text-align: left;
  background-color: var(--uvalib-brand-blue);
  color: white;
  cursor: pointer;
  padding: 0 0 10px 0;
  border-radius: 0 0 5px 5px;
  position: absolute;
  border: 1px solid var(--uvalib-light-blue);
  overflow: hidden;
  transition: 200ms ease-out;
  z-index: 5000;
  white-space: nowrap;
  display: grid;
  grid-auto-rows: auto;
  margin:0;
}

@media only screen and (min-width: 768px) {
   .v4-select .options.left  {
      left: -1px;
   }
   .v4-select .options.right  {
      left: -1px;
   }
}
@media only screen and (max-width: 768px) {
   .v4-select .options.left  {
      left: -1px;
   }
   .v4-select .options.right  {
      right: 0;
   }
}
.v4-select .option {
  align-items: stretch;
  justify-items: stretch;
  padding: 10px 15px;
  background-color: white;
  color: var(--uvalib-text-dark);
  font-weight: normal;
}
.v4-select .option.disabled {
  background-color:  white;
  cursor: default;
  color: var(--uvalib-grey-light);
}
.v4-select .option.disabled:hover {
  background-color:  initial;
  cursor: default;
  color: var(--uvalib-grey-light);
}
.v4-select .option:hover {
  @include apply-hover();
}
.v4-select .option.highlighted  {
  background-color:  var(--uvalib-blue-alt-light);
  color: var(--uvalib-text-dark);
  outline: none;
}
.v4-select .option.selected {
   background: var(--color-brand-blue);
   color: white;
}
</style>
