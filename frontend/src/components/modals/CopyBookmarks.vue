<template>
   <V4Modal :id="props.id" title="Copy Bookmarks" ref="copymodal"
      firstFocusID="foldersel" lastFocusID="copy-ok" :buttonID="`${props.id}-open`" @opened="opened">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.copymodal.show()" :id="`${props.id}-open`"
            aria-label="copy selected bookmarks"
         >
            Copy
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="props.bookmarks.length == 0">
            <p>No bookmarks have been selected to copy.</p>
         </template>
         <template v-else>
            <div class="move message pure-form">
               <p>Select copy folders for the selected bookmarks:</p>
               <div class="scroller">
                  <ul class="folders">
                     <li v-for="(folder) in otherFolders" :key="folder.id">
                        <V4Checkbox :checked="folder.selected" :label="folder.name"
                           @click="folderClicked(folder.id)" />
                     </li>
                  </ul>
               </div>
            </div>
         </template>
      </template>
      <template v-if="props.bookmarks.length > 0" v-slot:controls>
         <V4Button mode="tertiary" id="copy-cancel" @click="cancelClicked">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="copy-ok" @click="copyClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            Copy
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { useSystemStore } from "@/stores/system"
import { ref } from 'vue'

const bookmarkStore = useBookmarkStore()
const systemStore = useSystemStore()

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

const copymodal = ref(null)
const otherFolders = ref([])

function opened() {
   if (props.bookmarks.length == 0 ){
      let btn = document.getElementById(props.id+"-close")
      btn.focus()
   }

   otherFolders.value = []
   bookmarkStore.folders.filter(f => f.id != props.srcFolder).forEach( f => {
      otherFolders.value.push({id: f.id, name: f.name, selected: false})
   })
}
function folderClicked(folderID) {
   let tgt = otherFolders.value.find( f => f.id == folderID )
   tgt.selected = !tgt.selected
}
async function copyClicked() {
   let data = { bookmarks: props.bookmarks, folderIDs: [] }
   otherFolders.value.forEach( f => {
      if (f.selected) {
         data.folderIDs.push(f.id)
      }
   })
   await bookmarkStore.copyBookmarks(data)
   copymodal.value.hide()
   systemStore.setMessage("Bookmarks have been copied to specified folders.")
}

function cancelClicked() {
   copymodal.value.hide()
}
function nextTabOK() {
   copymodal.value.lastFocusTabbed()
}
</script>

<style lang="scss" scoped>
.move.message.pure-form {
   p {
      margin: 5px 0 10px 0;
   }
}
.scroller {
   overflow-y: scroll;
   max-height: 300px;
   margin: 0 0 10px 0;

   ul.folders {
      list-style: none;
      padding: 0 0 0 20px;
      margin: 0 0 0 0;
   }
}
</style>
