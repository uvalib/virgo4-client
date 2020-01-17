<template>
   <div class="bookmarks">
      <h1>My Account</h1>
      <div class="bookmarks-content">
         <AccountActivities />
         <div class="working" v-if="lookingUp">
            <V4Spinner message="Looking up bookmark information..."/>
         </div>
         <div v-else>
            <div class="none" v-if="hasBookmarks == false">You have no bookmarks</div>
            <template v-else>
               <div class="folder" v-for="folderInfo in bookmarks" :key="folderInfo.id">
                  <AccordionContent
                     class="boxed"
                     color="var(--uvalib-grey-darkest)"
                     background="var(--uvalib-teal-lightest)"
                     borderWidth="0 0 3px 0"
                     borderColor="var(--uvalib-teal-light)"
                     :id="folderInfo.id.toString()"
                     :title="folderInfo.folder"
                     v-bind:closeOthers="expandedFolder"
                     @accordion-clicked="folderOpened(folderInfo.id)"
                  >
                     <div class="none" v-if="folderInfo.bookmarks.length == 0">
                        There are no bookmarks in this folder.
                     </div>
                     <div v-else>
                        <table>
                           <tr>
                              <th colspan="3">
                                 <div class="folder-menu">
                                    <div>
                                       <span @click="selectAll(folderInfo.bookmarks)" class="text-button">select all</span>
                                       <span class="spacer">|</span>
                                        <span @click="clearAll" class="text-button">clear all</span>
                                    </div>
                                    <div>
                                       <MoveBookmark :bookmarks="selectedItems" :srcFolder="folderInfo.id"
                                          v-on:move-approved="moveBookmarks"/>
                                       <span @click="removeBookmarks" class="pure-button pure-button-primary">Delete</span>
                                       <span v-if="canMakeReserves" @click="reserve"
                                          class="pure-button pure-button-primary">
                                          Place on course reserve
                                       </span>
                                    </div>
                                 </div>
                              </th>
                           </tr>
                           <tr>
                              <th></th>
                              <th>Title</th>
                              <th>Author</th>
                           </tr>
                           <tr v-for="bookmark in folderInfo.bookmarks" :key="bookmark.id">
                              <td>
                                 <input type="checkbox" v-model="selectedItems" :value="bookmark.id" />
                              </td>
                              <td>
                                 <router-link :to="detailsURL(bookmark)">{{bookmark.details.title}}</router-link>
                              </td>
                              <td>
                                 <router-link :to="detailsURL(bookmark)">{{bookmark.details.author}}</router-link>
                              </td>
                           </tr>
                        </table>
                     </div>
                  </AccordionContent>
                  <div class="folder-settings">
                     <RenameBookmark :original="folderInfo" v-on:rename-approved="renameFolder" />
                     <ConfirmDelete v-on:delete-approved="removeFolder(folderInfo.id)">
                        <div>
                           Delete bookmark folder
                           <b>{{folderInfo.folder}}</b>? All bookmarks
                        </div>
                        <div>contained within it will also be deleted.</div>
                        <div>
                           <br />This cannot be reversed.
                        </div>
                     </ConfirmDelete>
                  </div>
               </div>
            </template>
            <div class="controls">
               <span
                  v-if="createOpen==false"
                  @click="openCreate"
                  class="pure-button pure-button-primary"
               >Create Folder</span>
               <div v-else class="create-folder pure-form">
                  <label>New Folder:</label>
                  <input
                     ref="folderInput"
                     @keyup.enter="createFolder"
                     v-model="newFolder"
                     type="text"
                  />
                  <span
                     @click="cancelCreate"
                     :class="{disabled: submitting}"
                     class="pure-button pure-button-tertiary"
                  >Cancel</span>
                  <span
                     @click="createFolder"
                     :class="{disabled: submitting}"
                     class="pure-button pure-button-primary"
                  >Create</span>
               </div>
            </div>
            <transition
               name="message-transition"
               enter-active-class="animated faster fadeIn"
               leave-active-class="animated faster fadeOut"
            >
               <p v-if="error" class="error">{{ error }}</p>
            </transition>
         </div>
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import ConfirmDelete from "@/components/popovers/ConfirmDelete"
import MoveBookmark from "@/components/popovers/MoveBookmark"
import RenameBookmark from "@/components/popovers/RenameBookmark"
import AccordionContent from "@/components/AccordionContent"
import AccountActivities from "@/components/AccountActivities"
import V4Spinner from "@/components/V4Spinner"
export default {
   name: "bookmarks",
   components: {
      AccordionContent,
      ConfirmDelete,
      AccountActivities,
      MoveBookmark,
      RenameBookmark,
      V4Spinner
   },
   data: function() {
      return {
         createOpen: false,
         newFolder: "",
         submitting: false,
         selectedItems: [],
         expandedFolder: -1
      };
   },
   computed: {
      ...mapState({
         lookingUp: state => state.user.lookingUp,
         error: state => state.system.error
      }),
      ...mapGetters({
         hasBookmarks: "user/hasBookmarks",
         bookmarks: "user/bookmarks",
         canMakeReserves: "user/canMakeReserves"
      })
   },
   methods: {
      folderOpened(folderID) {
         this.selectedItems = []
         this.expandedFolder = folderID
      },
      clearAll() {
         this.selectedItems = []
      },
      selectAll(items) {
         this.selectedItems = []
         items.forEach(bm=>{
            this.selectedItems.push(bm.id)
         })
      },
      renameFolder(folderInfo) {
         this.$store.dispatch("user/renameFolder", folderInfo)
      },
      moveBookmarks(folderID) {
         let data = { bookmarks: this.selectedItems, folderID: folderID }
         this.$store.dispatch("user/moveBookmarks", data);
      },
      reserve() {
         if ( this.selectedItems.length == 0) {
             this.$store.commit("system/setError", "No items have been selected to put on reserve")
             return
         }

         let items = []
         let folder = this.bookmarks.find( bm => bm.id == this.expandedFolder )
         this.selectedItems.forEach( bmID => {
            let item = folder.bookmarks.find( bm => bm.id == bmID )
            items.push(item)
         })
         this.$store.commit("reserves/setRequestList", items)
         this.$router.push("/course-reserves-request")
      },
      detailsURL(bookmark) {
         return `/sources/${bookmark.pool}/items/${bookmark.identifier}`
      },
      removeBookmarks() {
         if ( this.selectedItems.length == 0) {
             this.$store.commit("system/setError", "No bookmarks have been selected for deletion")
             return
         }
         this.$store.dispatch("user/removeBookmarks", this.selectedItems)
      },
      removeFolder(folderID) {
         this.$store.dispatch("user/removeFolder", folderID)
      },
      openCreate() {
         this.createOpen = true;
         this.$nextTick(() => {
            this.$refs.folderInput.focus()
         });
      },
      cancelCreate() {
         if (this.submitting) return;
         this.createOpen = false;
         this.$store.commit("system/setError", "")
      },
      createFolder() {
         if (this.submitting) return;
         this.submitting = true;
         this.$store.commit("system/setError", "")
         if (this.newFolder == "") {
            this.$store.commit(
               "system/setError",
               "A new folder name is required"
            );
            return;
         }
         this.$store.dispatch("user/addFolder", this.newFolder).then(() => {
            this.createOpen = false
            this.submitting = false
            this.newFolder = ""
         });
      }
   },
   created() {
      this.$store.dispatch("user/getBookmarks")
   }
};
</script>

<style>
div.accordion.boxed div.title {
   border: 1px solid #ccc;
   font-weight: bold;
   padding: 10px;
}
.spacer {
   margin: 0 5px;
   color: var(--uvalib-grey-light);
}
.folder-menu {
   display: flex;
   flex-direction: row;
   flex-wrap: wrap;
   justify-content: space-between;
   align-content: stretch;
   align-items: flex-start;
}
.folder-menu div:nth-child(1) {
   order: 0;
   flex: 0 1 auto;
   align-self: auto;
}

.folder-menu div:nth-child(2) {
   order: 0;
   flex: 0 1 auto;
   align-self: auto;
}
.folder-settings {
   display: flex;
   padding: 10px 5px 7px 5px;
   background-color: var(--uvalib-teal-lightest);
   border-bottom: 3px solid var(--uvalib-teal-light);
   margin-left: -10px;
}
</style>

<style scoped>
.remove,
.remove-folder {
   padding: 2px 8px 2px 0;
}
i.fas {
   color: var(--uvalib-grey-dark);
   cursor: pointer;
   font-size: 1.2em;
   top: 4px;
   margin-right: 10px;
}
.accordion {
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
   div.bookmarks-content {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.bookmarks-content {
      width: 95%;
   }
}
td.actions {
   text-align: right;
   padding: 5px;
}
table td,
th {
   padding: 2px 8px;
   text-align: left;
   /* background-color: white; */
}
table th {
   padding: 10px 5px;
   background-color: white;
}
table tr:nth-child(2) {
   border-bottom: 1px solid var(--uvalib-grey-light);
}
table tr {
   background-color: white;
}
table tr:hover {
   background-color: var(--uvalib-grey-lightest);
}
table tr:nth-child(2):hover {
   background-color: white;
}
td.icon {
   text-align: right;
   padding: 5px 5px 0 5px;
}
table {
   margin: 0px;
   border-top: 0;
   width: 100%;
}
div.none {
   font-size: 1.4em;
   text-align: center;
   margin: 35px;
   color: var(--uvalib-grey-dark);
}
i.details {
   font-size: 1.25em;
   color: var(--color-light-blue);
}
.none {
   text-align: center;
   font-size: 1.25em;
   margin-top: 35px;
}
.controls {
   text-align: right;
   margin-bottom: 15px;
}
.create-folder {
   color: var(--uvalib-grey-dark);
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   justify-content: flex-end;
}
.create-folder label {
   font-weight: bold;
   margin-right: 10px;
}
p.error {
   margin-bottom: 15px;
}
</style>
