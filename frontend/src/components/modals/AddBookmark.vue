<template>
   <Dialog v-model:visible="bookmarkStore.showAddDialog" :modal="true" position="top" header="Add Bookmark"
      @hide="closeDialog" @show="opened" :draggable="false"
   >
      <div class="add-content" v-if="showSignInMessage">
         <p>You must be signed in to use bookmarks.</p>
         <p>
            <VirgoButton link @click="signInClicked" aria-label="Sign in to bookmark item" label="Sign in now" v-focus/>
         </p>
      </div>
      <div v-else class="add-content">
         <div>{{bookmarkStore.newBookmark.hit.identifier}}: <b>{{bookmarkStore.newTitle}}</b></div>
         <TruncatedText v-if="bookmarkStore.newAuthor" id="bookmark-author" :text="bookmarkStore.newAuthor" :limit="120" ></TruncatedText>
         <div class="select" >
            <template v-if="showAdd==false">
               <label for="folder">Select a folder for the bookmark</label>
               <select v-model="selectedFolder" id="folder" name="folder" v-focus >
                  <option v-for="(folder) in bookmarkStore.sortedFolders" selected=false
                     :key="folder.id" :value="folder.name ">
                     {{ folder.name }}
                  </option>
               </select>
            </template>
            <template v-else>
               <label for="new-folder">Create a new folder for the bookmark</label>
               <input id="new-folder" type="text" v-model="newFolder" @keyup.enter="okBookmark" v-focus>
            </template>
         </div>
         <p class="error">{{bookmarkError}}</p>
      </div>
      <template #footer>
         <VirgoButton v-if="showSignInMessage" severity="secondary" @click="closeDialog" label="Close"/>
         <template v-else>
            <VirgoButton v-if="showAdd==false" class="left" severity="info" @click="addFolder" label="Create new folder"/>
            <VirgoButton severity="secondary" @click="cancelBookmark" label="Cancel"/>
            <VirgoButton @click="okBookmark" label="Add"/>
         </template>
      </template>
   </Dialog>
</template>

<script setup>
import TruncatedText from "@/components/TruncatedText.vue"
import { ref, computed } from 'vue'
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
.left {
   margin-right: auto;
}
div.add-content {
   p {
      padding: 0;
      margin: 0 0 10px 0;
   }

   div.select {
      margin-top: 10px;
      border-top: 2px solid  $uva-blue-alt;
      padding-top: 25px;
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
      color: $uva-red-A;
      text-align: center;
      margin: 5px 0 15px 0;
   }
}

</style>
