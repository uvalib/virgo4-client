<template>
   <span tabindex="0" class="skip-to" id="skip-to"
      role="menu" :aria-expanded="menuOpen.toString()"
      aria-label="Skip to menu"
      @click.stop="toggleNavMenu" @keyup.prevent.stop.enter="toggleNavMenu"
      @keyup.esc="globalClick"
      @keydown.space.prevent.stop="toggleNavMenu"
      @keydown.down.prevent.stop="nextMenu" @keydown.up.prevent.stop="prevMenu"
      @keyup.down.prevent.stop @keyup.up.prevent.stop
   >
      <span class="menu-header">
         <span>Skip To</span>
         <i class="fas fa-caret-down submenu-arrow" v-bind:style="{ transform: rotation }"></i>
      </span>
      <transition name="grow"
         v-on:before-enter="beforeEnter" v-on:enter="enter"
         v-on:before-leave="beforeLeave" v-on:leave="leave">
         <ul v-if="menuOpen" class="skip-menu"  @keydown.space.prevent.stop role="group">
            <li class="submenu" role="menuitem" tabindex="-1" id="skipnav"
               @click.prevent.stop="skipToNav"
               @keydown.space.prevent.stop="skipToNav"
               @keyup.prevent.stop.enter="skipToNav"
            >
               Navigation
            </li>
            <li class="submenu" role="menuitem" tabindex="-1" id="skipmain"
               @click.prevent.stop="skipToMain"
               @keydown.space.prevent.stop="skipToMain"
               @keyup.prevent.stop.enter="skipToMain"
            >
               Main Content
            </li>
             <li v-if="isSearchPage" class="submenu" role="menuitem" tabindex="-1" id="skipsearch"
               @click.prevent.stop="skipToSearch"
               @keydown.space.prevent.stop="skipToSearch"
               @keyup.prevent.stop.enter="skipToSearch"
            >
               Search
            </li>
         </ul>
      </transition>
   </span>
</template>

<script>
export default {
   data: function() {
      return {
         menuOpen: false,
         menuIdx: 0,
         menuItem: ["skipnav", "skipmain", "skipsearch"],
      }
   },
   computed: {
      isSearchPage() {
         return this.$route.path == "/" || this.$route.path == "/search"
      },
      rotation() {
         if ( this.menuOpen ) {
            return "rotate(180deg)"
         }
         return "rotate(0deg)"
      },
   },
   methods: {
      skipToMain() {
         this.toggleNavMenu()
         let m = document.getElementById("v4-main")
         m.focus( {preventScroll:true} )
      },
      skipToNav() {
         let m = document.getElementById("searchmenu")
         m.focus( {preventScroll:true} )
         this.toggleNavMenu()
      },
      skipToSearch() {
         let s = document.getElementById("search")
         if ( s) {
            s.focus( {preventScroll:true} )
         } else {
            s = document.getElementsByClassName("field")[0]
            if ( s ) {
               s.focus( {preventScroll:true} )
            }
         }
         this.toggleNavMenu()
      },
      focusCurrentSubmenu() {
         this.$nextTick( () => {
            let menu = document.getElementById(this.menuItem[this.menuIdx])
            menu.focus()
         })
      },
      nextMenu() {
         if ( this.menuOpen) {
            this.menuIdx++
            if (this.menuIdx == this.menuItem.length) {
               this.menuIdx = 0
            }
         } else {
            this.toggleNavMenu()
         }
         this.focusCurrentSubmenu()
      },
      prevMenu() {
         if ( this.menuOpen) {
            this.menuIdx--
            if (this.menuIdx < 0) {
               this.menuIdx = this.menuItem.length-1
            }
         } else {
            this.toggleNavMenu()
            this.menuIdx = this.menuItem.length-1
         }
         this.focusCurrentSubmenu()
      },
      globalClick() {
         this.menuOpen = false
         document.getElementById("skip-to").blur()
      },
      toggleNavMenu() {
         this.menuOpen = !this.menuOpen
         this.menuIdx = 0
         if (this.menuOpen) {
            this.focusCurrentSubmenu()
         }
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
   },
   created() {
      window.addEventListener("click", this.globalClick)
   },
   destroyed() {
      window.removeEventListener("click", this.globalClick)
   },
}
</script>

<style scoped lang="scss">
.skip-to {
   background: white;
   color: var(--uvalib-text);
   padding: 0;
   text-align: left;
   box-shadow: $v4-box-shadow;
   position: absolute;
   transform: translateY(-150%);
   left: 0;
   z-index: 9000;
   width: 125px;
   text-align: left;
   transition: transform 200ms;
   &:focus {
      @include be-accessible-light();
   }
   &:active, &:focus, &:hover, &:focus-within {
      transform: translateY(0%);
   }

   .menu-header {
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: space-between;
      padding: 5px 10px;
      border-bottom: 1px solid var(--uvalib-grey);
      span {
         margin-right: 10px;
         display: inline-block;
      }
      .submenu-arrow {
         transform: rotate(0deg);
         transition-duration: 200ms;
      }
   }

   .skip-menu {
      margin-top: 5px;
      transition: 200ms ease-out;
      list-style: none;
      padding: 0;
      margin: 0;
      .submenu {
         cursor: pointer;
         padding: 5px 10px;
         border-radius: 0;
         outline: 0;

         &:hover {
            background-color: var(--uvalib-brand-blue-lightest);
            color: var(--uvalib-text-dark);
         }
         &:focus {
            background-color: var(--uvalib-brand-blue-lightest);
            color: var(--uvalib-text-dark);
         }
      }
   }
}
</style>
