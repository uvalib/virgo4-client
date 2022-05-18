<template>
   <section class="shelf-browse" aria-live="polite">
      <div class="working" v-if="shelfStore.lookingUp" aria-hidden="true">
         <V4Spinner message="Getting shelf browse data..." />
      </div>
      <nav aria-labelledby="shelf-title" v-if="!shelfStore.lookingUp && shelfStore.hasBrowseData">
         <h2 id="shelf-title">Shelf Browse</h2>
         <ul class="browse-cards" role="list">
            <li v-for="(b,idx) in shelfStore.browse" class="card-wrap" :key="`b${b.id}`">
               <BrowseCard :current="isCurrent(idx)" :pool="props.pool" :data="b" style="height:100%"/>
            </li>
         </ul>
         <router-link @click="fullScreenBrowseClicked" :to="browseURL" class="to-browse" >
            View full page
         </router-link>
         <BrowsePager />
         <div class="centered" v-if="!shelfStore.isOriginalItem">
            <V4Button mode="primary" @click="browseRestore()">Return to {{currentCallNumber}}</V4Button>
         </div>
      </nav>
   </section>
</template>

<script setup>
import BrowseCard from "@/components/details/BrowseCard.vue"
import BrowsePager from "@/components/details/BrowsePager.vue"
import { computed, onMounted } from 'vue'
import { useShelfStore } from "@/stores/shelf"
import analytics from '@/analytics'

const props = defineProps({
   hit: {
      type: Object,
      required: true
   },
   target: {
      type: String,
      default: ""
   },
   pool: {
      type: String,
      required: true
   }
})

const shelfStore = useShelfStore()


const currentCallNumber = computed(()=>{
   let f =  props.hit.detailFields.find( f => f.name == "call_number")
   if ( f) {
      return f.value
   }
   return props.hit.identifier
})
const browseURL = computed(()=>{
   return `/sources/${props.pool}/items/${props.hit.identifier}/browse`
})

function fullScreenBrowseClicked() {
   analytics.trigger('ShelfBrowse', 'FULL_SCREEN_BROWSE_CLICKED', props.hit.identifier)
}
function isCurrent(idx) {
   if ( shelfStore.lookingUp ) return false
   let item = shelfStore.browse[idx]
   return item.id == props.hit.identifier
}
function browseRestore() {
   shelfStore.showSpinner = false
   shelfStore.getBrowseData(props.hit.identifier )
   analytics.trigger('ShelfBrowse', 'BROWSE_RESTORE_CLICKED', props.hit.identifier)
}
async function getBrowseData() {
   shelfStore.browseRange = 3
   let tgt = props.hit.identifier
   if ( props.target && props.target != "")  {
      tgt = props.target
   }
   await shelfStore.getBrowseData( tgt )
   if ( shelfStore.hasBrowseData) {
      analytics.trigger('ShelfBrowse', 'BROWSE_LOADED', props.hit.identifier)
   }
   if ( props.target && props.target != "")  {
      let bmEle = document.getElementById(`bm-modal-${props.target}-btn`)
      if (bmEle) {
         bmEle.focus()
         bmEle.click()
      }
   }
}
onMounted(()=>{
   getBrowseData()
})
</script>

<style lang="scss" scoped>
.shelf-browse {
   width: 95%;
   margin: 0 auto;

   .working {
      text-align: center;
      margin: 20px 0 30px 0;
      font-size: 0.85em;
   }

   .center {
      text-align: centter;
   };

   .browse-cards {
      padding: 5px 0;
      display: flex;
      flex-flow: row nowrap;
      overflow: hidden;
      justify-content: center;
      align-content: stretch;
      list-style-type: none;
      .card-wrap {
         width: 190px;
      }
   }

   h2 {
      margin: 50px 0 10px 0;
      color: var(--color-primary-orange);
      text-align: center;
   }

   .to-browse {
      margin: 10px 0 15px 0;
      &:focus {
         outline: 3px dotted var( --uvalib-accessibility-highlight ) !important;
         outline-offset: 3px !important;
      }
   }
}
</style>
