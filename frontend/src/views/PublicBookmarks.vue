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
               <div class="author">{{bookmark.details.author}}</div>
            </div>
         </Panel>
      </template>
   </div>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import analytics from '@/analytics'
import Panel from 'primevue/panel'

const route = useRoute()
const bookmarkStore = useBookmarkStore()

onMounted(()=>{
   bookmarkStore.getPublicBookmarks(route.params.key)
})
function bookmarkFollowed(identifier) {
   analytics.trigger('Bookmarks', 'FOLLOW_PUBLIC_BOOKMARK', identifier)
}
function detailsURL(bookmark) {
   return `/sources/${bookmark.pool.name}/items/${bookmark.identifier}`
}
</script>

<style lang="scss" scoped>

:deep(.p-panel) {
   margin-bottom: 20px;
   box-shadow:  $v4-box-shadow-light;
   .p-panel-header {
      background: white;
   }
}

.public-bookmarks {
   min-height: 400px;
   position: relative;
   margin: 2vw auto 6vw;
   color: var(--uvalib-text);
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
   margin-left: 40px;
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