<template>
   <VirgoButton v-if="system.isKiosk==false" text role="switch" @click="bookmarkClicked" :icon="bookmarkIcon" rounded
      :aria-label="ariaLabel" :aria-checked="bookmarkCount > 0" ref="bookmarkbtn"
      :class="{checked: bookmarkCount > 0}" >
   </VirgoButton>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useBookmarkStore } from "@/stores/bookmark"
import analytics from '@/analytics'
import { useConfirm } from "primevue/useconfirm"

const props = defineProps({
   pool: {
      type: String,
      required: true
   },
   hit: {
      type: Object,
      required: true
   },
   origin: {
      type: String,
      required: true
   }
})

const system = useSystemStore()
const bookmarkStore = useBookmarkStore()
const confirm = useConfirm()
const bookmarkbtn = ref()

const ariaLabel = computed(() => {
   let title = props.hit.title
   if (props.hit.header) {
      title = props.hit.header.title
   }
   if ( bookmarkCount.value  > 0 ) {
      return`remove bookmark on ${title}`
   }
   return `bookmark ${title}`
})

const bookmarkIcon = computed(() => {
   if ( bookmarkCount.value > 0 ) {
      return "bookmark fas fa-bookmark"
   }
   return "bookmark fal fa-bookmark"
})

const bookmarkCount = computed(()=>{
   return bookmarkStore.bookmarkCount( props.pool, props.hit.identifier)
})

const bookmarkClicked = (() => {
   if ( bookmarkCount.value == 0) {
      bookmarkStore.showAddBookmark( props.pool, props.hit, bookmarkbtn.value.$el, props.origin )
      return
   }

   if ( bookmarkCount.value == 1) {
      removeBookmark()
      return
   }

   confirm.require({
      message: `This item is bookmarked in <b>${bookmarkCount.value}</b> folders. Remove all?<br/>This cannot be reversed.<br/><br/>Continue?`,
      header: 'Confirm Remove Bookmarks',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
         label: 'Cancel',
         severity: 'secondary'
      },
      acceptProps: {
         label: 'Remove'
      },
      accept: () => {
         removeBookmark()
      },
      reject: () => {
         bookmarkbtn.value.$el.focus()
      }
   })
})

const removeBookmark = ( () => {
   bookmarkStore.bookmarks.forEach( folder => {
      folder.bookmarks.forEach( item => {
         if (item.pool == props.pool && item.identifier == props.hit.identifier) {
            bookmarkStore.removeBookmark(folder.id, item.id)
         }
      })
   })
   analytics.trigger('Bookmarks', 'REMOVE_BOOKMARK', props.hit.identifier)
   bookmarkbtn.value.$el.focus()
})
</script>

<style lang="scss" scoped>
.bookmark-icon {
    padding: 2px;
    font-size: 1.4em;
    color: var(--uvalib-text);
    border-radius: 5px;
    margin: 0 auto;
}
</style>
