<template>
   <div class="details">
      <div class="working" v-if="loadingDetails" >
         <V4Spinner message="Looking up details..."/>
      </div>
      <template v-else>
         <FullPageCollectionView v-if="collection.isFullPage && item.isCollection && collection.isAvailable" />
         <ItemView v-else />
      </template>
   </div>
</template>

<script setup>
import ItemView from "@/components/details/ItemView.vue"
import FullPageCollectionView from "@/components/details/FullPageCollectionView.vue"
import { onMounted, onUpdated, ref } from 'vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import { useItemStore } from "@/stores/item"
import { useCollectionStore } from "@/stores/collection"
import { useRestoreStore } from "@/stores/restore"
import { useBookmarkStore } from "@/stores/bookmark"
import analytics from '@/analytics'

const collection = useCollectionStore()
const item = useItemStore()
const restore = useRestoreStore()
const bookmarks = useBookmarkStore()
const route = useRoute()
const loadingDetails = ref(true)

onBeforeRouteUpdate(async (to) => {
   getDetails(to.params.src, to.params.id, false)
})

const getDetails = ( async (src, id, initialPage) => {
   // if this was called from an old catalog/id url, the src will get
   // set to legacy. in this case, lookup the cat key and redirect to full detail
   // the redirect will trigger a beforeRouteUpdate and that will get fill item detail.
   loadingDetails.value = true
   if ( src == "legacy" ) {
      await item.lookupCatalogKeyDetail(id )
      return
   }

   await item.getDetails( src, id )
   analytics.trigger('Results', 'ITEM_DETAIL_VIEWED', id)
   if (item.details && item.details.header) {
      document.title = item.details.header.title
   }
   getCollectionContext()

   if ( initialPage ) {
      if ( restore.pendingBookmark && restore.pendingBookmark.identifier == id) {
         let newBM = restore.pendingBookmark
         let showAdd = ( bookmarks.bookmarkCount( newBM.pool, newBM.identifier ) == 0 )
         if (showAdd) {
            let triggerBtn = document.querySelector(".icon-wrap .bookmark")
            bookmarks.showAddBookmark( newBM.pool, newBM, triggerBtn)
         }
         restore.clear()
      }
      loadingDetails.value = false
   } else {
      loadingDetails.value = false
   }
})

const getCollectionContext = (async () => {
   if ( item.isCollection || item.isCollectionHead) {
      let collName = item.collectionName
      if (collName == "") {
         collName = item.digitalCollectionName
         analytics.trigger('Results', 'DIGITAL_COLLECTION_ITEM_VIEWED', collName)
      } else {
         analytics.trigger('Results', 'COLLECTION_ITEM_VIEWED', collName )
      }

      await collection.getCollectionContext( collName )
      if ( collection.hasCalendar) {
         let dateField = item.details.fields.find( f => f.name == "published_date")
         if (dateField) {
            let year = dateField.value.split("-")[0]
            collection.setYear(year)
         }
      }
   } else {
      collection.clearCollectionDetails()
   }
})

function zoteroItemUpdated() {
   // notify zotero connector of an item change
   document.dispatchEvent(new Event('ZoteroItemUpdated', {
      bubbles: true,
      cancelable: true
   }))
}

onMounted(()=>{
   getDetails(route.params.src, route.params.id, true)
})

onUpdated(()=>{
   zoteroItemUpdated()
})
</script>
<style lang="scss" scoped>
.details {
   position: relative;
   width: 95%;
   margin: 0 auto 0 auto;
   padding-bottom: 4vh;
   text-align: left;
   min-height: 400px;

   .working {
      padding-top: 5%;
      text-align: center;
   }
   .working img {
      margin: 30px 0;
   }
}
</style>
