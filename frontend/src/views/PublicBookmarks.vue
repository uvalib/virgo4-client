<template>
   <div class="public-bookmarks">
      <div class="working" v-if="bookmarkStore.searching">
         <V4Spinner message="Looking up bookmark information..."/>
      </div>
      <template v-else>
         <Panel v-for="(bookmark,idx) in bookmarkStore.public" :key="`BM${idx}`" toggleable>
            <template #header>
               <router-link @click="bookmarkFollowed(bookmark.identifier)"  :to="detailsURL(bookmark)">{{bookmark.details.title}}</router-link>
            </template>
            <div class="info">
               <div v-if="bookmark.details.author" class="author">{{bookmark.details.author}}</div>
               <dl>
                  <template v-if="bookmark.details.callNumber">
                     <dt>Call Number:</dt>
                     <dd>{{bookmark.details.callNumber}}</dd>
                  </template>
                  <template v-if="bookmark.details.format">
                     <dt>Format:</dt>
                     <dd>{{bookmark.details.format}}</dd>
                  </template>
                  <template v-if="bookmark.details.library">
                     <dt>Library:</dt>
                     <dd>{{bookmark.details.library}}</dd>
                  </template>
                  <dt>Source:</dt>
                  <dd>{{sourceName(bookmark.pool.name)}}</dd>
               </dl>
            </div>
         </Panel>
      </template>
   </div>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { usePoolStore } from "@/stores/pool"
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import analytics from '@/analytics'
import Panel from 'primevue/panel'

const route = useRoute()
const bookmarkStore = useBookmarkStore()
const poolStore = usePoolStore()

onMounted(()=>{
   bookmarkStore.getPublicBookmarks(route.params.key)
})
const sourceName = ((poolID) => {
   let pool = poolStore.list.find(p => p.id == poolID)
   if ( pool ) {
      return pool.name
   }
   return poolID
})
const bookmarkFollowed = ((identifier) => {
   analytics.trigger('Bookmarks', 'FOLLOW_PUBLIC_BOOKMARK', identifier)
})
const detailsURL = ((bookmark) => {
   return `/sources/${bookmark.pool.name}/items/${bookmark.identifier}`
})
</script>

<style lang="scss" scoped>

.public-bookmarks {
   min-height: 400px;
   position: relative;
   margin: 2vw auto 6vw;
   display: flex;
   flex-direction: column;
   align-items: stretch;
   justify-content: flex-start;
   gap: 15px;
}
.bookmarks-content {
   margin: 0 auto;
   text-align: left;
   .working {
      text-align: center;
      font-size: 1.25em;
      margin-bottom: 75px;
   }
}

div.info {
   text-align: left;
   .author {
      margin: 0 0 15px 40px;
   }
   dl {
      margin: 0 0 0 15px;
      display: inline-grid;
      grid-template-columns: max-content 2fr;
      grid-column-gap: 15px;
      font-size: 0.9em;
   }
   dt {
      font-weight: bold;
      text-align: right;
   }
   dd {
      margin: 0 0 10px 0;
   }
}

@media only screen and (min-width: 768px) {
   .public-bookmarks {
     max-width: 55vw;
   }
}
@media only screen and (max-width: 768px) {
   .public-bookmarks {
     max-width: 95vw;
   }
}
</style>