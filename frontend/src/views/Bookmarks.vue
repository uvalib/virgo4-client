<template>
   <div class="bookmarks">
      <h1>My Account</h1>
      <div class="bookmarks-content">
         <AccountActivities />
         <div class="working" v-if="lookingUpBookmarks">
            <V4Spinner message="Looking up bookmark information..."/>
         </div>
         <div v-else>
            <div class="none" v-if="hasBookmarks == false">You have no bookmarks</div>
            <template v-else>
               <V4Spinner message="Please wait..." v-if="working" v-bind:overlay="true" />
               <div class="folder" v-for="folderInfo in bookmarks" :key="folderInfo.id">
                  <AccordionContent
                     class="boxed"
                     color="var(--uvalib-grey-darkest)"
                     background="var(--uvalib-teal-lightest)"
                     borderWidth="0 0 3px 0"
                     borderColor="var(--uvalib-teal-light)"
                     :id="folderInfo.id.toString()"
                     v-bind:closeOthers="expandedFolder"
                     @accordion-clicked="folderOpened(folderInfo.id)"
                  >
                     <template v-slot:title>
                        <span class="folder-title" v-html="getTitle(folderInfo)"></span>
                     </template>
                     <template v-slot:controls>
                        <RenameBookmark :original="folderInfo" v-on:rename-approved="renameFolder" style="margin:0 10px 0 5px" />
                        <ConfirmDelete v-on:delete-approved="removeFolder(folderInfo.id)" 
                           alabel="delete bookmark folder" style="margin-right: 10px">
                           <div>
                              Delete bookmark folder
                              <b>{{folderInfo.folder}}</b>? All bookmarks
                           </div>
                           <div>contained within it will also be deleted.</div>
                           <div>
                              <br />This cannot be reversed.
                           </div>
                        </ConfirmDelete>
                     </template>
                     <div class="none" v-if="folderInfo.bookmarks.length == 0">
                        There are no bookmarks in this folder.
                     </div>
                     <div v-else class="bookmark-folder-details">
                        <table>
                           <tr>
                              <th colspan="3">
                                 <div class="folder-menu">
                                    <div style="margin-bottom:5px;">
                                       <V4Button mode="text" @click="selectAll(folderInfo.bookmarks)"
                                          :aria-label="`select all bookmarks in folder ${folderInfo.folder}`">
                                          select all
                                       </V4Button>
                                       <span class="spacer">|</span>
                                       <V4Button mode="text" @click="clearAll"
                                          :aria-label="`deselect all bookmarks in folder ${folderInfo.folder}`">
                                          clear all
                                       </V4Button>
                                    </div>
                                    <div class="button-group">
                                       <MoveBookmark :bookmarks="selectedItems" :srcFolder="folderInfo.id"
                                          v-on:move-approved="moveBookmarks"/>
                                       <V4Button @click="removeBookmarks" mode="primary">Delete</V4Button>
                                       <V4Button v-if="canMakeReserves" mode="primary" @click="reserve">Place on course reserve</V4Button>
                                    </div>
                                 </div>
                              </th>
                           </tr>
                           <tr>
                              <th colspan="3">
                                 <V4Checkbox class="public" :checked="folderInfo.public" @click="publicClicked(folderInfo)"
                                    aria-label="Toggle public visibility of bookmark folder">
                                    Public
                                 </V4Checkbox>
                                 <span v-if="folderInfo.public" class="public-url">
                                    <a :href="getPublicURL(folderInfo)" target="_blank">
                                       <span>View</span><i class="link fas fa-external-link-alt"></i></a>                                    
                                    <span class="sep">|</span>
                                    <V4Button mode="text" @click="copyURL(folderInfo)">Copy URL to clipboard</V4Button>
                                 </span>
                              </th>
                           </tr>
                           <tr>
                              <th></th>
                              <th>Title</th>
                              <th>Author</th>
                           </tr>
                           <tr v-for="bookmark in folderInfo.bookmarks" :key="bookmark.id">
                              <td>
                                 <input type="checkbox" v-model="selectedItems" :value="bookmark.id" 
                                    :aria-label="ariaLabel(bookmark)" />
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
               </div>
            </template>
            <div class="controls">
               <V4Button v-if="createOpen==false" @click="openCreate" mode="primary">Create Folder</V4Button>
               <div v-else class="create-folder pure-form">
                  <label for="newname">New Folder:</label>
                  <input
                     id="newname"
                     ref="folderInput"
                     @keyup.enter="createFolder"
                     v-model="newFolder"
                     type="text"
                     aria-required="true" required="required"
                  />
                  <V4Button @click="cancelCreate" :class="{disabled: submitting}" mode="tertiary">Cancel</V4Button>
                  <V4Button @click="createFolder" class="{disabled: submitting}" mode="primary">Create</V4Button>
               </div>
            </div>
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
export default {
   name: "bookmarks",
   components: {
      AccordionContent,
      ConfirmDelete,
      AccountActivities,
      MoveBookmark,
      RenameBookmark,
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
         lookingUpBookmarks: state => state.bookmarks.searching,
         working: state => state.searching,
      }),
      ...mapGetters({
         hasBookmarks: "bookmarks/hasBookmarks",
         bookmarks: "bookmarks/bookmarks",
         canMakeReserves: "user/canMakeReserves",
         invalidReserves: "reserves/getInvalidReserveItems"
      })
   },
   methods: {
      ariaLabel(bm) {
         return `toggle selection of bookmark for ${bm.details.title} by ${bm.details.author}`
      },
      copyURL( folder ) {
         let URL = this.getPublicURL(folder)
         this.$copyText(URL).then( ()=> {
            this.$store.commit("system/setMessage", "Public bookmark URL copied to clipboard.")
         }, e => {
            this.$store.commit("system/setError", "Unable to copy public bookmarks URL: "+e)
         })
      },
      getTitle(folderInfo) {
         let out = folderInfo.folder 
         if (folderInfo.public ){
            out += ` <span style="font-weight:normal; font-size:0.9em;">(public)</span>`
         }
         return out
      },
      async publicClicked(folder) {
         await this.$store.dispatch("bookmarks/toggleFolderVisibility", {id: folder.id, public: !folder.public})
      },
      getPublicURL(folder) {
         let base = window.location.href 
         return `${base}/${folder.token}`
      },
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
         this.$store.dispatch("bookmarks/renameFolder", folderInfo)
      },
      moveBookmarks(folderID) {
         let data = { bookmarks: this.selectedItems, folderID: folderID }
         this.$store.dispatch("bookmarks/moveBookmarks", data);
      },
      async reserve() {
         if ( this.selectedItems.length == 0) {
             this.$store.commit("system/setError", 
               "No items have been selected to put on reserve.<br/>Please select one or more and try again.")
             return
         }

         let items = []
         let folder = this.bookmarks.find( bm => bm.id == this.expandedFolder )
         this.selectedItems.forEach( bmID => {
            let item = folder.bookmarks.find( bm => bm.id == bmID )
            items.push(item)
         })

         // Set the list, and validate that all items in the list are able to be reserved
         this.$store.commit("reserves/setRequestList", items)
         await this.$store.dispatch("reserves/validateReservesRequest")
         if (this.invalidReserves.length > 0) {
            let msg = "The following items cannot be placed on course reserve: "
            msg += "<ul style='text-align:left;'>"
            this.invalidReserves.forEach( r => {
               msg += `<li>${r.details.title}</l1>`
            })
            msg += "</ul>Please deselect these items and try again."
            this.$store.commit("system/setError", msg)
         } else {
            this.$router.push("/course-reserves-request")
         }
      },
      detailsURL(bookmark) {
         return `/sources/${bookmark.pool}/items/${bookmark.identifier}`
      },
      removeBookmarks() {
         if ( this.selectedItems.length == 0) {
            this.$store.commit("system/setError","No bookmarks selected for deletion.<br/>Select one or more and try again."
            )
             return
         }
         this.$store.dispatch("bookmarks/removeBookmarks", this.selectedItems)
      },
      removeFolder(folderID) {
         this.$store.dispatch("bookmarks/removeFolder", folderID)
      },
      openCreate() {
         this.createOpen = true;
         setTimeout( () => {
            this.$refs.folderInput.focus()
         }, 150)
      },
      cancelCreate() {
         if (this.submitting) return;
         this.createOpen = false;
         this.$store.commit("system/setError", "")
      },
      createFolder() {
         if (this.submitting) return
         this.submitting = true
         this.$store.commit("system/setError", "")
         if (this.newFolder == "") {
            this.$store.commit(
               "system/setError",
               "A new folder name is required.<br/>Please add one and try again."
            )
            this.submitting = false
            return
         }
         this.$store.dispatch("bookmarks/addFolder", this.newFolder).then(() => {
            this.createOpen = false
            this.submitting = false
            this.newFolder = ""
         });
      }
   },
   created() {
      this.$store.dispatch("bookmarks/getBookmarks")
   }
};
</script>

<style scoped>
.folder-title {
   padding: 5px;
   font-weight: bold;
}
.spacer {
   margin: 0 5px;
   color: var(--uvalib-grey-light);
}
.folder-menu {
   display: flex;
   flex-flow: row wrap;
   justify-content: space-between;
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
.sep {
   margin: 0 5px;
}
i.fas {
   color: var(--uvalib-grey-dark);
   cursor: pointer;
   font-size: 1.2em;
   top: 4px;
   margin-right: 10px;
}
i.link.fas {
   margin: 0 0 0 5px;
   font-size:0.8em;
   color: var(   --color-link);
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
.accordion {
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
.public {
   cursor: pointer;
   color: var(--uvalib-grey-dark);
}
.public span {
   font-weight: normal;
}
.public i.check {
   margin: 0 5px 0 0;
   cursor: pointer;
   font-size: 1em;
}
.public-url {
   font-weight: normal;
   display: inline-block;
   color: var(--uvalib-grey-dark);
   margin-left: 20px;
   margin-top: 10px;
}
.folder-menu .v4-button {
   margin-bottom: 5px;
   flex-grow: 1;
}
.button-group {
   text-align: right;
   display: flex;
   flex-flow: row wrap;
   margin: 0;
}
.bookmark-folder-details {
   padding: 0 5px 10px 10px;
}
</style>
