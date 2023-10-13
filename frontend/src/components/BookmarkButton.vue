<template>
   <VirgoButton v-if="system.isKiosk==false" text :icon="bookmarkIcon"
      :class="{checked: bookmarkCount > 0}" role="switch" @click="bookmarkClicked"
      :aria-label="ariaLabel" :aria-checked="bookmarkCount > 0" ref="bookmarkbtn" />
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
      rejectClass: 'p-button-secondary',
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
.p-button.p-component.p-button-icon-only.p-button-text {
    padding: 0;
    height: auto;
    font-size: 1.4em;
    color: #444;
    width: auto;
    border-radius: 5px;
    &:focus  {
      box-shadow: none;
    }
}
.p-button.p-component.p-button-icon-only.p-button-text.checked {
   color: var(--uvalib-brand-blue-light);
}
</style>
