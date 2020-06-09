<template>
   <div role="dialog" aria-labeledby="add-bookmark-modal-title" class="add-bookmark">
      <div id="add-bookmark-modal-title" class="modal-title">Add Bookmark</div>
      <div class="modal-content">
         <div class="working" v-if="lookingUp">
            <V4Spinner message="Loading bookmark data..."/>
         </div>
         <template v-else>
            <div>{{newBookmark.data.identifier}} : <b>{{newBookmark.data.header.title}}</b></div>
            <TruncatedText id="bookmark-author" :text="authorText" :limit="120" ></TruncatedText>
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
         </template>
         <p class="error">{{bookmarkError}}</p>
      </div>
      <div class="controls">
         <V4Button  v-if="showAdd==false" class="left" mode="primary" @click="addFolder">New Folder</V4Button>
         <span class="right">
            <V4Button v-if="showAdd==false" mode="tertiary" @click="cancelBookmark">Cancel</V4Button>
            <V4Button v-if="showAdd" mode="tertiary" @click="cancelBookmark">Cancel Create</V4Button>
            <V4Button mode="primary" id="addbookmark-ok" @click="okBookmark"
               :focusNextOverride="true" @tabnext="okAddTab">
               OK
            </V4Button>
         </span>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import TruncatedText from '@/components/TruncatedText'
export default {
   components: {
      TruncatedText
   },
   data: function() {
      return {
         selectedFolder: "",
         bookmarkError: "",
         showAdd: false,
         newFolder: ""
      };
   },
   computed: {
      ...mapState({
         newBookmark: state => state.bookmarks.newBookmarkInfo,
         lookingUp: state => state.bookmarks.searching,
      }),
       ...mapGetters({
         folders: 'bookmarks/folders',
      }),
      authorText() {
         let author = ""
         if ( this.newBookmark.data.header.author ) {
            author = this.newBookmark.data.header.author.value.join(", ")
         }
         return author
      }
   },
   methods: {
      newFolderTab() {
         document.getElementById("new-folder").focus()
      },
      shiftTabSelect() {
         document.getElementById("addbookmark-ok").focus()
      },
      okAddTab() {
         if ( this.showAdd ) {
            document.getElementById("new-folder").focus()
         } else {
            document.getElementById("folder").focus()
         }
      },
      addFolder() {
         this.showAdd = true
         setTimeout( () => {
            document.getElementById("new-folder").focus()
         }, 150)
      },
      okBookmark() {
         let tgtID = `bookmark-${this.newBookmark.data.identifier}`
         this.bookmarkError = ""
         if ( this.showAdd ) {
            if ( !this.newFolder) {
               this.bookmarkError = "A bookmark folder name is required"
               return
            }
            this.$store.dispatch("bookmarks/addBookmark", this.newFolder).then( () => {
               this.$store.commit("bookmarks/closeAddBookmark")
               this.$emit('closed', tgtID)
            }).catch((error) => {
               this.bookmarkError = error
            })
         } else {
            if ( !this.selectedFolder) {
               this.bookmarkError = "A bookmark folder selection is required"
               return
            }
            this.$store.dispatch("bookmarks/addBookmark", this.selectedFolder).then( () => {
               this.$store.commit("bookmarks/closeAddBookmark")
               this.$emit('closed', tgtID)
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
            let tgtID = `bookmark-${this.newBookmark.data.identifier}`
            this.$store.commit("bookmarks/closeAddBookmark")
            this.$emit('closed', tgtID)
         }
      }
   },
   created() {
      this.$store.dispatch("bookmarks/getBookmarks").then(() => {
         let found = false
         this.folders.some( fobj=> {
            if (fobj.name == "General") {
               found = true
               this.selectedFolder = fobj.name
            }
            return found == true
         })
         document.getElementById("folder").focus()
      })
   }
}
</script>

<style lang="scss" scoped>
div.add-bookmark {
   color: var(--uvalib-text);
   position: fixed;
   width: 40%;
   height: auto;
   top: 15%;
   z-index: 8000;
   background: white;
   left: 50%;
   transform: translate(-50%, 0%);
   box-shadow: $v4-box-shadow;
   border-radius: 5px;

   div.select {
      margin-top: 10px;
      border-top: 5px solid var(--uvalib-teal-light);
      padding-top: 25px;
      width:100%;

      label {
         font-weight: normal;
         display: block;
         padding-bottom: 5px;
      }

      input, select {
       width: 100%;
      }
   }

   .working {
      color: var(--uvalib-text);
      text-align: center;
   }

   p.error {
      color: var(--uvalib-red-emergency);
      text-align: center;
      margin: 5px 0 15px 0;
   }

   div.modal-content {
      padding: 10px 10px 0 10px;
      text-align: left;
   }
   div.modal-title {
      background: var(--uvalib-teal-lightest);
      font-size: 1.1em;
      color: var(--uvalib-text-dark);
      font-weight: bold;
      padding: 10px;
      border-radius: 5px 5px 0 0;
   }
   div.controls {
      padding: 0 10px 10px 10px;
      text-align: left;
      display: flex;
      flex-flow: row nowrap;

      .v4-button.left {
         margin-left: 0;
      }
      .right {
         margin-left: auto;
      }
   }
}
@media only screen and (min-width: 768px) {
   div.add-bookmark {
       width: 40%;
   }
}
@media only screen and (max-width: 768px) {
   div.add-bookmark {
       width: 95%;
   }
}

</style>
