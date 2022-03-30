<template>
<V4Modal :id="id" title="Add Bookmark" ref="addbmmodal"
      firstFocusID="folder" lastFocusID="addbookmark-ok" :buttonID="`${id}-btn`" @opened="opened" >
      <template v-slot:button>
         <BookmarkButton :data="data" @clicked="bookmarkButtonClicked()" :id="`${id}-btn`" />
      </template>
      <template v-slot:content>
         <div class="add-content">
            <div>{{data.identifier}} : <b>{{data.title}}</b></div>
            <TruncatedText v-if="data.author" id="bookmark-author" :text="data.author" :limit="120" ></TruncatedText>
            <div class="select pure-form" >
               <template v-if="showAdd==false">
                  <label for="folder">Select a folder for the bookmark</label>
                  <select v-model="selectedFolder" id="folder" name="folder"
                     @keydown.shift.tab.prevent.stop="shiftTabSelect"
                  >
                     <option v-for="(folder) in bookmarks.folders" selected=false
                        :key="folder.id" :value="folder.name ">
                        {{ folder.name }}
                     </option>
                  </select>
               </template>
               <template v-else>
                     <label for="new-folder">Create a new folder for the bookmark</label>
                     <input id="new-folder" type="text" v-model="newFolder" @keyup.enter="okBookmark"
                     @keydown.shift.tab.prevent.stop="shiftTabSelect">
               </template>
            </div>
            <p class="error">{{bookmarkError}}</p>
         </div>
      </template>
       <template v-slot:controls>
         <V4Button  v-if="showAdd==false" class="left" mode="primary" @click="addFolder">New Folder</V4Button>
         <span class="right">
            <V4Button v-if="showAdd==false" mode="tertiary" @click="cancelBookmark">Cancel</V4Button>
            <V4Button v-if="showAdd" mode="tertiary" @click="cancelBookmark">Cancel Create</V4Button>
            <V4Button mode="primary" id="addbookmark-ok" @click="okBookmark"
               :focusNextOverride="true" @tabnext="okAddTab">
               OK
            </V4Button>
         </span>
      </template>
   </V4Modal>
</template>

<script setup>
import TruncatedText from "@/components/TruncatedText.vue"
import BookmarkButton from "@/components/BookmarkButton.vue"
import { ref } from 'vue'
import analytics from '@/analytics'
import { useBookmarkStore } from "@/stores/bookmark"

const emit = defineEmits( ['clicked'])

const props = defineProps({
   // Fields: Pool, ID, Title. Author optional
   data: { type: Object, required: true},
   id: {type: String, required: true}
})

const bookmarks = useBookmarkStore()
const selectedFolder = ref("")
const bookmarkError = ref("")
const showAdd = ref(false)
const newFolder = ref("")
const addbmmodal = ref(null)
const bookmarkData = ref(props.data)

function bookmarkButtonClicked() {
   emit("clicked")
   addbmmodal.value.show()
}
function opened() {
   selectedFolder.value = bookmarks.folders[0].name
   bookmarkError.value = ""
   showAdd.value = false
   newFolder.value = ""
   document.getElementById("folder").focus()
}
function shiftTabSelect() {
   addbmmodal.value.firstFocusBackTabbed()
}
function okAddTab() {
   addbmmodal.value.lastFocusTabbed()
}
function addFolder() {
   showAdd.value = true
   setTimeout( () => {
      document.getElementById("new-folder").focus()
   }, 150)
}
function okBookmark() {
   bookmarkError.value = ""
   if ( showAdd.value ) {
      if ( !newFolder.value) {
         bookmarkError.value = "A bookmark folder name is required"
         return
      }
      bookmarkData.value.folder = newFolder.value
      bookmarks.addBookmark(bookmarkData.value).then( () => {
         addbmmodal.value.hide()
      }).catch((error) => {
         bookmarkError.value = error
      })
   } else {
      if ( !selectedFolder.value) {
         bookmarkError.value = "A bookmark folder selection is required"
         return
      }
      bookmarkData.value.folder = selectedFolder.value
      analytics.trigger('Bookmarks', 'ADD_BOOKMARK', bookmarkData.value.identifier)
      bookmarks.addBookmark(bookmarkData.value).then( () => {
         addbmmodal.value.hide()
      }).catch((error) => {
         bookmarkError.value = error
      })
   }
}
function cancelBookmark() {
   bookmarkError.value = ""
   if (showAdd.value) {
      showAdd.value = false
   } else {
      addbmmodal.value.hide()
   }
}
</script>

<style lang="scss" scoped>
div.add-content {

   div.select {
      margin-top: 10px;
      border-top: 2px solid  var(--uvalib-blue-alt);
      padding-top: 25px;
      min-width:350px;
      width: 100%;

      label {
         font-weight: normal;
         display: block;
         padding-bottom: 5px;
      }

      input, select {
       width: 100%;
      }
   }

   p.error {
      color: var(--uvalib-red-emergency);
      text-align: center;
      margin: 5px 0 15px 0;
   }
}

</style>
