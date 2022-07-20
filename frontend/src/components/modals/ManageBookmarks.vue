<template>
   <V4Modal :id="props.id" title="Manage Bookmark Storage" ref="managemodal"
      firstFocusID="manage-ok" lastFocusID="manage-ok" :buttonID="`${props.id}-open`" @opened="opened">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.managemodal.show()" :id="`${props.id}-open`"
            aria-label="manage selected bookmark storage"
         >
            Move/Copy
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="hasSelectedBookmarks() == false">
            <p>No bookmarks have been selected.</p>
         </template>
         <template v-else>
            <div class="selected-bookmarks scroller">
               <ul>
                  <li v-for="bm in bookmarkStore.selectedBookmarks(props.srcFolder)" :key="bm.id">
                     {{bm.details.title}}
                  </li>
               </ul>
            </div>
            <div class="move message">
               <p>Select the folders where you wish to store the bookmark(s):</p>
               <div class="scroller">
                  <ul class="folders">
                     <li v-for="(fi) in bookmarkStore.bookmarks" :key="fi.id">
                        <V4Checkbox :checked="isSelected(fi.id)" :label="fi.folder"
                           @click="folderClicked(fi.id)" />
                     </li>
                  </ul>
               </div>
               <p class="error">{{errorMessage}}</p>
            </div>
         </template>
      </template>
      <template v-if="hasSelectedBookmarks()" v-slot:controls>
         <V4Button mode="tertiary" id="copy-cancel" @click="cancelClicked">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="manage-ok" @click="okClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { ref } from 'vue'

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

const managemodal = ref(null)
const selectedFolderIDs = ref([])
const errorMessage = ref("")

function hasSelectedBookmarks() {
   return bookmarkStore.selectedBookmarks(props.srcFolder).length > 0
}

function opened() {
   errorMessage.value = ""
   if (hasSelectedBookmarks() == false ){
      let btn = document.getElementById(props.id+"-close")
      btn.focus()
   }
   selectedFolderIDs.value = [ props.srcFolder ]
}
function folderClicked(folderID) {
   let fIdx  = selectedFolderIDs.value.findIndex( f => f == folderID)
   if (fIdx > -1) {
      selectedFolderIDs.value.splice(fIdx, 1)
   } else {
      selectedFolderIDs.value.push(folderID)
   }
}
function isSelected( folderID) {
   return selectedFolderIDs.value.includes(folderID)
}
async function okClicked() {
    errorMessage.value = ""
   if ( selectedFolderIDs.value.length == 0) {
       errorMessage.value = "Please select at least one folder"
       return
   }
   let data = { sourceFolderID: props.srcFolder, destFolderIDs: selectedFolderIDs.value }
   await bookmarkStore.manageSelectedBookmarks(data)
   managemodal.value.hide()
}

function cancelClicked() {
   managemodal.value.hide()
}
function nextTabOK() {
   managemodal.value.lastFocusTabbed()
}
</script>

<style lang="scss" scoped>
.move.message {
   p {
      margin: 20px 0 10px 5px;
   }
}
.selected-bookmarks {
   margin: 0 0 20px 0;
   border-bottom: 2px solid var(--uvalib-blue-alt);
   padding: 0;
   ul {
      list-style: decimal;
      padding: 0 0 0 20px;
      margin: 0;
      font-size: 0.9em;
      li {
         padding: 3px 0;
      }
   }
}
.scroller {
   overflow-y: scroll;
   max-height: 150px;
   margin: 15px 0 10px 0;
   border: 1px solid var(--uvalib-grey-light);
   background: white;
   padding: 10px 15px;
   overflow-y: scroll;
   border-radius: 5px;

   ul.folders {
      list-style: none;
      padding: 0;
      margin: 0;
   }
}
</style>
