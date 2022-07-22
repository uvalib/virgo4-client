<template>
   <V4Modal :id="props.id" title="Print Details" ref="printmodal" :controls="hasSelectedBookmarks() == false"
      firstFocusID="titleinput" lastFocusID="print-ok" :buttonID="`${props.id}-open`" @opened="opened">
      <template v-slot:button>
         <V4Button mode="primary" @click="printmodal.show()" :id="`${props.id}-open`"
            aria-label="print details about selected bookmarks"
         >
            Print
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="hasSelectedBookmarks() == false">
            <p>No bookmarks have been selected to print.</p>
         </template>
         <div class="print" v-else>
            <FormKit type="form" id="print" :actions="false" @submit="printClicked">
               <FormKit id="titleinput" label="Title for printout (optional)" type="text" v-model="title"/>
               <FormKit label="Notes (optional)" type="textarea" v-model="notes" :rows="5" />
               <V4FormActions :hasCancel="true" submitLabel="Print" submitID="print-ok"
                  :tabNextOverride="true" @tabnext="nextTabOK"
                  @canceled="cancelClicked"/>
            </FormKit>
         </div>
      </template>
   </V4Modal>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { ref } from 'vue'
import analytics from '@/analytics'

const bookmarkStore = useBookmarkStore()
const props = defineProps({
   srcFolder: {
      type: Number,
      required: true
   },
   id: {
      type: String,
      required: true
   }
})

const printmodal = ref(null)
const title = ref("")
const notes = ref("")

function hasSelectedBookmarks() {
   return bookmarkStore.selectedBookmarks(props.srcFolder).length > 0
}

function opened() {
   title.value = ""
   notes.value = ""
   if ( hasSelectedBookmarks() == false ){
      let btn = document.getElementById(props.id+"-close")
      btn.focus()
   } else {
      let ele = document.getElementById("titleinput")
      ele.focus()
   }
}
async function printClicked() {
   analytics.trigger('Bookmarks', 'PRINT_CLICKED')
   let data = { title: title.value, notes: notes.value, folderID: props.srcFolder}
   await bookmarkStore.printBookmarks( data )
   printmodal.value.hide()
}
function cancelClicked() {
   printmodal.value.hide()
}
function nextTabOK() {
   printmodal.value.lastFocusTabbed()
}
</script>

<style lang="scss" scoped>
.print {
   width: 450px;
}
</style>
