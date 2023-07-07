<template>
   <span tabindex="0" class="skip-to" id="skip-to"
      role="complementary"
      aria-labelledby="skip-to-label"
      @click.stop="toggleNavMenu" @keyup.prevent.stop.enter="toggleNavMenu"
      @keyup.esc="globalClick"
      @keydown.space.prevent.stop="toggleNavMenu"
      @keydown.down.prevent.stop="nextMenu" @keydown.up.prevent.stop="prevMenu"
      @keyup.down.prevent.stop @keyup.up.prevent.stop
   >
      <span class="menu-header" role="button" aria-haspopup="true" :aria-expanded="menuOpen.toString()">
         <span id="skip-to-label">Skip To</span>
         <i class="fas fa-caret-down submenu-arrow" v-bind:style="{ transform: rotation }"></i>
      </span>
      <transition name="grow"
         v-on:before-enter="beforeEnter" v-on:enter="enter"
         v-on:before-leave="beforeLeave" v-on:leave="leave">
         <ul v-if="menuOpen" class="skip-menu"  @keydown.space.prevent.stop role="menu">
            <li class="submenu" id="skipnav" role="none" tabindex="-1"
               @click.prevent.stop="skipToNav"
               @keydown.space.prevent.stop="skipToNav"
               @keyup.prevent.stop.enter="skipToNav"
            >
               <a tabindex="-1" role="menuitem" href>Navigation</a>
            </li>
            <li class="submenu" role="none" id="skipmain" tabindex="-1"
               @click.prevent.stop="skipToMain"
               @keydown.space.prevent.stop="skipToMain"
               @keyup.prevent.stop.enter="skipToMain"
            >
               <a tabindex="-1" role="menuitem" href>Main Content</a>
            </li>
             <li v-if="isSearchPage" class="submenu" role="none" id="skipsearch" tabindex="-1"
               @click.prevent.stop="skipToSearch"
               @keydown.space.prevent.stop="skipToSearch"
               @keyup.prevent.stop.enter="skipToSearch"
            >
               <a tabindex="-1" role="menuitem" href>Search</a>
            </li>
         </ul>
      </transition>
   </span>
</template>

<script setup>
import {ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const menuOpen = ref(false)
const menuIdx = ref(0)
const menuItem = ref(["skipnav", "skipmain", "skipsearch"])

const isSearchPage = computed( () => {
   return route.path == "/" || route.path == "/search"
})
const rotation = computed( () => {
   if ( menuOpen.value ) {
      return "rotate(180deg)"
   }
   return "rotate(0deg)"
})

function skipToMain() {
   toggleNavMenu()
   let m = document.getElementById("v4-main")
   m.focus( {preventScroll:true} )
}
function skipToNav() {
   let m = document.getElementsByClassName("p-menubar-root-list")[0]
   m.focus( {preventScroll:true} )
   m = document.getElementsByClassName("p-menuitem")[0]
   m.classList.add("p-focus")
   toggleNavMenu()
}
function skipToSearch() {
   let s = document.getElementById("search")
   if ( s) {
      s.focus( {preventScroll:true} )
   } else {
      s = document.getElementsByClassName("field")[0]
      if ( s ) {
         s.focus( {preventScroll:true} )
      }
   }
   toggleNavMenu()
}
function focusCurrentSubmenu() {
   nextTick( () => {
      let menu = document.getElementById(menuItem.value[menuIdx.value])
      menu.focus()
   })
}
function nextMenu() {
   if ( menuOpen.value ) {
      menuIdx.value++
      if (menuIdx.value == menuItem.value.length) {
         menuIdx.value = 0
      }
   } else {
      toggleNavMenu()
   }
   focusCurrentSubmenu()
}
function prevMenu() {
   if ( menuOpen.value ) {
      menuIdx.value--
      if (menuIdx.value < 0) {
         menuIdx.value = menuItem.value.length-1
      }
   } else {
      toggleNavMenu()
      menuIdx.value = menuItem.value.length-1
   }
   focusCurrentSubmenu()
}
function globalClick() {
   menuOpen.value = false
   document.getElementById("skip-to").blur()
}
function toggleNavMenu() {
   menuOpen.value = !menuOpen.value
   menuIdx.value = 0
   if (menuOpen.value) {
      focusCurrentSubmenu()
   }
}
function beforeEnter(el) {
   el.style.height = '0'
}
function enter(el) {
   el.style.height = el.scrollHeight + 'px'
}
function beforeLeave(el) {
   el.style.height = el.scrollHeight + 'px'
}
function leave(el) {
   el.style.height = '0'
}

onMounted(() => {
   window.addEventListener("click", globalClick)
}),
onUnmounted(() => {
   window.removeEventListener("click", globalClick)
})
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
