<template>
   <div class="shelf-browse">
      <div class="working" v-if="shelfStore.lookingUp" >
         <V4Spinner message="Looking up items..."/>
      </div>
      <template v-else>
         <div class="info">
            <div class="line">
               <span class="label">Title Searched:</span>
               <router-link :to="backURL" class="to-item`">
                  <span class="item-title" v-html="origTitle"></span>
               </router-link>
            </div>
            <div class="line">
               <span class="label">Call Number:</span>
               <span class="item-call" v-html="origCallNumber"></span>
            </div>
         </div>
         <div class="browse-controls full">
            <VirgoButton :disabled="!shelfStore.hasPriorItem" @click="browsePrior()" aria-label="previous shelf" icon="fal fa-arrow-left" label="Previous"/>
            <span class="range" aria-live="polite"><b>CATALOG RANGE:</b>{{firstCall}}&nbsp;-&nbsp;{{lastCall}}</span>
            <VirgoButton :disabled="!shelfStore.hasNextItem" @click="browseNext()" aria-label="next shelf" icon="fal fa-arrow-right" label="Next" iconPos="right"/>
         </div>
         <div class="view-mode">
            <button tabindex="0" class="view" id="view"
               @click.stop="toggleViewMenu"
               @keyup.esc="closeViewMenu"
               @key.down.prevent.stop.enter="toggleViewMenu"
               @keydown.down.prevent.stop="nextMenu"
               @keydown.up.prevent.stop="prevMenu"
               @keyup.down.prevent.stop @keyup.up.prevent.stop
            >
               <span class="select-header" aria-haspopup="listbox">
                  <span v-html="viewMode"></span>
                  <i class="dd-caret fas fa-caret-down" v-bind:style="{ transform: rotation }"></i>
               </span>
               <transition name="grow"
                  v-on:before-enter="beforeEnter" v-on:enter="enter"
                  v-on:before-leave="beforeLeave" v-on:leave="leave"
               >
                  <ul v-show="viewModeOpen" class="view-menu"  @keydown.space.prevent.stop role="group">
                     <li v-for="vm in viewModes" :key="vm.id" v-html="vm.title" :id="vm.id"
                        class="mode-item" tabindex="-1"
                        @keydown.down.prevent.stop="nextMenu"
                        @keydown.up.prevent.stop="prevMenu"
                        @keydown.enter.prevent.stop="selectView(vm.id)"
                        @click.stop.prevent="selectView(vm.id)">
                     </li>
                  </ul>
               </transition>
            </button>
         </div>
         <div class="browse-detail" >
            <div class="browse-cards" :class="currViewMode">
               <BrowseCard  v-for="(b,idx) in shelfStore.browse" :current="isCurrent(idx)"
                  :pool="route.params.src" :data="b"  :key="`b${b.id}`" :mode="currViewMode" :index="idx+1"
               />
            </div>
         </div>
      </template>
   </div>
</template>

<script setup>
import BrowseCard from "@/components/details/BrowseCard.vue"
import { ref, onMounted, computed } from 'vue'
import { useShelfStore } from "@/stores/shelf"
import { useRoute } from 'vue-router'
import analytics from '@/analytics'
import { setFocusID } from '@/utils'

const route = useRoute()
const shelfStore = useShelfStore()

const viewModes = [ {id: 'gallery', title: "<i class='fas fa-grip-horizontal'></i>&nbsp;View gallery"},
                    {id: 'list', title: "<i class='fal fa-list'></i>&nbsp;View list"}]
const currViewMode = ref('gallery')
const currFocus = ref('gallery')
const viewModeOpen = ref(false)
const origTitle = ref("")
const origCallNumber = ref("")
const origID = ref("")

const viewMode = computed(() =>{
   var m = viewModes.find( vm => vm.id == currViewMode.value)
   return m.title
})
const rotation = computed(() =>{
   if ( viewModeOpen.value ) {
      return "rotate(180deg)"
   }
   return "rotate(0deg)"
})
const backURL= computed(() =>{
   return `/sources/${route.params.src}/items/${route.params.id}`
})
const firstCall = computed(() =>{
   return shelfStore.browse[0].call_number
})
const lastCall = computed(() =>{
   return shelfStore.browse[shelfStore.browse.length-1].call_number
})

function selectView( mode ) {
   currViewMode.value = mode
   viewModeOpen.value = false
   setFocusID("view")
}
function toggleViewMenu() {
   viewModeOpen.value = !viewModeOpen.value
}
function nextMenu() {
   if ( !viewModeOpen.value ) {
      viewModeOpen.value = true
      currFocus.value = 'gallery'
   } else {
      if ( currFocus.value =='gallery' ) {
         currFocus.value = 'list'
      } else {
         currFocus.value = 'gallery'
      }
   }
   focusMenuItem()
}
function prevMenu() {
   if ( !viewModeOpen.value ) {
      viewModeOpen.value = true
      currFocus.value = 'list'
   } else {
      if ( currFocus.value =='gallery' ) {
         currFocus.value = 'list'
      } else {
         currFocus.value = 'gallery'
      }
   }
   focusMenuItem()
}
function focusMenuItem() {
   setFocusID(currFocus.value)
}
function closeViewMenu() {
   viewModeOpen.value = false
}
function isCurrent(idx) {
   let item = shelfStore.browse[idx]
   return item.id == origID.value
}
function browseNext() {
   shelfStore.browseNextPage()
   analytics.trigger('ShelfBrowse', 'BROWSE_NEXT_CLICKED')
}
function browsePrior() {
   shelfStore.browsePriorPage()
   analytics.trigger('ShelfBrowse', 'BROWSE_PREV_CLICKED')
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

onMounted( async ()=>{
   shelfStore.lookingUp = true
   shelfStore.browseRange = 10
   await shelfStore.getBrowseData(route.params.id )

   // once data is available, lookup title, call and ID or the
   // item that started the browse
   let origItem = shelfStore.browse.find(b=> b.id == route.params.id)
   origID.value = origItem.id
   origTitle.value = origItem.title
   origCallNumber.value = origItem.call_number
})

</script>
<style lang="scss" scoped>
.shelf-browse {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   margin-bottom: 10vh;
   color: var(--color-primary-text);
   width: 100%;
   margin: 0 auto;

   .info {
      font-size: 1.2em;
      font-weight: normal;
      .line {
         margin-bottom: 5px;
      }
      .label {
         margin-right: 5px;

      }
   }

   .browse-controls.full {
      margin: 25px 0 25px 0;
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-content: stretch;
      align-items: center;
      padding: 15px;
      box-sizing: border-box;
      .range {
         b {
            margin-right: 10px;
            font-weight: bolder;
         }
      }
   }

   .view-mode {
      text-align: right;
      margin-right: 15px;
      .view {
         display: inline-block;
         outline: none;
         cursor: pointer;
         border: none;
         background: transparent;
         text-align: left;
         padding: 0 10px;
         text-align: left;
         color: var(--uvalib-text);

         .select-header {
            width: 120px;
            display: flex;
            flex-flow: row nowrap;
            text-align: left;
            justify-content: space-between;
            span, i {
               display: inline-block;
            }


         }
         position: relative;
         transition: transform 200ms;
         display: inline-block;
         cursor: pointer;
         padding: 0 5px;
         &:focus {
            @include be-accessible();
         }
      }

      i.dd-caret {
         margin-left: 5px;
         display: inline-block;
         transition: transform 200ms;
      }
      .view-menu {
         text-align: left;
         transition: 100ms;
         list-style: none;
         padding:10px 0 0 0;
         margin: 0;
         border-radius: 0 0 5px 5px;
         border: 1px solid var(--uvalib-grey-light);
         position: absolute;
         z-index: 100;
         background: white;
         left:0;
         right:0;
         box-shadow: $v4-box-shadow;
         li {
            line-height: 35px;
            padding: 0 10px 0 10px;
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

   .browse-detail {
      margin: 20px 30px 0 30px;
      padding-top: 5px;
   }

   .browse-cards {
      display: grid;
      grid-gap: 1.25rem;
      margin: 0 0 20px 0;
      padding: 0;
      box-sizing: border-box;
      justify-content: center;

      .browse-card {
         width: 100%;
         margin: 0 auto;
      }
   }

   .working {
      text-align: center;
      font-size: 0.9em;
   }
   .working img {
      margin: 30px 0;
   }
}
@media only screen and (min-width: 768px) {
   div.info  {
      max-width: 75%;
      margin: 0 auto;
   }
   .browse-controls.full {
      background-color: var(--uvalib-grey-lightest);
   }
   .browse-cards {
      grid-template-columns: repeat(4, 200px);
   }
   .browse-cards.list {
      max-width:75%;
      margin: 0 auto;
      grid-template-columns: unset;
      grid-gap: unset;
      display: flex;
      flex-direction:  column;
      .browse-card {
         width: 100%;
      }
   }
}
@media only screen and (max-width: 768px) {
   div.info  {
      max-width: 90%;
      margin: 0 auto;
   }
   .browse-controls.full {
       background-color: white;
       button {
         width: 100%
      }
      .range {
         margin: 15px 0;
      }
    }
   .browse-cards {
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
   }
   .browse-cards.list {
      max-width:90%;
      grid-template-columns: unset;
      grid-gap: unset;
      display: flex;
      flex-direction:  column;
      margin: 0 auto;
      .browse-card {
         width: 100%;
      }
   }
}
</style>
