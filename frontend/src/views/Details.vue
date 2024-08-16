<template>
   <div class="details">
      <div class="working" v-if="item.details.searching || resultStore.searching" >
         <V4Spinner message="Looking up details..."/>
      </div>
      <template v-else>
         <CollectionHeader v-if="collection.isBookplate == false && collection.isAvailable && (item.isCollection || item.isCollectionHead)"/>
         <FullPageCollectionView v-if="collection.isFullPage && item.isCollection && collection.isAvailable" />
         <ItemView v-else />
      </template>
   </div>
</template>

<script setup>
import ItemView from "@/components/details/ItemView.vue"
import CollectionHeader from "@/components/details/CollectionHeader.vue"
import FullPageCollectionView from "@/components/details/FullPageCollectionView.vue"
import { onMounted, onUpdated, watch } from 'vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import { useItemStore } from "@/stores/item"
import { useResultStore } from "@/stores/result"
import { useCollectionStore } from "@/stores/collection"
import { useRestoreStore } from "@/stores/restore"
import { useBookmarkStore } from "@/stores/bookmark"
import analytics from '@/analytics'
import { storeToRefs } from "pinia"

const collection = useCollectionStore()
const item = useItemStore()
const resultStore = useResultStore()
const restore = useRestoreStore()
const bookmarks = useBookmarkStore()

const route = useRoute()

onBeforeRouteUpdate( async (to) => {
   // this is needed to load details when a grouped image thumb has been clicked; new content
   // needs to be loaded, but the page remains the same (create not called)
   getDetails(to.params.src, to.params.id)
})

const { loadingDigitalContent } = storeToRefs(item)
watch(loadingDigitalContent, (newValue, oldValue) => {
   if (oldValue == true && newValue == false && item.hasDigitalContent ) {
      item.digitalContent.forEach( dc => {
         if (dc.pdf ) {
            analytics.trigger('PDF', 'PDF_LINK_PRESENTED', dc.pid)
         }
         if (dc.ocr ) {
            analytics.trigger('OCR', 'OCR_LINK_PRESENTED', dc.pid)
         }
      })
   }
})

async function getDetails(src, id) {
   // if this was called from an old catalog/id url, the src will get
   // set to legacy. in this case, lookup the cat key and redirect to full detail
   // the redirect will trigger a beforeRouteUpdate and that will get fill item detail.
   if ( src == "legacy" ) {
      await item.lookupCatalogKeyDetail(id )
      return
   }

   await item.getDetails( src, id )

   if (item.details && item.details.header) {
      document.title = item.details.header.title
   }

   analytics.trigger('Results', 'ITEM_DETAIL_VIEWED', id)

   if (item.isDigitalCollection) {
      analytics.trigger('Results', 'DIGITAL_COLLECTION_ITEM_VIEWED', item.digitalCollectionName )
   }
   if (item.isCollection) {
      analytics.trigger('Results', 'COLLECTION_ITEM_VIEWED', item.collectionName )
   }

   if ( item.isCollection || item.isCollectionHead) {
      let name = item.collectionName
      if (!name) {
         name = item.digitalCollectionName
      }

      await collection.getCollectionContext( name )
      if ( collection.hasCalendar) {
         let dateField = item.details.fields.find( f => f.name == "published_date")
         if (dateField) {
            let year = dateField.value.split("-")[0]
            collection.setYear(year)
         }
      }
   }

   setTimeout( () => {
      if ( restore.pendingBookmark && (restore.pendingBookmark.origin == "DETAIL" || restore.pendingBookmark.origin == "COLLECTION") ) {
         let newBM = restore.pendingBookmark
         let showAdd = ( bookmarks.bookmarkCount( newBM.pool, newBM.hit.identifier ) == 0 )
         if (showAdd) {
            let triggerBtn = document.querySelector(".icon-wrap .bookmark")
            bookmarks.showAddBookmark( newBM.pool, newBM.hit, triggerBtn, "DETAIL")
         }
         restore.clear()
      }
   }, 500)
}

function zoteroItemUpdated() {
   console.log("zoteroItemUpdated")
   // notify zotero connector of an item change
   document.dispatchEvent(new Event('ZoteroItemUpdated', {
      bubbles: true,
      cancelable: true
   }))
}

onMounted(()=>{
   getDetails(route.params.src, route.params.id)
})

onUpdated(()=>{
   zoteroItemUpdated()
})
</script>
<style lang="scss" scoped>
.details {
   position: relative;
   color: var(--color-primary-text);
   width: 95%;
   margin: 0 auto 3vh auto;
   text-align: left;

   .working {
      text-align: center;
      font-size: 0.9em;
   }
   .working img {
      margin: 30px 0;
   }
}
</style>
