<template>
   <VirgoButton @click="showDialog = true" aria-label="manage selected bookmark storage" label="Move/Copy" :disabled="props.bookmarks.length == 0"/>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Manage Bookmark Storage" @show="opened" :draggable="false">
      <div class="panels">
         <div class="panel">
            <p>Selected bookmark(s):</p>
            <div class="scroller">
               <ul>
                  <li v-for="bm in props.bookmarks" :key="bm.id">
                     {{bm.details.title}}
                  </li>
               </ul>
            </div>
         </div>
         <div class="panel">
            <p>Select the folders where you wish to store the bookmark(s):</p>
            <div class="scroller">
               <ul class="folders">
                  <li v-for="(fi) in bookmarkStore.bookmarks" :key="fi.id">
                     <Checkbox v-model="selectedFolderIDs" :inputId="`tgtf${fi.id}`" :value="fi.id" />
                     <label :for="`tgtf${fi.id}`" class="cb-label">{{ fi.folder }}</label>
                  </li>
               </ul>
            </div>
         </div>
         <p v-if="errorMessage" class="error">{{errorMessage}}</p>
      </div>
      <template #footer>
         <VirgoButton severity="secondary" @click="showDialog = true" label="Cancel"/>
         <VirgoButton @click="okClicked" :disabled="okDisabled" label="OK"/>
      </template>
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

const showDialog = ref(false)
const selectedFolderIDs = ref([])
const errorMessage = ref("")
const okDisabled = ref(false)

const opened = (() => {
   errorMessage.value = ""
   selectedFolderIDs.value = [ props.srcFolder ]
})

const okClicked = ( async () => {
   errorMessage.value = ""
   if ( selectedFolderIDs.value.length == 0) {
       errorMessage.value = "Please select at least one folder"
       return
   }
   await bookmarkStore.manageSelectedBookmarks(props.srcFolder, props.bookmarks, selectedFolderIDs.value)
   showDialog.value = false
})
</script>

<style lang="scss" scoped>
.panels {
   display: flex;
   flex-flow: row wrap;
   justify-content: flex-start;
   gap: 1rem;
   .panel {
      flex: 1;
      p {
         margin: 0 0 10px 0;
      }
   }
}
.scroller {
   overflow-y: scroll;
   max-height: 300px;
   height: 100%;
   border: 1px solid $uva-grey-100;
   background: white;
   padding: 10px 15px;
   overflow-y: scroll;
   border-radius: 0.3rem;

   ul {
      list-style: decimal;
   }
   ul.folders {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
         padding: 0.5rem 0;
         display: flex;
         flex-flow: row nowrap;
         justify-content: flex-start;
         align-items: center;
         gap: 1rem;
      }
   }
}
</style>
