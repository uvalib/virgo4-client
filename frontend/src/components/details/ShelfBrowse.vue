<template>
   <section class="shelf-browse" aria-live="polite">
      <div class="working" v-if="shelfStore.lookingUp" aria-hidden="true">
         <V4Spinner message="Getting shelf browse data..." />
      </div>
      <nav aria-labelledby="shelf-title" v-if="!shelfStore.lookingUp && shelfStore.hasBrowseData">
         <h2 id="shelf-title">Shelf browse</h2>
         <ul class="browse-cards" role="list">
            <li v-for="(b,idx) in shelfStore.browse" class="card-wrap" :key="`b${b.id}`">
               <i class="current fas fa-caret-down" v-if="isCurrent(idx)"></i>
               <BrowseCard :current="isCurrent(idx)" :pool="props.pool" :data="b" style="height:100%"/>
            </li>
         </ul>
         <div class="browse-controls">
            <router-link @click="fullScreenBrowseClicked" :to="browseURL" class="to-browse" >
               View full page
            </router-link>
            <BrowsePager />
            <VirgoButton  v-if="!shelfStore.isOriginalItem" class="recenter"
               @click="browseRestore()" severity="info">Return to {{currentCallNumber}}
            </VirgoButton>
         </div>
      </nav>
   </section>
</template>

<script setup>
import BrowseCard from "@/components/details/BrowseCard.vue"
import BrowsePager from "@/components/details/BrowsePager.vue"
import { computed, onMounted } from 'vue'
import { useShelfStore } from "@/stores/shelf"
import { useRestoreStore } from "@/stores/restore"
import { useBookmarkStore } from "@/stores/bookmark"
import { useSystemStore } from "@/stores/system"
import analytics from '@/analytics'
import { scrollToItem } from '@/utils'

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

const shelfStore = useShelfStore()
const system = useSystemStore()

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

   if ( system.displayWidth <= 520 ) {
      shelfStore.browseRange = 1
   } else if ( system.displayWidth <= 1000 ) {
      shelfStore.browseRange = 2
   } else if ( system.displayWidth <= 1280 ) {
      shelfStore.browseRange = 3
   } else {
      shelfStore.browseRange = 4
   }

   let tgt = props.hit.identifier

   let newBM = null
   if ( restore.pendingBookmark && restore.pendingBookmark.origin == "SHELF_BROWSE" ) {
      // if a bookmark add was restored, make it the target of shelf browse (center option)
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
      font-size: 0.85em;
   }
   .center {
      text-align: centter;
   };

   .browse-cards {
      padding: 0;
      margin: 0;
      display: flex;
      flex-flow: row nowrap;
      overflow: hidden;
      justify-content: center;
      align-items: stretch;
      list-style-type: none;
      gap: 10px;
      .card-wrap {
         position: relative;
         padding-top: 15px;
         i.current {
            position: absolute;
            top: -22px;
            width: 100%;
            text-align: center;
            z-index: 1;
            color: var(--uvalib-brand-blue-light);
            font-size: 3em;
         }
      }
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
