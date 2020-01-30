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
            <div class="select">
               <label>Select a folder for the bookmark: </label>
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
      <div class="controls">
         <span @click="cancelBookmark" class="pure-button pure-button-tertiary">Cancel</span>
         <span @click="okBookmark" class="pure-button pure-button-primary">OK</span>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import TruncatedText from '@/components/TruncatedText'
import V4Spinner from "@/components/V4Spinner"
export default {
   components: {
      TruncatedText, V4Spinner
   },
   data: function() {
      return {
         selectedFolder: "",
         bookmarkError: ""
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
      })
      this.$store.commit('restore/clearAll')
   }
}
</script>
<style>
#app .add-bookmark .v-popover.full {
   width: 100%;
   text-align: right;
}
</style>
<style scoped>
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
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
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
   padding: 10px;
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
   padding: 10px;
   text-align: right;
}
div.controls .pure-button {
   padding: 4px 16px;
}
div.select {
   margin-top: 10px;
   border-top: 5px solid var(--uvalib-teal-light);
   padding-top: 25px;
}
label {
   font-weight: normal;
   display: block;
   margin-bottom: 10px;
}
#folder {
   width: 100%;
}
.working {
   color: var(--uvalib-text);
   text-align: center;
}
</style>
