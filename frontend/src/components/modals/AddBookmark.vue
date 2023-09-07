<template>
   <Dialog v-model:visible="bookmarkStore.showAddDialog" :modal="true" position="top" header="Add Bookmark" @hide="closeDialog" @show="opened">
      <div class="add-content" v-if="showSignInMessage">
         <p>You must be signed in to use bookmarks.</p>
         <p>
            <V4Button mode="text" @click="signInClicked" aria-label="Sign in to bookmark item">Sign in now</V4Button>
         </p>
      </div>
      <div v-else class="add-content">
         <div>{{bookmarkStore.newBookmark.identifier}} : <b>{{bookmarkStore.newBookmark.title}}</b></div>
         <TruncatedText v-if="bookmarkStore.newBookmark.author" id="bookmark-author" :text="bookmarkStore.newBookmark.author" :limit="120" ></TruncatedText>
         <div class="select" >
            <template v-if="showAdd==false">
               <label for="folder">Select a folder for the bookmark</label>
               <select v-model="selectedFolder" id="folder" name="folder">
                  <option v-for="(folder) in bookmarkStore.sortedFolders" selected=false
                     :key="folder.id" :value="folder.name ">
                     {{ folder.name }}
                  </option>
               </select>
            </template>
            <template v-else>
               <label for="new-folder">Create a new folder for the bookmark</label>
               <input id="new-folder" type="text" v-model="newFolder" @keyup.enter="okBookmark">
            </template>
         </div>
         <p class="error">{{bookmarkError}}</p>
      </div>
      <div class="form-controls" >
         <V4Button v-if="showSignInMessage" mode="tertiary" @click="closeDialog">Close</V4Button>
         <template v-else>
            <V4Button  v-if="showAdd==false" class="left" mode="primary" @click="addFolder">New Folder</V4Button>
            <span class="right">
            <V4Button v-if="showAdd==false" mode="tertiary" @click="cancelBookmark">Cancel</V4Button>
            <V4Button v-else mode="tertiary" @click="cancelBookmark">Cancel Create</V4Button>
            <V4Button mode="primary" @click="okBookmark">OK</V4Button>
         </span>
         </template>
      </div>
   </Dialog>
</template>

<script setup>
import TruncatedText from "@/components/TruncatedText.vue"
import { nextTick, ref, computed } from 'vue'
import analytics from '@/analytics'
import { useBookmarkStore } from "@/stores/bookmark"
import { useUserStore } from "@/stores/user"
import { useRestoreStore } from '@/stores/restore'
import Dialog from 'primevue/dialog'
import { useRouter } from 'vue-router'

const bookmarkStore = useBookmarkStore()
const userStore = useUserStore()
const restore = useRestoreStore()
const router = useRouter()

const selectedFolder = ref("")
const bookmarkError = ref("")
const showAdd = ref(false)
const newFolder = ref("")

const showSignInMessage = computed(() => {
   return userStore.isSignedIn == false
})

const signInClicked = (() => {
   restore.setBookmarkRecord(bookmarkStore.newBookmark)
   closeDialog()
   router.push("/signin")
})

const opened = (() => {
   selectedFolder.value = bookmarkStore.sortedFolders[0].name
   bookmarkError.value = ""
   showAdd.value = false
   newFolder.value = ""
})

const cancelBookmark = (() => {
   bookmarkError.value = ""
   if (showAdd.value) {
      showAdd.value = false
   } else {
      closeDialog()
   }
})

const closeDialog = (() => {
   bookmarkStore.clearAddBookmark()
})

const addFolder = (() => {
   showAdd.value = true
   nextTick( () => {
      document.getElementById("new-folder").focus()
   })
})

const okBookmark = (async () => {
   bookmarkError.value = ""
   if ( showAdd.value ) {
      if ( !newFolder.value) {
         bookmarkError.value = "A bookmark folder name is required"
         return
      }
      analytics.trigger('Bookmarks', 'ADD_BOOKMARK', bookmarkStore.newBookmark.identifier)
      await bookmarkStore.addBookmark( newFolder.value )
   } else {
      if ( !selectedFolder.value) {
         bookmarkError.value = "A bookmark folder selection is required"
         return
      }
      analytics.trigger('Bookmarks', 'ADD_BOOKMARK', bookmarkStore.newBookmark.identifier)
      await bookmarkStore.addBookmark( selectedFolder.value )
   }
   closeDialog()
})
</script>

<style lang="scss" scoped>
div.add-content {
   p {
      padding: 0;
      margin: 0 0 10px 0;
   }

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
