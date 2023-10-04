<template>
   <V4Button mode="primary" @click="openClicked" aria-label="print details about selected bookmarks" ref="trigger">
      Print
   </V4Button>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Print Details" @hide="closeDialog" @show="opened">
      <div class="print">
         <FormKit type="form" id="print" :actions="false" @submit="printClicked">
            <FormKit id="titleinput" label="Title for printout (optional)" type="text" v-model="title"/>
            <FormKit label="Notes (optional)" type="textarea" v-model="notes" :rows="5" />
            <div class="form-controls" >
               <V4Button mode="tertiary" @click="closeDialog">Cancel</V4Button>
               <FormKit type="submit" label="Print" wrapper-class="submit-button" :disabled="okDisabled" />
            </div>
         </FormKit>
      </div>
   </Dialog>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { ref, computed } from 'vue'
import analytics from '@/analytics'
import Dialog from 'primevue/dialog'
import { useToast } from "primevue/usetoast"

const toast = useToast()
const bookmarkStore = useBookmarkStore()
const props = defineProps({
   srcFolder: {
      type: Number,
      required: true
   },
})

const trigger = ref()
const showDialog = ref(false)
const title = ref("")
const notes = ref("")
const okDisabled = ref(false)

const hasSelectedBookmarks = computed(() => {
   return bookmarkStore.selectedBookmarks(props.srcFolder).length > 0
})

const openClicked = (() => {
   if (hasSelectedBookmarks.value == false) {
      toast.add({severity:'error', summary: "Print Error", detail:  "No bookmarks have been selected to print.", life: 5000})
   } else {
      showDialog.value = true
   }
})

const closeDialog = (() => {
   showDialog.value = false
   trigger.value.$el.focus()
})

const opened = (() => {
   title.value = ""
   notes.value = ""
})

const printClicked = ( async () => {
   analytics.trigger('Bookmarks', 'PRINT_CLICKED')
   okDisabled.value = true
   let data = { title: title.value, notes: notes.value, folderID: props.srcFolder}
   await bookmarkStore.printBookmarks( data )
   closeDialog()
   okDisabled.value = false
})

</script>

<style lang="scss" scoped>
.print {
   width: 100%;
}
</style>
