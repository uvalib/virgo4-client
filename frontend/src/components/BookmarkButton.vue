<template>
   <VirgoButton v-if="system.isKiosk==false && !props.labeled" size="large"
      text rounded role="switch" @click="bookmarkClicked" :icon="bookmarkIcon"
      :aria-checked="bookmarkCount > 0" ref="bookmarkbtn"
      :class="{checked: bookmarkCount > 0}" />
   <VirgoButton v-if="system.isKiosk==false && props.labeled" label="Bookmark"
      text rounded role="switch" @click="bookmarkClicked" :icon="bookmarkIcon"
      :aria-checked="bookmarkCount > 0" ref="bookmarkbtn"
      :class="{checked: bookmarkCount > 0}" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useBookmarkStore } from "@/stores/bookmark"
import analytics from '@/analytics'
import { useConfirm } from "primevue/useconfirm"

const emit = defineEmits( ['clicked'] )

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
   },
   labeled: {
      type: Boolean,
      default: false
   }
})

const system = useSystemStore()
const bookmarkStore = useBookmarkStore()
const confirm = useConfirm()
const bookmarkbtn = ref()

const bookmarkIcon = computed(() => {
   let sz = ""
   if ( props.labeled ) {
      sz = " fa-lg"
   }
   if ( bookmarkCount.value > 0 ) {
      return "bookmark fas fa-bookmark"+sz
   }
   return "bookmark fal fa-bookmark"+sz
})

const bookmarkCount = computed(()=>{
   return bookmarkStore.bookmarkCount( props.pool, props.hit.identifier)
})

const bookmarkClicked = (() => {
   emit("clicked")
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
      icon: 'fal fa-exclamation-triangle',
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
</style>
