<template>
   <span v-if="system.isKiosk==false" class="bookmark-container">
      <V4Button v-if="isBookmarked" mode="icon" @click="removeBookmarkClicked"
         :id="props.id"
         role="switch" aria-checked="true"
         :aria-label="`remove bookmark on ${props.data.title}`"
      >
         <i class="bookmark fas fa-bookmark"></i>
      </V4Button>
      <V4Button v-else mode="icon" @click="addBookmarkClicked"
         :id="id"
         role="switch" aria-checked="false"
         :aria-label="`bookmark ${props.data.title}`"
      >
         <i class="bookmark fal fa-bookmark"></i>
      </V4Button>
   </span>
</template>

<script setup>
import { computed } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useBookmarkStore } from "@/stores/bookmark"
import analytics from '@/analytics'

const emit = defineEmits( ['clicked'] )

const props = defineProps({
   // Fields: Pool, ID, Title. Author optional
   data: { type: Object, required: true},
   id:  {type: String, required: true},
})

const system = useSystemStore()
const bookmarkStore = useBookmarkStore()

const isBookmarked = computed(()=>{
   let found = false
   bookmarkStore.bookmarks.some( folder => {
      folder.bookmarks.some( item => {
         if (item.pool == props.data.pool && item.identifier == props.data.identifier) {
            found = true
         }
         return found == true
      })
      return found == true
   })
   return found
})

function removeBookmarkClicked() {
   let bookmarkID = -1
   bookmarkStore.bookmarks.some( folder => {
      folder.bookmarks.some( item => {
         if (item.pool == props.data.pool && item.identifier == props.data.identifier) {
            bookmarkID = item.id
            analytics.trigger('Bookmarks', 'REMOVE_BOOKMARK', item.identifier)
            bookmarkStore.removeBookmarks(folder.id, [bookmarkID])
         }
         return bookmarkID != -1
      })
      return bookmarkID != -1
   })
}
function addBookmarkClicked() {
   emit('clicked')
}
</script>

<style lang="scss" scoped>
.bookmark-container {
   position: relative;
   display: inline-block;
   box-sizing: border-box;

   i.bookmark {
      color: #444;
      cursor: pointer;
      font-size: 1.4em;
      display: inline-block;
      box-sizing: border-box;
      padding:0;
      margin:0;
      &:focus {
         @include be-accessible();
      }
      &:hover {
         color:var(--uvalib-brand-blue-light);
      }
   }

   i.bookmark.disabled {
      color: #ccc;
   }

   i.fas.bookmark {
      color: var(--uvalib-brand-blue-light);
   }
}
</style>
