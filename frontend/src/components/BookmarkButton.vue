<template>
   <span v-if="system.isKiosk==false" class="bookmark-container">
      <V4Button v-if="bookmarkCount == 1" mode="icon" @click="removeBookmarkClicked"
         :id="props.id"
         role="switch" aria-checked="true"
         :aria-label="`remove bookmark on ${props.data.title}`"
      >
         <i class="bookmark fas fa-bookmark"></i>
      </V4Button>
      <Confirm v-else-if="bookmarkCount > 1" buttonMode="icon" icon="bookmark fas fa-bookmark"
         title="Remove multiple bookmarks"
         v-on:confirmed="removeBookmarkClicked()" :id="`del-multi-bookmark`"
      >
         <div>This item is bookmarked in '<b>{{bookmarkCount}}</b> folders. Remove all?</div>
         <div class="del-detail">This cannot be reversed.</div>
      </Confirm>
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

const bookmarkCount = computed(()=>{
   let count = 0
   bookmarkStore.bookmarks.forEach( folder => {
      folder.bookmarks.forEach( item => {
         if (item.pool == props.data.pool && item.identifier == props.data.identifier) {
            count++
         }
      })
   })
   return count
})

function removeBookmarkClicked() {
   bookmarkStore.bookmarks.forEach( folder => {
      folder.bookmarks.forEach( item => {
         if (item.pool == props.data.pool && item.identifier == props.data.identifier) {
            bookmarkStore.removeBookmarks(folder.id, [item.id])
         }
      })
   })
   analytics.trigger('Bookmarks', 'REMOVE_BOOKMARK', props.data.identifier)
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

   :deep(i.bookmark) {
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

   :deep(i.bookmark.disabled) {
      color: #ccc;
   }

   :deep(i.fas.bookmark) {
      color: var(--uvalib-brand-blue-light);
   }
}
</style>
