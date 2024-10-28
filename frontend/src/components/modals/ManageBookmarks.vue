<template>
   <VirgoButton @click="openClicked" ref="trigger" aria-label="manage selected bookmark storage" label="Move/Copy" :disabled="props.bookmarks.length == 0"/>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Manage Bookmark Storage" @hide="closeDialog" @show="opened">
      <div class="selected-bookmarks scroller">
         <ul>
            <li v-for="bm in props.bookmarks" :key="bm.id">
               {{bm.details.title}}
            </li>
         </ul>
      </div>
      <div class="move message">
         <p>Select the folders where you wish to store the bookmark(s):</p>
         <div class="scroller">
            <ul class="folders">
               <li v-for="(fi) in bookmarkStore.bookmarks" :key="fi.id">
                  <Checkbox v-model="selectedFolderIDs" :inputId="`tgtf${fi.id}`" :value="fi.id" />
                  <label :for="`tgtf${fi.id}`" class="cb-label">{{ fi.folder }}</label>
               </li>
            </ul>
         </div>
         <p class="error">{{errorMessage}}</p>
         <div class="form-controls" >
            <VirgoButton severity="secondary" @click="closeDialog" label="Cancel"/>
            <VirgoButton @click="okClicked" :disabled="okDisabled" label="OK"/>
         </div>
      </div>
   </Dialog>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'

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

const trigger = ref()
const showDialog = ref(false)
const selectedFolderIDs = ref([])
const errorMessage = ref("")
const okDisabled = ref(false)

const openClicked = (() => {
   showDialog.value = true
})

const opened = (() => {
   errorMessage.value = ""
   selectedFolderIDs.value = [ props.srcFolder ]
})

const closeDialog = (() => {
   showDialog.value = false
   // If the act was a move and there are now no bookmarks in the source folder, the trigger button will be gone
   if ( trigger.value ) trigger.value.$el.focus()
})

const okClicked = ( async () => {
   errorMessage.value = ""
   if ( selectedFolderIDs.value.length == 0) {
       errorMessage.value = "Please select at least one folder"
       return
   }
   await bookmarkStore.manageSelectedBookmarks(props.srcFolder, props.bookmarks, selectedFolderIDs.value)
   closeDialog()
})
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
   border: 1px solid $uva-grey-100;
   background: white;
   padding: 10px 15px;
   overflow-y: scroll;
   border-radius: 5px;

   ul.folders {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
         margin: 10px 0;
         display: flex;
         flex-flow: row nowrap;
         justify-content: flex-start;
         align-items: center;
         gap: 10px;
      }
   }
}
</style>
