<template>
   <VirgoButton @click="showDialog = true" aria-label="print details about selected bookmarks" label="Print" :disabled="bookmarks.length == 0"/>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Print Details" @show="opened" style="width: 75%" :draggable="false">
      <div class="print">
         <FormKit type="form" id="print" :actions="false" @submit="printClicked" ref="printform">
            <FormKit id="titleinput" label="Title for printout (optional)" type="text" v-model="title"/>
            <FormKit label="Notes (optional)" type="textarea" v-model="notes" :rows="5" />
         </FormKit>
      </div>
      <template #footer>
         <VirgoButton severity="secondary" @click="showDialog = false" label="Cancel"/>
         <VirgoButton @click="printform.node.submit()" label="Print"/>
      </template>
   </Dialog>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { ref } from 'vue'
import analytics from '@/analytics'
import Dialog from 'primevue/dialog'

const bookmarkStore = useBookmarkStore()
const props = defineProps({
   srcFolder: {
      type: Number,
      required: true
   },
   bookmarks: {
      type: Array,
      required: true
   }
})

const printform = ref()
const showDialog = ref(false)
const title = ref("")
const notes = ref("")
const okDisabled = ref(false)

const opened = (() => {
   title.value = ""
   notes.value = ""
})

const printClicked = ( () => {
   analytics.trigger('Bookmarks', 'PRINT_CLICKED')
   // NOTES: using async/await prevents PDF from opening in a separate tab in safari
   // Also, if generation takes too long it is blocked. To work around all cases, open
   // a window with a loading message. Pass it into the print call and set it wth the object URL.
   // Use a callback instead asyn/await to close the popup when done.
   var pdfWindow = window.open("/public/loading")
   okDisabled.value = true
   bookmarkStore.printBookmarks( pdfWindow, title.value, notes.value, props.bookmarks, ()=>{
      showDialog.value = false
      okDisabled.value = false
   })
})

</script>

<style lang="scss" scoped>
.print {
   width: 100%;
}
</style>
