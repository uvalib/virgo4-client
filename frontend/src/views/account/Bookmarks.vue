<template>
   <div class="bookmarks">
      <SignInRequired v-if="isSignedIn == false" targetPage="bookmarks"/>
      <AccountActivities v-if="isSignedIn"/>
      <div class="working" v-if="lookingUpBookmarks && isSignedIn">
         <V4Spinner message="Looking up bookmark information..."/>
      </div>
      <div v-else-if="isSignedIn">
         <div class="none" v-if="hasBookmarks == false">You have no bookmarks</div>
         <template v-else>
            <V4Spinner message="Please wait..." v-if="working" v-bind:overlay="true" />
            <div class="folder" v-for="(folderInfo,idx) in bookmarks" :key="folderInfo.id">
               <AccordionContent
                  class="boxed bookmark-folder"
                  color="var(--uvalib-grey-darkest)"
                  background="var(--uvalib-blue-alt-light)"
                  borderWidth="0 0 3px 0"
                  borderColor="var(--uvalib-blue-alt)"
                  :id="folderInfo.id.toString()"
                  v-bind:closeOthers="expandedFolder"
                  @accordion-clicked="folderOpened(folderInfo.id)"
               >
                  <template v-slot:title>
                     <span class="folder-title" v-html="getTitle(folderInfo)"></span>
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
                                    <V4Button mode="primary" @click="exportBookmarks(folderInfo.folder)">
                                       Export
                                    </V4Button>
                                    <PrintBookmarks :bookmarks="selectedItems" :srcFolder="folderInfo.id"
                                       :id="`print-bookmarks-${folderInfo.id}`"
                                    />
                                    <MoveBookmark :bookmarks="selectedItems" :srcFolder="folderInfo.id"
                                       :id="`move-bookmarks-${folderInfo.id}`"
                                       v-on:move-approved="moveBookmarks"/>
                                    <V4Button @click="removeBookmarks" mode="primary">Delete</V4Button>
                                    <V4Button v-if="canMakeReserves" class="disabled" mode="primary" @click="reserve">Place on course reserve</V4Button>
                                 </div>
                              </div>
                           </th>
                        </tr>
                        <tr>
                           <th colspan="3">
                              <V4Checkbox class="public" :checked="folderInfo.public" @click="publicClicked(folderInfo)"
                                 :aria-label="`Toggle public visibility of bookmark folder ${folderInfo.folder} `">
                                 Public
                              </V4Checkbox>
                              <span v-if="folderInfo.public" class="public-url">
                                 <a :href="getPublicURL(folderInfo)" target="_blank">
                                    <span>View</span><i class="link fal fa-external-link-alt"></i></a>
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
                              <V4Checkbox :checked="isSelected(bookmark)"  @click="toggleBookmarkSelected(bookmark)"
                                 :aria-label="ariaLabel(bookmark)" />
                           </td>
                           <td>
                              <router-link @click.native="bookmarkFollowed(bookmark.identifier)" :to="detailsURL(bookmark)">
                                 {{bookmark.details.title}}
                              </router-link>
                           </td>
                           <td>
                              <router-link  @click.native="bookmarkFollowed(bookmark.identifier)" :to="detailsURL(bookmark)">
                                 {{bookmark.details.author}}
                              </router-link>
                           </td>
                        </tr>
                     </table>
                  </div>
               </AccordionContent>
               <div class="folder-buttons">
                  <RenameBookmark :id="`rename-${folderInfo.id}`" :folderInfo="folderInfo" v-if="folderInfo.folder != 'General'"/>
                  <Confirm title="Confirm Delete" v-on:confirmed="removeFolder(folderInfo.id, idx)"
                     :id="`delete-${folderInfo.id}`" style="margin-right: 10px"
                     :ariaLabel="`delete bookmark folder ${folderInfo.folder}`" v-if="folderInfo.folder != 'General'" >
                     <div>
                        Delete bookmark folder
                        <b>{{folderInfo.folder}}</b>? All bookmarks
                     </div>
                     <div>contained within it will also be deleted.</div>
                     <div>
                        <br />This cannot be reversed.
                     </div>
                  </Confirm>
               </div>
            </div>
         </template>
         <div class="controls">
            <V4Button v-if="createOpen==false" @click="openCreate" id="create-folder-btn" mode="primary">Create Folder</V4Button>
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
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import PrintBookmarks from "@/components/modals/PrintBookmarks"
import MoveBookmark from "@/components/modals/MoveBookmark"
import RenameBookmark from "@/components/modals/RenameBookmark"
import AccordionContent from "@/components/AccordionContent"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "bookmarks",
   components: {
      AccordionContent,
      AccountActivities,
      MoveBookmark,
      RenameBookmark,
      PrintBookmarks
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
         invalidReserves: "reserves/getInvalidReserveItems",
         isSignedIn: 'user/isSignedIn',
      })
   },
   methods: {
      exportBookmarks(folder) {
         this.$store.dispatch("bookmarks/exportBookmarks", folder )
      },
      bookmarkFollowed(identifier) {
         this.$analytics.trigger('Bookmarks', 'FOLLOW_BOOKMARK', identifier)
      },
      isSelected(bm) {
         let idx = this.selectedItems.findIndex( bmid => bmid == bm.id)
         return idx != -1
      },
      toggleBookmarkSelected(bm) {
         let idx = this.selectedItems.findIndex( bmid => bmid == bm.id)
         if ( idx == -1 ) {
            this.selectedItems.push(bm.id)
         } else {
            this.selectedItems.splice(idx,1)
         }
      },
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
      moveBookmarks(folderID) {
         let data = { bookmarks: this.selectedItems, folderID: folderID }
         this.$store.dispatch("bookmarks/moveBookmarks", data);
      },
      async reserve() {
         // if ( this.selectedItems.length == 0) {
         //     this.$store.commit("system/setError",
         //       "No items have been selected to put on reserve.<br/>Please select one or more and try again.")
         //     return
         // }

         // let items = []
         // let folder = this.bookmarks.find( bm => bm.id == this.expandedFolder )
         // this.selectedItems.forEach( bmID => {
         //    let item = folder.bookmarks.find( bm => bm.id == bmID )
         //    items.push(item)
         // })

         // // Set the list, and validate that all items in the list are able to be reserved
         // this.$store.commit("reserves/setRequestList", items)
         // await this.$store.dispatch("reserves/validateReservesRequest")
         // if (this.invalidReserves.length > 0) {
         //    let msg = "The following items cannot be placed on course reserve: "
         //    msg += "<ul style='text-align:left;'>"
         //    this.invalidReserves.forEach( r => {
         //       msg += `<li>${r.details.title}</l1>`
         //    })
         //    msg += "</ul>Please deselect these items and try again."
         //    this.$store.commit("system/setError", msg)
         // } else {
         //    this.$router.push("/course-reserves-request")
         // }
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
      async removeFolder(folderID, folderIdx) {
         let focusID = "create-folder-btn"
         if ( folderIdx < this.bookmarks.length-1) {
            focusID = this.bookmarks[folderIdx+1].id.toString()+"-header"
         }
         await this.$store.dispatch("bookmarks/removeFolder", folderID)
         let ele = document.getElementById(focusID)
         if (ele ) {
            ele.focus()
         }
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
         this.$store.commit("system/clearMessage")
      },
      async createFolder() {
         if (this.submitting) return
         this.submitting = true
         this.$store.commit("system/clearMessage")
         if (this.newFolder == "") {
            this.$store.commit(
               "system/setError",
               "A new folder name is required.<br/>Please add one and try again."
            )
            this.submitting = false
            return
         }
         await this.$store.dispatch("bookmarks/addFolder", this.newFolder)
         this.createOpen = false
         this.submitting = false
         this.newFolder = ""
         this.$nextTick( () => {
            let btn = document.getElementById("create-folder-btn")
            if (btn) {
               btn.focus()
            }
         })
      }
   },
   created() {
      if (this.isSignedIn) {
         this.$analytics.trigger('Navigation', 'MY_ACCOUNT', "Bookmarks")
      }
   }
};
</script>

<style lang="scss" scoped>
div.notice {
   padding: 10px 10px;
   background: var(--uvalib-yellow-light);
   margin: 0 0 15px 0;
   border: 1px solid var(--uvalib-yellow);
   text-align: center;
}
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
   .folder-buttons {
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      background: var(--uvalib-blue-alt-light);
      color: var(--uvalib-grey-darkest);
      border-width: 0px 0px 3px;
      border-style: solid;
      border-color: var(--uvalib-blue-alt);
      padding: 6px 0 5px 0;
   }
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
   margin: 2vw auto 0 auto;
   color: var(--color-primary-text);
   width: 60%;
   margin: 0 auto;
}
.working {
   text-align: center;
   font-size: 1.25em;
}
@media only screen and (min-width: 768px) {
   div.bookmarks {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.bookmarks {
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
   i {
      margin: 0 2px 0 7px;
   }
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
