<template>
   <V4Modal :id="props.id" title="Print Details" ref="printmodal"
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
         <template v-else>
            <div class="print message pure-form">
               <label for="titleinput">Title for Printout (optional)</label>
               <input ref="titleinput" id="titleinput" type="text" v-model="title"
                  @keyup.enter="printClicked"
                  @keydown.shift.tab.stop.prevent="backTabTitle"/>
               <label for="notes">Notes (optional)</label>
               <textarea id="notes" v-model="notes" @keyup.enter="printClicked"></textarea>
               <p class="note">After clicking Print, your printable results will open in another browser tab.</p>
            </div>
         </template>
      </template>
      <template v-if="hasSelectedBookmarks()" v-slot:controls>
         <V4Button mode="tertiary" id="print-cancel" @click="cancelClicked">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="print-ok" @click="printClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            Print
         </V4Button>
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
function backTabTitle() {
   printmodal.value.firstFocusBackTabbed()
}
function nextTabOK() {
   printmodal.value.lastFocusTabbed()
}
</script>

<style lang="scss" scoped>
.print.message.pure-form {
   textarea, input {
      width: 100%;
      margin: 5px 0 35px 0;
      min-width: 400px;
   }
   label {
      display: block;
   }
   .note {
      margin: 10px 25px;
   }
}
</style>
