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
                     <option v-for="(folder) in folders" selected=false
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

<script>
import { mapGetters } from "vuex"
import TruncatedText from "@/components/TruncatedText.vue"
import BookmarkButton from "@/components/BookmarkButton.vue"
export default {
   components: {
      TruncatedText, BookmarkButton
   },
   props: {
      // Fields: Pool, ID, Title. Author optional
      data: { type: Object, required: true},
      id: {type: String, required: true}
   },
   data: function() {
      return {
         selectedFolder: "",
         bookmarkError: "",
         showAdd: false,
         newFolder: "",
         bookmarkData: this.data,
      };
   },
   computed: {
       ...mapGetters({
         folders: 'bookmarks/folders',
      }),
   },
   methods: {
      bookmarkButtonClicked() {
         this.$emit("clicked")
         this.$refs.addbmmodal.show()
      },
      opened() {
         this.selectedFolder = this.folders[0].name
         this.bookmarkError = ""
         this.showAdd = false
         this.newFolder = ""
         document.getElementById("folder").focus()
      },
      newFolderTab() {
         document.getElementById("new-folder").focus()
      },
      shiftTabSelect() {
         this.$refs.addbmmodal.firstFocusBackTabbed()
      },
      okAddTab() {
         this.$refs.addbmmodal.lastFocusTabbed()
      },
      addFolder() {
         this.showAdd = true
         setTimeout( () => {
            document.getElementById("new-folder").focus()
         }, 150)
      },
      okBookmark() {
         this.bookmarkError = ""
         if ( this.showAdd ) {
            if ( !this.newFolder) {
               this.bookmarkError = "A bookmark folder name is required"
               return
            }
            this.bookmarkData.folder = this.newFolder
            this.$store.dispatch("bookmarks/addBookmark", this.bookmarkData).then( () => {
               this.$refs.addbmmodal.hide()
            }).catch((error) => {
               this.bookmarkError = error
            })
         } else {
            if ( !this.selectedFolder) {
               this.bookmarkError = "A bookmark folder selection is required"
               return
            }
            this.bookmarkData.folder = this.selectedFolder
            this.$analytics.trigger('Bookmarks', 'ADD_BOOKMARK', this.bookmarkData.identifier)
            this.$store.dispatch("bookmarks/addBookmark", this.bookmarkData).then( () => {
               this.$refs.addbmmodal.hide()
            }).catch((error) => {
               this.bookmarkError = error
            })
         }
      },
      cancelBookmark() {
         this.bookmarkError = ""
         if (this.showAdd) {
            this.showAdd = false
         } else {
            this.$refs.addbmmodal.hide()
         }
      }
   },
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
