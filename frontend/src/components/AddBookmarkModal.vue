<template>
   <div class="add-bookmark">
      <div class="modal-title">
         <i class="fas fa-bookmark"></i> &nbsp;Add Bookmark
      </div>
      <div class="working" v-if="lookingUp" >
         <div>Loading...</div>
         <div class="spinner">
           <div class="bounce1"></div>
           <div class="bounce2"></div>
           <div class="bounce3"></div>
         </div>
      </div>
      <div class="content">
         <div>{{newBookmark.data.identifier}} : <b>{{newBookmark.data.header.title}}</b></div>
         <div>{{authorText}}</div>
         <div class="select">
            <label>Select a folder for the bookmark: </label>
               <select v-model="selectedFolder" id="folder" name="folder">
                  <option v-for="(folder) in folders" selected=false
                     :key="folder.id" :value="folder.name ">
                     {{ folder.name }}
                  </option>
               </select>
         </div>
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
export default {
   data: function() {
      return {
         lookingUp: true,
         selectedFolder: "",
         bookmarkError: ""
      };
   },
   computed: {
      ...mapState({
         newBookmark: state => state.user.newBookmarkInfo,
      }),
       ...mapGetters({
         folders: 'user/bookmarkFolders',
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
      okBookmark() {
         this.bookmarkError = ""
         if ( !this.selectedFolder) {
            this.bookmarkError = "A bookmark folder selection is required"
            return
         }
         this.$store.dispatch("user/addBookmark", this.selectedFolder).then( () => {
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
               this.selectedFolder = fobj.name
            }
            return found == true
         })
      })
   }
}
</script>
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
div.content {
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
.spinner {
  margin: 0 auto;
  width: 80px;
  text-align: center;
}
.spinner > div {
  width: 18px;
  height: 18px;
  background-color: var(--uvalib-brand-orange);
  border-radius: 100%;
  display: inline-block;
  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  margin: 0 2px;
}
.spinner .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.spinner .bounce2 {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
@-webkit-keyframes sk-bouncedelay {
  0%, 80%, 100% { -webkit-transform: scale(0) }
  40% { -webkit-transform: scale(1.0) }
}
@keyframes sk-bouncedelay {
  0%, 80%, 100% {
    -webkit-transform: scale(0);
    transform: scale(0);
  } 40% {
    -webkit-transform: scale(1.0);
    transform: scale(1.0);
  }
}
</style>
