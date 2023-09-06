<template>
   <V4Button v-if="system.isKiosk==false" mode="icon" @click="bookmarkClicked"
      role="switch" :aria-checked="bookmarkCount > 0" ref="bookmarkbtn" class="bookmark"
      :aria-label="ariaLabel"
   >
      <i :class="bookmarkIcon"></i>
   </V4Button>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useBookmarkStore } from "@/stores/bookmark"
import analytics from '@/analytics'
import { useConfirm } from "primevue/useconfirm"

const emit = defineEmits( ['clicked'] )

const props = defineProps({
   // Fields: Pool, ID, Title. Author optional
   data: { type: Object, required: true},
})

const system = useSystemStore()
const bookmarkStore = useBookmarkStore()
const confirm = useConfirm()
const bookmarkbtn = ref()

const ariaLabel = computed(() => {
   if ( bookmarkCount.value  > 0 ) {
      return `remove bookmark on ${props.data.title}`
   }
   return `bookmark ${props.data.title}`
})

const bookmarkIcon = computed(() => {
   if ( bookmarkCount.value > 0 ) {
      return "bookmark fas fa-bookmark"
   }
   return "bookmark fal fa-bookmark"
})

const bookmarkCount = computed(()=>{
   return bookmarkStore.bookmarkCount( props.data.pool, props.data.identifier)
})

const bookmarkClicked = (() => {
   if ( bookmarkCount.value == 0) {
      bookmarkStore.showAddBookmark( props.data, bookmarkbtn.value.$el )
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
         if (item.pool == props.data.pool && item.identifier == props.data.identifier) {
            bookmarkStore.removeBookmark(folder.id, item.id)
         }
      })
   })
   analytics.trigger('Bookmarks', 'REMOVE_BOOKMARK', props.data.identifier)
   bookmarkbtn.value.$el.focus()
})
</script>

<style lang="scss" scoped>
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

i.fas.bookmark {
   color: var(--uvalib-brand-blue-light);
}
</style>
