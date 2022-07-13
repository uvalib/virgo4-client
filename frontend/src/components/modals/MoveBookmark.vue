<template>
   <V4Modal :id="props.id" title="Move Bookmarks" ref="movemodal"
      firstFocusID="foldersel" lastFocusID="move-ok" :buttonID="`${props.id}-open`" @opened="opened">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.movemodal.show()" :id="`${props.id}-open`"
            aria-label="move selected bookmarks"
         >
            Move
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="props.bookmarks.length == 0">
            <p>No bookmarks have been selected to move.</p>
         </template>
         <template v-else>
            <div class="move message pure-form">
               <p>Select a new folder for the selected bookmarks</p>
               <select tabindex="0" id="foldersel" v-model="selectedFolder" @keydown.shift.tab.stop.prevent="backTabSelect">
                  <option value="">Select a folder</option>
                  <option v-for="(folder) in otherFolders"
                     :key="folder.id" :value="folder.id ">
                     {{ folder.name }}
                  </option>
               </select>
            </div>
         </template>
      </template>
      <template v-if="props.bookmarks.length > 0" v-slot:controls>
         <V4Button mode="tertiary" id="move-cancel" @click="cancelClicked">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="move-ok" @click="moveClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            Move
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { ref, computed } from 'vue'

const bookmarkStore = useBookmarkStore()

const props = defineProps({
   bookmarks: {
      type: Array,
      required: true
   },
   srcFolder: {
      type: Number,
      required: true
   },
   id: {
      type: String,
      required: true
   }
})

const movemodal = ref(null)
const selectedFolder = ref("")
const otherFolders = computed(() => {
   return bookmarkStore.folders.filter(f => f.id != props.srcFolder)
})

function opened() {
   selectedFolder.value = ""
   if (props.bookmarks.length == 0 ){
      let btn = document.getElementById(props.id+"-close")
      btn.focus()
   }
}
async function moveClicked() {
   let data = { bookmarks: props.bookmarks, folderID: selectedFolder.value }
   await bookmarkStore.moveBookmarks(data);
   movemodal.value.hide()
}
function cancelClicked() {
   movemodal.value.hide()
}
function backTabSelect() {
   movemodal.value.firstFocusBackTabbed()
}
function nextTabOK() {
   movemodal.value.lastFocusTabbed()
}
</script>

<style lang="scss" scoped>
.move.message.pure-form {
   select {
      width: 100%;
   }
}
</style>
