<template>
   <div class="details">
      <div class="working" v-if="item.details.searching || item.loadingDigitalContent || resultStore.searching" >
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
import { useSystemStore } from "@/stores/system"
import { useItemStore } from "@/stores/item"
import { useResultStore } from "@/stores/result"
import { useCollectionStore } from "@/stores/collection"
import { useRestoreStore } from "@/stores/restore"
import analytics from '@/analytics'
import { storeToRefs } from "pinia"

const collection = useCollectionStore()
const system = useSystemStore()
const item = useItemStore()
const resultStore = useResultStore()
const restore = useRestoreStore()
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
            console.log("PDF")
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

   let bmTarget = restore.bookmarkTarget

   await item.getDetails( src, id )

   if ( bmTarget.origin == "DETAIL" || bmTarget.origin == "COLLECTION" ) {
      let bmEle = document.getElementById(`bm-modal-${bmTarget.id}-btn`)
      if (bmEle) {
         bmEle.focus()
         bmEle.click()
      }
   }

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
         let dateField = item.details.detailFields.find( f => f.name == "published_date")
         if (dateField) {
            let year = dateField.value.split("-")[0]
            collection.setYear(year)
         }
      }
   }
}

function zoteroItemUpdated() {
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
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   margin-bottom: 10vh;
   color: var(--color-primary-text);
   .working {
      text-align: center;
      font-size: 0.9em;
   }
   .working img {
      margin: 30px 0;
   }
}
</style>
