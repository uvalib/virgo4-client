<template>
   <div class="bookmarks">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="bookmarks"/>
      <AccountActivities v-if="userStore.isSignedIn"/>
      <div class="working" v-if="bookmarkStore.searching && userStore.isSignedIn || userStore.lookingUp">
         <V4Spinner message="Looking up bookmark information..."/>
      </div>
      <div v-else-if="userStore.isSignedIn">
         <div class="none" v-if="bookmarkStore.hasBookmarks == false">You have no bookmarks</div>
         <template v-else>
            <div class="folder" v-for="(folderInfo,idx) in bookmarkStore.bookmarks" :key="folderInfo.id">
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
                                    <V4Button @click="removeBookmarks(folderInfo.id)" mode="primary">Delete</V4Button>
                                    <V4Button v-if="userStore.canMakeReserves" mode="primary" @click="reserve">Place on course reserve</V4Button>
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
                              <router-link @click="bookmarkFollowed(bookmark.identifier)" :to="detailsURL(bookmark)">
                                 {{bookmark.details.title}}
                              </router-link>
                           </td>
                           <td>
                              <router-link  @click="bookmarkFollowed(bookmark.identifier)" :to="detailsURL(bookmark)">
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

<script setup>
import AccountActivities from "@/components/account/AccountActivities.vue"
import PrintBookmarks from "@/components/modals/PrintBookmarks.vue"
import MoveBookmark from "@/components/modals/MoveBookmark.vue"
import RenameBookmark from "@/components/modals/RenameBookmark.vue"
import AccordionContent from "@/components/AccordionContent.vue"
import { ref, onMounted, nextTick } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { useBookmarkStore } from "@/stores/bookmark"
import { useReserveStore } from "@/stores/reserve"
import analytics from '@/analytics'
import { copyText } from 'vue3-clipboard'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const systemStore = useSystemStore()
const bookmarkStore = useBookmarkStore()
const reserveStore = useReserveStore()
const router = useRouter()

// html element ref
const folderInput = ref(null)

// local data
const createOpen = ref(false)
const newFolder = ref("")
const submitting = ref(false)
const selectedItems = ref([])
const expandedFolder = ref(-1)

function exportBookmarks(folder) {
   bookmarkStore.exportBookmarks(folder )
}
function bookmarkFollowed(identifier) {
   analytics.trigger('Bookmarks', 'FOLLOW_BOOKMARK', identifier)
}
function isSelected(bm) {
   let idx = selectedItems.value.findIndex( bmid => bmid == bm.id)
   return idx != -1
}
function toggleBookmarkSelected(bm) {
   let idx = selectedItems.value.findIndex( bmid => bmid == bm.id)
   if ( idx == -1 ) {
      selectedItems.value.push(bm.id)
   } else {
      selectedItems.value.splice(idx,1)
   }
}
function ariaLabel(bm) {
   return `toggle selection of bookmark for ${bm.details.title} by ${bm.details.author}`
}
function copyURL( folder ) {
   let URL = getPublicURL(folder)
   copyText(URL, undefined, (error, _event) => {
      if (error) {
         systemStore.setError("Unable to copy public bookmarks URL: "+error)
      } else {
         systemStore.setMessage("Public bookmark URL copied to clipboard.")
      }
   })
}
function getTitle(folderInfo) {
   let out = folderInfo.folder
   if (folderInfo.public ){
      out += ` <span style="font-weight:normal; font-size:0.9em;">(public)</span>`
   }
   return out
}
async function publicClicked(folder) {
   await bookmarkStore.toggleFolderVisibility({id: folder.id, public: !folder.public})
}
function getPublicURL(folder) {
   let base = window.location.href
   return `${base}/${folder.token}`
}
function folderOpened(folderID) {
   selectedItems.value = []
   expandedFolder.value = folderID
}
function clearAll() {
   selectedItems.value = []
}
function selectAll(items) {
   selectedItems.value = []
   items.forEach(bm=>{
      selectedItems.value.push(bm.id)
   })
}
function moveBookmarks(folderID) {
   let data = { bookmarks: selectedItems.value, folderID: folderID }
   bookmarkStore.moveBookmarks(data);
}
async function reserve() {
   if ( selectedItems.value.length == 0) {
      systemStore.setError("No items have been selected to put on reserve.<br/>Please select one or more and try again.")
      return
   }

   let items = []
   let folder = bookmarkStore.bookmarks.find( bm => bm.id == expandedFolder.value )
   selectedItems.value.forEach( bmID => {
      let item = folder.bookmarks.find( bm => bm.id == bmID )
      items.push(item)
   })

   // Set the list, and validate that all items in the list are able to be reserved
   reserveStore.setRequestList(items)
   await reserveStore.validateReservesRequest()
   if (reserveStore.invalidReserves.length > 0) {
      let msg = "The following items cannot be placed on course reserve: "
      msg += "<ul style='text-align:left;'>"
      reserveStore.invalidReserves.forEach( r => {
         msg += `<li>${r.details.title}</l1>`
      })
      msg += "</ul>Please deselect these items and try again."
      systemStore.setError(msg)
   } else {
      router.push("/course-reserves-request")
   }
}
function detailsURL(bookmark) {
   return `/sources/${bookmark.pool}/items/${bookmark.identifier}`
}
function removeBookmarks(folderID) {
   if ( selectedItems.value.length == 0) {
      systemStore.setError("No bookmarks selected for deletion.<br/>Select one or more and try again.")
      return
   }
   bookmarkStore.removeBookmarks({folderID: folderID, bookmarkIDs: selectedItems.value})
}
async function removeFolder(folderID, folderIdx) {
   let focusID = "create-folder-btn"
   if ( folderIdx < bookmarkStore.bookmarks.length-1) {
      focusID = bookmarkStore.bookmarks[folderIdx+1].id.toString()+"-header"
   }
   await bookmarkStore.removeFolder(folderID)
   let ele = document.getElementById(focusID)
   if (ele ) {
      ele.focus()
   }
}
function openCreate() {
   createOpen.value = true
   nextTick( () => {
      folderInput.value.focus()
   })
}
function cancelCreate() {
   if (submitting.value) return
   createOpen.value = false
   systemStore.clearMessage()
}
async function createFolder() {
   if (submitting.value) return
   submitting.value = true
   systemStore.clearMessage()
   if (newFolder.value == "") {
      systemStore.setError("A new folder name is required.<br/>Please add one and try again.")
      submitting.value = false
      return
   }
   await bookmarkStore.addFolder(newFolder.value)
   createOpen.value = false
   submitting.value = false
   newFolder.value = ""
   nextTick( () => {
      let btn = document.getElementById("create-folder-btn")
      if (btn) {
         btn.focus()
      }
   })
}

onMounted(()=>{
   if (userStore.isSignedIn) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Bookmarks")
   }
})
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
