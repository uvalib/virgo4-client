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
                  class="bookmark-folder"
                  color="var(--uvalib-grey-darkest)"
                  background="var(--uvalib-blue-alt-light)"
                  borderWidth="0 0 3px 0"
                  borderColor="var(--uvalib-blue-alt)"
                  :id="folderInfo.id.toString()"
                  :closeOthers="expandedFolder"
                  @accordion-clicked="folderOpened(folderInfo.id)"
                  @accordion-expanded="folderExpanded(folderInfo.id)"
                  @accordion-collapsed="folderCollapsed(folderInfo.id)"
                  :hasSettings="true" :showSettings="folderInfo.settingsOpen" @settingsClicked="toggleSettings(folderInfo.id)"
               >
                  <template v-slot:title>
                     <span class="folder-title" v-html="getTitle(folderInfo)"></span>
                  </template>
                  <template v-slot:settings>
                     <h4>Folder Settings</h4>
                     <div class="publish">
                        <V4Checkbox class="public" :checked="folderInfo.public" @click="publicClicked(folderInfo)"
                           :aria-label="`Toggle public visibility of bookmark folder ${folderInfo.folder}`" label="Public" />
                        <span v-if="folderInfo.public" class="public-url">
                           <a :href="getPublicURL(folderInfo)" target="_blank">
                              <span>View</span><i class="link fal fa-external-link-alt"></i>
                           </a>
                        </span>
                     </div>
                     <div v-if="folderInfo.folder != 'General'" class="folder-actions">
                        <template v-if="!renaming">
                           <V4Button v-if="folderInfo.public" class="copy-link" mode="primary" @click="copyURL(folderInfo)">Copy public URL</V4Button>
                           <V4Button mode="primary" @click="renameClicked(folderInfo)">Rename</V4Button>
                           <Confirm title="Confirm Delete" buttonLabel="Delete" buttonMode="primary"
                              v-on:confirmed="removeFolder(folderInfo.id, idx)" style="display: inline-block;"
                              class="confirm-delete"
                              :id="`delete-${folderInfo.id}`" >
                              <div>
                                 Delete bookmark folder
                                 <b>{{folderInfo.folder}}</b>? All bookmarks
                              </div>
                              <div>contained within it will also be deleted.</div>
                              <div>
                                 <br />This cannot be reversed.
                              </div>
                           </Confirm>
                        </template>
                        <div v-else class="rename  pure-form">
                           <input @keyup.enter="doRename(folderInfo)"  :id="`rename-folder-${folderInfo.id}`" type="text" v-model="newFolderName"
                               aria-required="true" aria-label="new folder name" required="required"/>
                           <V4Button mode="tertiary" id="rename-cancel" @click="renaming=false">
                              Cancel
                           </V4Button>
                           <V4Button mode="primary" id="rename-ok" @click="doRename(folderInfo)">
                              OK
                           </V4Button>
                        </div>
                     </div>
                  </template>
                  <div class="none" v-if="folderInfo.bookmarks.length == 0">
                     There are no bookmarks in this folder.
                  </div>
                  <div v-else class="bookmark-folder-details">
                     <div class="folder-menu">
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

                     <table>
                        <tr>
                           <th  class="heading checkbox">
                              <V4Checkbox @click="toggleAllClicked(folderInfo.bookmarks)" :checked="selectAllChecked" aria-label="toggle select all bookmarks"/>
                           </th>
                           <th class="heading">Title</th>
                           <th class="heading">Author</th>
                        </tr>
                        <tr v-for="bookmark in folderInfo.bookmarks" :key="bookmark.id">
                           <td class="checkbox">
                              <V4Checkbox :checked="isSelected(bookmark)"  @click="toggleBookmarkSelected(bookmark)"
                                 :aria-label="ariaLabel(bookmark)"/>
                              <abbr class="" :title="itemURL(bookmark)" :data-folder-id="folderInfo.id"></abbr>
                           </td>
                           <td>
                              <router-link @click="bookmarkFollowed(bookmark.identifier)" :to="detailsURL(bookmark)">
                                 {{bookmark.details.title}}
                              </router-link>
                           </td>
                           <td>
                              <router-link v-if="bookmark.details.author" @click="bookmarkFollowed(bookmark.identifier)" :to="detailsURL(bookmark)">
                                 {{bookmark.details.author}}
                              </router-link>
                           </td>
                        </tr>
                     </table>
                  </div>
               </AccordionContent>
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
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import PrintBookmarks from "@/components/modals/PrintBookmarks.vue"
import MoveBookmark from "@/components/modals/MoveBookmark.vue"
import AccordionContent from "@/components/AccordionContent.vue"
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { useBookmarkStore } from "@/stores/bookmark"
import { useReserveStore } from "@/stores/reserve"
import { useItemStore } from "@/stores/item"
import analytics from '@/analytics'
import { copyText } from 'vue3-clipboard'
import { useRouter } from 'vue-router'
import V4Button from "../../components/V4Button.vue"

const userStore = useUserStore()
const systemStore = useSystemStore()
const bookmarkStore = useBookmarkStore()
const reserveStore = useReserveStore()
const itemStore = useItemStore()
const router = useRouter()

// html element ref
const folderInput = ref(null)

// local data
const renaming = ref(false)
const newFolderName = ref("")
const createOpen = ref(false)
const newFolder = ref("")
const submitting = ref(false)
const selectedItems = ref([])
const expandedFolder = ref(-1)
const selectAllChecked = ref(false)

function toggleSettings(folderID) {
   expandedFolder.value = folderID
   bookmarkStore.toggleBookmarkSettings(folderID)
}

function renameClicked( folderInfo) {
   renaming.value = true
   newFolderName.value = folderInfo.folder
   nextTick( () => {
      let ele = document.getElementById("rename-folder-"+folderInfo.id)
      if (ele) {
         ele.select()
         ele.focus()
      }
   })
}
async function doRename(folderInfo) {
   await bookmarkStore.renameFolder({id: folderInfo.id, name: newFolderName.value})
   renaming.value = false
}
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
   selectAllChecked.value = false
}
function folderExpanded(folderID) {
   bookmarkStore.closeOtherSettings(folderID)
   showFolderItemsForZotero(folderID)
}
function folderCollapsed(folderID) {
   hideFolderItemsForZotero(folderID)
}
function toggleAllClicked(items) {
   selectAllChecked.value = !selectAllChecked.value
   if (selectAllChecked.value == false ) {
         selectedItems.value = []
   } else {
      selectedItems.value = []
      items.forEach(bm=>{
         selectedItems.value.push(bm.id)
      })
   }
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
function itemURL(bookmark) {
   return itemStore.getItemURL(bookmark.pool, bookmark.identifier)
}

function removeBookmarks(folderID) {
   if ( selectedItems.value.length == 0) {
      systemStore.setError("No bookmarks selected for deletion.<br/>Select one or more and try again.")
      return
   }
   bookmarkStore.removeBookmarks(folderID, selectedItems.value)
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

function browserSizeChanged() {
   expandedFolder.value = -1
   console.log("EXPANEDED FOLDER "+ expandedFolder.value)
}

function showFolderItemsForZotero(folderID) {
   updateFolderItemsForZotero(folderID, "unapi-id")
}

function hideFolderItemsForZotero(folderID) {
   updateFolderItemsForZotero(folderID, "")
}

function updateFolderItemsForZotero(folderID, className) {
   const cells = document.getElementsByTagName('abbr')

   for (let cell of cells) {
      let id = cell.getAttribute("data-folder-id")
      if (id == folderID) {
         cell.className = className
      }
   }

   zoteroItemUpdated()
}

function zoteroItemUpdated() {
   // notify zotero connector of item change(s)
   document.dispatchEvent(new Event('ZoteroItemUpdated', {
      bubbles: true,
      cancelable: true
   }))
}

onMounted(()=>{
   if (userStore.isSignedIn) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Bookmarks")
   }
   // window.addEventListener('resize',  browserSizeChanged)
})

onUnmounted(() => {
    window.removeEventListener('resize',  browserSizeChanged)
})
</script>

<style lang="scss" scoped>
.rename {
   display:flex;
   flex-flow: row wrap;
   input {
      flex-grow: 1;
   }
}
.folder-title {
   padding: 5px;
   font-weight: bold;
}
.folder-menu {
   display: flex;
   flex-flow: row wrap;
   justify-content: flex-end;
   margin: 10px 0;
}
div.folder {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   margin-bottom: 15px;
   .folder-buttons {
      display: flex;
      flex-flow: row nowrap;
      padding-right: 5px;
   }
}
.accordion {
   flex: 1 1 auto;
   h4 {
      margin: 10px 0 20px 0;
      text-align: left;
   }
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
table {
   border-collapse: collapse;
   td {
      padding: 5px 8px;
      text-align: left;
      vertical-align: text-top;
       border: 1px solid var(--uvalib-grey-light);
   }
   th {
      padding: 10px 8px;
      background-color: #f0f0f0;
      text-align: left;
   }
   th.heading {
      border: 1px solid var(--uvalib-grey-light);
   }
}
table tr {
   background-color: white;
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
.publish {
   display: flex;
   flex-flow: row wrap;
   margin: 15px 0;

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
      margin-left: auto;
      i {
         margin: 0 2px 0 7px;
      }

      .copy-link {
         margin-right: 15px;
      }
   }
}

.bookmark-folder-details {
   padding: 0 0 10px 10px;
   .checkbox {
       padding: 5px 10px;
   }
}
</style>
