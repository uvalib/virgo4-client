<template>
   <div class="add-bookmark">
      <div class="modal-title">
         <i class="fas fa-bookmark"></i> &nbsp;Add Bookmark
      </div>
      <div class="working" v-if="lookingUp" >
         <div>Loading...</div>
         <img src="../assets/spinner2.gif">
      </div>
      <div class="content">
         <div>{{newBookmark.data.identifier}} : <b>{{newBookmark.data.header.title}}</b></div>
         <div>{{authorText}}</div>
         <div class="select">
            <label>Select a folder for the bookmark: </label> 
            <multiselect v-model="selectedFolder" class="folders"  
                  placeholder="Select or create a folder"
                  :showLabels="false" 
                  :searchable="true"
                  :taggable="true"
                  track-by="id" label="name"
                  tagPlaceholder="Press enter to create a new folder"
                  @tag="addFolder"
                  :options="folders">
            </multiselect>
         </div>
         <p class="error">{{bookmarkError}}</p>
      </div>
      <div class="controls">
         <span @click="cancelBookmark" class="pure-button pure-button-secondary">Cancel</span>
         <span @click="okBookmark" class="pure-button pure-button-primary">OK</span>  
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import Multiselect from 'vue-multiselect'
export default {
   components: {
      Multiselect
   },
   data: function() {
      return {
         lookingUp: true,
         selectedFolder: null,
         bookmarkError: ""
      };
   },
   computed: {
      ...mapState({
         newBookmark: state => state.user.newBookmarkInfo,
      }),
       ...mapGetters({
         folders: 'user/folders',
      }),
      authorText() {
         let author = "" 
         if ( this.newBookmark.data.header.author ) {
            author = this.newBookmark.data.header.author.join(", ")
         }
         return author
      }
   },
   methods: {
      addFolder(newFolder) {
         this.$store.dispatch("user/addFolder", newFolder).then( () => {
            this.folders.some( (f)=> {
               if (f.name == newFolder) {
                  this.selectedFolder = f
                  return true
               }
               return false
            })
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
         this.$store.dispatch("user/addBookmark", this.selectedFolder.name).then( () => {
            this.$store.commit("user/closeAddBookmark")
         }).catch((error) => {
            this.bookmarkError = error
         })
      },
      cancelBookmark() {
         this.$store.commit("user/closeAddBookmark")
      }
   },
   created() {
      this.lookingUp = true
      this.$store.dispatch("user/getBookmarks").then(() => {
         this.lookingUp = false
         let found = false
         this.folders.some( fobj=> {
            if (fobj.name == "General") {
               found = true 
               this.selectedFolder = fobj
            }
            return found == true
         })
      })
   }
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
div.add-bookmark {
   font-size: 0.9em;
   color: #444;
   position: fixed;
   width: 40%;
   height: auto;
   top: 15%;
   z-index: 8000;
   background: white;
   left: 50%;
   transform: translate(-50%, 0%);
   box-shadow: 1px 1px 10px #444;
   border-radius: 5px;
}
p.error {
   color: var(--color-error);
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
div.content {
   padding: 10px;
   text-align: left;
}
div.modal-title {
   background: var(--color-primary-orange);
   font-size: 1.1em;
   color:white; 
   font-weight: bold;
   padding: 4px; 
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
   border-top: 5px solid var(--color-primary-orange);
   padding-top: 25px;
}
label {
   font-weight: normal;
   display: block;
   margin-bottom: 10px;
}
</style>
