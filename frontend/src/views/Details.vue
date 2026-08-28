<template>
   <div class="details">
      <div class="working" v-if="loadingDetails" >
         <V4Spinner message="Looking up details..."/>
      </div>
      <div class="guest-exclusion" v-else-if="excludedPool || item.noAuthorization">
         <div>Details for items from {{ excludedPool }} are not available to guest users.</div>
         <div><VirgoButton link @click="signInClicked" label="Sign in to view details"/></div>
      </div>
      <div class="not-found" v-else-if="item.notFound">
         <h1>Item not found</h1>
          <div>
            We're sorry, but we are unable to find details for this item. There may be a typo in the address or perhaps an outdated link led you to the wrong place.
         </div>
          <div>
            You're always welcome to <a href="http://www.library.virginia.edu/askalibrarian/" target="_blank" aria-describedby="new-window">Ask a Librarian</a> for help!
          </div>
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
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { useItemStore } from "@/stores/item"
import { useCollectionStore } from "@/stores/collection"
import { useRestoreStore } from "@/stores/restore"
import { useBookmarkStore } from "@/stores/bookmark"
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { usePoolStore } from "@/stores/pool"
import { usePreferencesStore } from "@/stores/preferences"
import analytics from '@/analytics'

const collection = useCollectionStore()
const item = useItemStore()
const restore = useRestoreStore()
const bookmarks = useBookmarkStore()
const system = useSystemStore()
const user = useUserStore()
const pools = usePoolStore()
const preferences = usePreferencesStore()
const route = useRoute()
const router = useRouter()
const loadingDetails = ref(true)
const excludedPool = ref()

onBeforeRouteUpdate(async (to) => {
   getDetails(to.params.src, to.params.id, false)
})

const getDetails = ( async (src, id, initialPage) => {
   // If a user is not signed in check if this pool is one of those that are unavailable to them
   if (user.isSignedIn == false && preferences.isPoolExcluded(route.params.src)) {
      console.log(route.params.src+ " is excluded for guest users")
      excludedPool.value = pools.poolDetails(route.params.src).name
      console.log(`EXCLUDED [${excludedPool.value}]`)
      loadingDetails.value = false
      return
   }

   await item.getDetails( src, id )
   if (item.notFound) {
      loadingDetails.value = false
      return

   }
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
         } else {
            system.setToast("Bookmark Info", `"${newBM.title}" has already been bookmarked.`)
         }
         restore.clear()
      }
      loadingDetails.value = false
   } else {
      loadingDetails.value = false
   }
})

const signInClicked = (() => {
   // restore.setRestoreSaveSearch()
   router.push("/signin")
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
.guest-exclusion, .not-found {
   margin: 0 auto;
   text-align: center;
   div {
      margin-bottom: 20px;
      font-size: 1.25rem;
   }
}
@media only screen and (min-width: 768px) {
   .guest-exclusion, .not-found  {
       width: 50%;
   }
}
@media only screen and (max-width: 768px) {
   .guest-exclusion, .not-found  {
       width: 75%;
   }
}
</style>
