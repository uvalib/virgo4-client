<template>
   <section class="shelf-browse" aria-live="polite">
      <div class="working" v-if="shelfStore.lookingUp" aria-hidden="true">
         <V4Spinner message="Getting shelf browse data..." />
      </div>
      <nav aria-labelledby="shelf-title" v-if="!shelfStore.lookingUp && shelfStore.hasBrowseData">
         <h2 id="shelf-title">Shelf browse</h2>
         <ul class="browse-cards" role="list">
            <li v-for="(b,idx) in shelfStore.browse" class="card-wrap" :key="`b${b.id}`">
               <BrowseCard :current="isCurrent(idx)" :pool="props.pool" :data="b" style="height:100%"/>
            </li>
         </ul>
         <div class="browse-controls">
            <router-link @click="fullScreenBrowseClicked" :to="browseURL" class="to-browse" >
               View full page
            </router-link>
            <BrowsePager />
            <VirgoButton  v-if="!shelfStore.isOriginalItem" class="recenter"
               @click="browseRestore()" severity="secondary">Return to {{currentCallNumber}}
            </VirgoButton>
         </div>
      </nav>
   </section>
</template>

<script setup>
import BrowseCard from "@/components/details/BrowseCard.vue"
import BrowsePager from "@/components/details/BrowsePager.vue"
import { computed, onMounted, watch } from 'vue'
import { useShelfStore } from "@/stores/shelf"
import { useRestoreStore } from "@/stores/restore"
import { useBookmarkStore } from "@/stores/bookmark"
import analytics from '@/analytics'
import { scrollToItem } from '@/utils'
import { useWindowSize } from '@vueuse/core'

const props = defineProps({
   hit: {
      type: Object,
      required: true
   },
   pool: {
      type: String,
      required: true
   }
})

const { width } = useWindowSize()
const shelfStore = useShelfStore()

watch( width, (newValue) => {
   var newRange = 4
   if ( newValue <= 600 ) {
      newRange = 1
   } else if ( newValue <= 1150 ) {
      newRange = 2
   } else if ( newValue <= 1575 ) {
      newRange = 3
   }
   if ( newRange !=  shelfStore.browseRange ) {
      // console.log("SIZE CHANGE "+newRange+" W: "+newValue)
      shelfStore.browseRange = newRange
      shelfStore.showSpinner = false
      shelfStore.getBrowseData(props.hit.identifier )
   }
})

const currentCallNumber = computed(()=>{
   let f =  props.hit.fields.find( f => f.name == "call_number")
   if ( f) {
      return f.value
   }
   return props.hit.identifier
})
const browseURL = computed(()=>{
   return `/sources/${props.pool}/items/${props.hit.identifier}/browse`
})

const fullScreenBrowseClicked = (() => {
   analytics.trigger('ShelfBrowse', 'FULL_SCREEN_BROWSE_CLICKED', props.hit.identifier)
})

const isCurrent = ((idx) => {
   if ( shelfStore.lookingUp ) return false
   let item = shelfStore.browse[idx]
   return item.id == props.hit.identifier
})

const browseRestore = (() => {
   shelfStore.showSpinner = false
   shelfStore.getBrowseData(props.hit.identifier )
   analytics.trigger('ShelfBrowse', 'BROWSE_RESTORE_CLICKED', props.hit.identifier)
})

const getInitialBrowseData = ( async () => {
   const restore = useRestoreStore()
   const bookmarks = useBookmarkStore()

   shelfStore.browseRange = 4
   if ( width.value <= 600 ) {
      shelfStore.browseRange = 1
   } else if ( width.value <= 1150 ) {
      shelfStore.browseRange = 2
   } else if ( width.value <= 1575 ) {
      shelfStore.browseRange = 3
   }

   let tgt = props.hit.identifier

   let newBM = null
   if ( restore.pendingBookmark ) {
      // if a bookmark add was restored, make it the target of shelf browse (center option)
      // NOTE: this component is loaded from the item page, which has the first shot at
      // handling a pending bookmark. If it is handled there, pendingBookmark will be cleared.
      newBM = restore.pendingBookmark
      tgt = newBM.hit.identifier
      restore.clear()
   }

   await shelfStore.getInitialBrowseData( tgt )
   if ( shelfStore.hasBrowseData ) {
      analytics.trigger('ShelfBrowse', 'BROWSE_LOADED', props.hit.identifier)
   }

   if ( newBM ) {
      scrollToItem( `browse-${tgt}` )
      let cnt =  bookmarks.bookmarkCount( newBM.pool, newBM.hit.identifier )
      if ( cnt == 0 ) {
         let triggerBtn = document.getElementById(`bm-btn-${ newBM.hit.identifier}`)
         bookmarks.showAddBookmark( props.pool, newBM.hit, triggerBtn, "SHELF_BROWSE")
      }
   }
})

onMounted(()=>{
   getInitialBrowseData()
})
</script>

<style lang="scss" scoped>
.shelf-browse {
   .working {
      text-align: center;
      margin: 20px 0 30px 0;
   }

   .browse-cards {
      padding: 0;
      margin: 0;
      display: flex;
      flex-flow: row nowrap;
      overflow: hidden;
      justify-content: center;
      align-items: stretch;
      list-style-type: none;
      gap: 1rem;
   }
   .browse-controls  {
      margin: 20px 0 0 0;
      text-align: center;
      .recenter {
         margin-top: 10px;
      }
   }
}
</style>
