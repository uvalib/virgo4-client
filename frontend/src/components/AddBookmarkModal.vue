<template>
   <div class="add-bookmark">
      <div class="modal-title">
         <i class="fas fa-bookmark"></i> &nbsp;Add Bookmark
      </div>
      <div class="modal-content">
         <div class="working" v-if="lookingUp">
            <V4Spinner message="Loading bookmark data..."/>
         </div>
         <template v-else>
            <div>{{newBookmark.data.identifier}} : <b>{{newBookmark.data.header.title}}</b></div>
            <TruncatedText title="" :text="authorText" :limit="120" ></TruncatedText>
            <div class="select pure-form">
               <label>Select a folder for the bookmark</label>
                  <select v-model="selectedFolder" id="folder" name="folder">
                     <option v-for="(folder) in folders" selected=false
                        :key="folder.id" :value="folder.name ">
                        {{ folder.name }}
                     </option>
                  </select>
            </div>
         </template>
         <p class="error">{{bookmarkError}}</p>
      </div>
      <div class="create add pure-form" v-if="showAdd">
         <input id="new-folder" type="text" v-model="newFolder" @keyup.enter="confirmAdd">
         <V4Button mode="tertiary" @click="cancelAdd">Cancel</V4Button>
         <V4Button mode="primary" @click="confirmAdd">Add</V4Button>
      </div>
      <div class="controls" v-else>
         <V4Button class="left" mode="primary" @click="addFolder">New Folder</V4Button>
         <span class="right">
            <V4Button mode="tertiary" @click="cancelBookmark">Cancel</V4Button>
            <V4Button mode="primary" @click="okBookmark">OK</V4Button>
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
      addFolder() {
         this.showAdd = true
         this.$nextTick(()=>{
            document.getElementById("new-folder").focus()
         })
      },
      cancelAdd() {
         this.showAdd = false
      },
      confirmAdd() {
         this.bookmarkError = ""
         if ( !this.newFolder) {
            this.bookmarkError = "A bookmark folder name is required"
            return
         }
         this.$store.dispatch("bookmarks/addBookmark", this.newFolder).then( () => {
            this.$store.commit("bookmarks/closeAddBookmark")
         }).catch((error) => {
            this.bookmarkError = error
         })
      },
      okBookmark() {
         this.bookmarkError = ""
         if ( !this.selectedFolder) {
            this.bookmarkError = "A bookmark folder selection is required"
            return
         }
         this.$store.dispatch("bookmarks/addBookmark", this.selectedFolder).then( () => {
            this.$store.commit("bookmarks/closeAddBookmark")
         }).catch((error) => {
            this.bookmarkError = error
         })
      },
      cancelBookmark() {
         this.$store.commit("bookmarks/closeAddBookmark")
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
}
p.error {
   color: var(--uvalib-red-emergency);
   text-align: center;
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
}
.controls .right {
   float: right;
}
.controls .v4-button.left {
   margin: 0;
}
div.create.add {
   display: flex;
   flex-flow: row nowrap;
   align-content: center;
   padding: 0 10px 10px 10px;
}
div.create.add input {
   margin: 0 5px 0 0 !important;
   flex-grow: 1;
}
div.create.add .v4-button:first-of-type {
   margin-right: 5px;
}
div.select {
   margin-top: 10px;
   border-top: 5px solid var(--uvalib-teal-light);
   padding-top: 25px;
}
label {
   font-weight: normal;
   display: block;
   padding-bottom: 5px;
}
#folder {
   width: 100%;
}
.working {
   color: var(--uvalib-text);
   text-align: center;
}
</style>
