<template>
   <main class="bookmarks">
      <h1>My Account</h1>
      <div class="bookmarks-content">
         <AccountActivities/>
         <div class="working" v-if="lookingUp" >
            <div>Looking up account details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else>
            <div class="none" v-if="hasBookmarks == false">
               You have no bookmarks
            </div>
            <template v-else>
               <div class="folder" v-for="folderInfo in bookmarks" :key="folderInfo.id">
                  <RenameBookmark :original="folderInfo" 
                     v-on:rename-approved="renameFolder"/>
                  <ConfirmDelete
                     v-on:delete-approved="removeFolder(folderInfo.id)">
                     <div>Delete bookmark folder <b>{{folderInfo.folder}}</b>? All bookmarks</div>
                     <div>contained within it will also be deleted.</div> 
                     <div><br/>This cannot be reversed.</div>
                  </ConfirmDelete>
                  <AccordionContent class="boxed" background="#f5f5f5" 
                     :title="folderInfo.folder" 
                     align="left">
                     <div class="none" v-if="folderInfo.bookmarks.length == 0">
                        There are no bookmarks in this folder.
                     </div>
                     <div v-else>
                        <table>
                           <tr>
                              <th/><th>Title</th><th>Author</th><th/>
                           </tr>
                           <tr v-for="bookmark in folderInfo.bookmarks" :key="bookmark.id">
                              <td><i @click="removeBookmark(bookmark.id)" class="remove fas fa-trash-alt"></i></td>
                              <td>{{bookmark.details.title}}</td>
                              <td>{{bookmark.details.author}}</td>
                              <td class="icon">
                                 <MoveBookmark :bookmark="bookmark" :srcFolder="folderInfo.id"
                                    v-on:move-approved="moveBookmark"/>
                                 <router-link :to="detailsURL(bookmark)">
                                    <i class="details fas fa-info-circle"></i>
                                 </router-link>
                              </td>
                           </tr>
                           <tr v-if="canMakeReserves">
                              <td class="actions" colspan="4">
                              <span @click="reserve(folderInfo.bookmarks)" 
                                 class="pure-button pure-button-primary all">
                                 Place items on course reserve
                              </span>
                              </td>
                           </tr>
                        </table>
                     </div>
                  </AccordionContent>
               </div>
            </template>
            <div class="controls">
               <span v-if="createOpen==false" @click="openCreate" class="pure-button pure-button-primary">
                  Create Folder
               </span>
               <div v-else  class="create-folder pure-form">
                  <label>New Folder:</label>
                  <input ref="folderInput" @keyup.enter="createFolder" v-model="newFolder" type="text"/>
                  <span @click="cancelCreate" :class="{disabled: submitting}"
                     class="pure-button pure-button-secondary">
                     Cancel
                  </span>
                  <span  @click="createFolder" :class="{disabled: submitting}" 
                     class="pure-button pure-button-primary">
                     Create
                  </span>
               </div>
            </div>
             <transition name="message-transition"
                        enter-active-class="animated faster fadeIn"
                        leave-active-class="animated faster fadeOut">
               <p v-if="error" class="error">{{ error }}</p>
            </transition>
         </div>
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import ConfirmDelete from "@/components/popovers/ConfirmDelete"
import MoveBookmark from "@/components/popovers/MoveBookmark"
import RenameBookmark from "@/components/popovers/RenameBookmark"
import AccordionContent from "@/components/AccordionContent"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "bookmarks",
   components: {
      AccordionContent, ConfirmDelete, AccountActivities,
      MoveBookmark, RenameBookmark
   },
   data: function()  {
      return {
         createOpen: false,
         newFolder: "",
         submitting: false
      }
   },
   computed: {
      ...mapState({
         lookingUp: state=>state.user.lookingUp,
         error: state => state.system.error,
      }),
      ...mapGetters({
         hasBookmarks: 'user/hasBookmarks',
         bookmarks: 'user/bookmarks',
         canMakeReserves: 'user/canMakeReserves'
      }),
   },
   methods: {
      renameFolder(folderInfo) {
         this.$store.dispatch("user/renameFolder", folderInfo)
      },
      moveBookmark(bookmarkID, folderID) {
         let data = {bookmarkID: bookmarkID, folderID: folderID}
         this.$store.dispatch("user/moveBookmark", data)
      },
      reserve(items) {
         this.$store.commit("reserves/setRequestList", items)    
         this.$router.push("/course-reserves-request")
      },
      detailsURL(bookmark) {
         return `/sources/${bookmark.pool}/items/${bookmark.identifier}`
      },
      removeBookmark(id) {
         this.$store.dispatch("user/removeBookmark", id)
      },
      removeFolder(folderID) {
         this.$store.dispatch("user/removeFolder", folderID)
      },
      openCreate() {
         this.createOpen = true
         this.$nextTick(()=>{
            this.$refs.folderInput.focus();
         });
      },
      cancelCreate() {
         if (this.submitting) return 
         this.createOpen = false
         this.$store.commit("system/setError", "")
      },
      createFolder() {
         if (this.submitting) return 
         this.submitting = true
         this.$store.commit("system/setError", "")
         if ( this.newFolder == "") {
            this.$store.commit("system/setError", "A new folder name is required")
            return
         }
         this.$store.dispatch("user/addFolder", this.newFolder).then( () => {
            this.createOpen = false
            this.submitting = false
            this.newFolder = ""
         })
      }
   },
   created() {
      this.$store.dispatch("user/getBookmarks")
   }
}
</script>

<style>
div.accordion.boxed div.title {
   border: 1px solid #ccc;
}
</style>

<style scoped>
.remove, .remove-folder {
   padding: 2px 8px 2px 0;
}
i.fas {
   color: #999;
   cursor: pointer;
   font-size: 1.2em;
   margin-right: 10px;
}
div.folder {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   margin-bottom: 15px;
}
div.folder .remove-folder {
   flex: 0 0 auto;
   padding-top: 4px;
}
div.accordion {
  flex: 1 1 auto; 
}
.bookmarks {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
.bookmarks-content {
   width: 60%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.bookmarks-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.bookmarks-content  {
       width: 95%;
   }
}
td.actions {
   font-size: 0.8em;
   text-align: right;
   padding: 5px;
}
table td, th {
  padding: 2px 8px;
  text-align: left;
  background: white;
  border-bottom: 1px solid #ccc;
}
table  th {
  background: #e5e5e5;
}
td.icon {
   text-align: right;
   padding: 5px 5px 0 5px;
}
table {
   margin: 0px;
   border: 1px solid #ccc;
   border-top: 0;
   width: 100%;
}
div.none {
   font-size: 1.4em;
   text-align: center;
   margin: 35px;
   color: #999;
}
i.details {
   font-size: 1.25em;
   color: var(--color-light-blue)
}
.none {
   text-align: center;
   font-size: 1.25em;
   margin-top: 35px;
}
.controls {
   font-size: 0.9em;
   text-align: right;
   margin-bottom:15px;
}
.create-folder {
   color: #444;
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   justify-content: flex-end;
}
.create-folder label {
   font-weight: bold; 
   margin-right: 10px;
}
</style>

