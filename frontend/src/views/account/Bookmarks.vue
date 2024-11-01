<template>
   <div class="bookmarks">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="bookmarks"/>
      <AccountActivities v-if="userStore.isSignedIn"/>
      <div class="working" v-if="bookmarkStore.searching && userStore.isSignedIn || userStore.lookingUp">
         <V4Spinner message="Looking up bookmark information..."/>
      </div>
      <div v-else-if="userStore.isSignedIn" class="list">
         <div class="none" v-if="bookmarkStore.hasBookmarks == false">You have no bookmarks</div>
         <template v-else>
            <AccordionContent  v-for="(folderInfo) in bookmarkStore.bookmarks" :key="folderInfo.id"
               class="bookmark-folder"
               :background=color.blueAlt300
               borderWidth="0 0 3px 0"
               :borderColor=color.blueAlt
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
                  <div class="settings">
                     <h4>Folder Settings</h4>
                     <div class="publish">
                        <span class="toggle">
                           <Checkbox v-model="folderInfo.public" :inputId="`folder${folderInfo.id}`" :binary="true"  @change="publicClicked(folderInfo)"
                              :aria-label="`Toggle public visibility of bookmark folder ${folderInfo.folder}`"/>
                           <label :for="`folder${folderInfo.id}`" class="cb-label">Public</label>
                        </span>
                        <span v-if="folderInfo.public" class="public-url">
                           <a :href="getPublicURL(folderInfo)" target="_blank">
                              <span>View</span><i class="link-icon fal fa-external-link-alt"></i>
                           </a>
                        </span>
                     </div>
                     <div v-if="folderInfo.folder != 'General'" class="folder-actions">
                        <template v-if="!renaming">
                           <VirgoButton v-if="folderInfo.public" @click="copyURL(folderInfo)" label="Copy public URL"/>
                           <VirgoButton @click="renameClicked(folderInfo)" label="Rename"/>
                           <VirgoButton @click="deleteFolderClicked(folderInfo)" label="Delete"/>
                        </template>
                        <div v-else class="rename">
                           <input @keyup.enter="doRename(folderInfo)"  :id="`rename-folder-${folderInfo.id}`" type="text" v-model="newFolderName"
                              aria-required="true" aria-label="new folder name" required="required" v-focus/>
                           <VirgoButton severity="secondary" @click="renaming=false" label="Cancel"/>
                           <VirgoButton @click="doRename(folderInfo)" label="OK"/>
                        </div>
                     </div>
                  </div>
               </template>
               <div class="none" v-if="folderInfo.bookmarks.length == 0">
                  There are no bookmarks in this folder.
               </div>
               <div v-else class="bookmark-folder-content">
                  <div class="folder-menu">
                     <VirgoButton @click="exportBookmarks(folderInfo.folder)" label="Export all"/>
                     <PrintBookmarks :srcFolder="folderInfo.id" :bookmarks="selections" />
                     <ManageBookmarks :srcFolder="folderInfo.id" :bookmarks="selections" />
                     <VirgoButton @click="deleteBookmarksClicked(folderInfo)" label="Delete" :disabled="!hasSelectedBookmarks" />
                     <VirgoButton v-if="userStore.canMakeReserves" @click="reserve" label="Place on video reserves" :disabled="!hasSelectedBookmarks" />
                  </div>

                  <DataTable :value="folderInfo.bookmarks" dataKey="id" showGridlines
                     v-model:selection="selections" @rowReorder="onReorder"
                  >
                     <Column selectionMode="multiple" headerStyle="width: 3rem" />
                     <Column field="title" header="Title">
                        <template #body="slotProps">
                           <router-link @click="bookmarkFollowed(slotProps.data.identifier)" :to="detailsURL(slotProps.data)">
                              {{slotProps.data.details.title}}
                           </router-link>
                           <abbr class="" :title="itemURL(slotProps.data)" :data-folder-id="folderInfo.id"></abbr>
                        </template>
                     </Column>
                     <Column field="details.author" header="Author">
                        <template #body="slotProps">
                           <template v-if="slotProps.data.details.author">{{ valueDisplay(slotProps.data.details.author) }}</template>
                           <span v-else class="na">N/A</span>
                        </template>
                     </Column>
                     <Column field="callNumber" header="Call Number">
                        <template #body="slotProps">
                           <template v-if="slotProps.data.details.callNumber">{{ valueDisplay(slotProps.data.details.callNumber) }}</template>
                           <span v-else class="na">N/A</span>
                        </template>
                     </Column>
                     <Column field="format" header="Format">
                        <template #body="slotProps">
                           <template v-if="slotProps.data.details.format">{{ valueDisplay(slotProps.data.details.format) }}</template>
                           <span v-else class="na">N/A</span>
                        </template>
                     </Column>
                     <Column field="library" header="Library">
                        <template #body="slotProps">
                           <template v-if="slotProps.data.details.library">{{ valueDisplay(slotProps.data.details.library) }}</template>
                           <span v-else class="na">N/A</span>
                        </template>
                     </Column>
                     <Column field="source" header="Source">
                        <template #body="slotProps">
                           {{ sourceName(slotProps.data.pool) }}
                        </template>
                     </Column>
                     <Column rowReorder headerStyle="width: 3rem" :reorderableColumn="false" />
                  </DataTable>
               </div>
            </AccordionContent>
         </template>
         <div class="controls">
            <VirgoButton v-if="createOpen==false" @click="openCreate" id="create-folder-btn" label="Create Folder"/>
            <div v-else class="create-folder">
               <label for="newname">New Folder:</label>
               <input id="newname" @keyup.enter="createFolder" v-model="newFolder" type="text" aria-required="true" required="required" v-focus/>
               <VirgoButton @click="cancelCreate" :disabled="submitting" severity="secondary" label="Cancel"/>
               <VirgoButton @click="createFolder" :disabled="submitting" label="Create"/>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import PrintBookmarks from "@/components/modals/PrintBookmarks.vue"
import ManageBookmarks from "@/components/modals/ManageBookmarks.vue"
import AccordionContent from "@/components/AccordionContent.vue"
import { ref, onMounted, computed } from 'vue'
import { useSystemStore } from "@/stores/system"
import { usePoolStore } from "@/stores/pool"
import { useUserStore } from "@/stores/user"
import { useBookmarkStore } from "@/stores/bookmark"
import { useReserveStore } from "@/stores/reserve"
import { useItemStore } from "@/stores/item"
import analytics from '@/analytics'
import { useClipboard } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { setFocusID, setFocusClass } from '@/utils'
import color from '@/assets/theme/colors.module.scss'

const { copy } = useClipboard()
const confirm = useConfirm()
const toast = useToast()
const userStore = useUserStore()
const systemStore = useSystemStore()
const bookmarkStore = useBookmarkStore()
const reserveStore = useReserveStore()
const itemStore = useItemStore()
const poolStore = usePoolStore()
const router = useRouter()

const renaming = ref(false)
const newFolderName = ref("")
const createOpen = ref(false)
const newFolder = ref("")
const submitting = ref(false)
const expandedFolder = ref(-1)
const selections = ref([])

const onReorder = (( event) => {
   bookmarkStore.reorderFolder(expandedFolder.value, event.value )
})

const hasSelectedBookmarks = computed(() => {
   return selections.value.length > 0
})

const errorToast = ((title, msg) => {
   toast.add({severity:'error', summary:  title, detail:  msg, life: 5000})
})
const infoToast = ((title, msg) => {
   toast.add({severity:'success', summary:  title, detail:  msg, life: 3000})
})

const sourceName = ((poolID) => {
   let pool = poolStore.list.find(p => p.id == poolID)
   if ( pool ) {
      return pool.name
   }
   return poolID
})

const toggleSettings = ((folderID) => {
   expandedFolder.value = folderID
   bookmarkStore.toggleBookmarkSettings(folderID)
})

const valueDisplay = ( (val) => {
   if ( Array.isArray(val) ) return val.join(", ")
   return val
})

const deleteBookmarksClicked = ((folderInfo) => {
      confirm.require({
         message: `All selected bookmarks in ${folderInfo.folder} will be deleted.<br/><br/>This cannot be reversed.<br/><br/>Continue?`,
         header: 'Confirm Delete',
         icon: 'fal fa-exclamation-triangle',
         rejectProps: {
            label: 'Cancel',
            severity: 'secondary'
         },
         acceptProps: {
            label: 'Delete'
         },
         accept: () => {
            bookmarkStore.removeSelectedBookmarks(folderInfo.id, selections.value.map( bm => bm.id))
         }
      })
})

const deleteFolderClicked = ((folderInfo) => {
   let msg = `Delete bookmark folder <b>${folderInfo.folder}</b>?<br/>All bookmarks contained within it will also be deleted.<br/><br/>This cannot be reversed.`
   msg += '<br/><br/>Continue?'
   confirm.require({
      message: msg,
      header: 'Confirm Delete Folder',
      icon: 'fal fa-exclamation-triangle',
      rejectProps: {
         label: 'Cancel',
         severity: 'secondary'
      },
      acceptProps: {
         label: 'Delete Folder'
      },
      accept: () => {
         bookmarkStore.removeFolder(folderInfo.id)
         setFocusClass("accordion-trigger")
      }
   })
})

function renameClicked( folderInfo) {
   renaming.value = true
   newFolderName.value = folderInfo.folder
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
function copyURL( folder ) {
   copy(getPublicURL(folder))
   infoToast("Bookmark Copied", "Public bookmark URL copied to clipboard.")
}
function getTitle(folderInfo) {
   let out = folderInfo.folder
   if (folderInfo.public ){
      out += ` <span style="font-weight:normal; font-size:0.9em;">(public)</span>`
   }
   return out
}
async function publicClicked(folder) {
   await bookmarkStore.updateFolderVisibility(folder)
}
function getPublicURL(folder) {
   let base = window.location.href
   return `${base}/${folder.token}`
}
function folderOpened(folderID) {
   selections.value = []
   expandedFolder.value = folderID
}
function folderExpanded(folderID) {
   bookmarkStore.closeOtherSettings(folderID)
   showFolderItemsForZotero(folderID)
}
function folderCollapsed(folderID) {
   hideFolderItemsForZotero(folderID)
}

async function reserve() {
   // Set the list, and validate that all items in the list are able to be reserved
   reserveStore.setRequestList(selections.value)
   await reserveStore.validateReservesRequest()
   if (reserveStore.invalidReserves.length > 0) {
      let msg = "This button is for use with video reserves only. The following items cannot be placed on video reserves: "
      msg += "<ul style='text-align:left;'>"
      reserveStore.invalidReserves.forEach( r => {
         msg += `<li>${r.details.title}</l1>`
      })
      msg += "</ul>Please deselect these items and try again." +
         "<p><a target=\"_blank\" href=\"https://www.library.virginia.edu/services/course-reserves\">Learn more about placing various types of course reserves.</a> </p>"
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
function openCreate() {
   createOpen.value = true
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
      errorToast("Create Error", "A new folder name is required. Please add one and try again.")
      submitting.value = false
      setFocusID("newname")
      return
   }
   await bookmarkStore.addFolder(newFolder.value)
   createOpen.value = false
   submitting.value = false
   newFolder.value = ""
   setFocusID("create-folder-btn")
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
})
</script>

<style lang="scss" scoped>
:deep(.p-datatable .p-datatable-tbody > tr.p-highlight) {
    background: white;
}
:deep(.p-datatable) {
   font-size: 0.9em;
}
.na {
   color: #ccc;
   font-style: italic;
}
.rename {
   display:flex;
   flex-flow: row wrap;
   input {
      flex-grow: 1;
   }
}

.list {
   display: flex;
   flex-direction: column;
   gap: 20px;
}

div.bookmark-folder {
   .settings {
      h4 {
         margin: 10px 0 20px 0;
         text-align: left;
      }
      .folder-actions {
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-end;
         gap: 5px 10px;
         .rename {
            display: flex;
            flex-flow: row wrap;
            justify-content: flex-end;
            align-content: stretch;
            gap: 10px;
            input {
               width: 250px;
               margin: 0;
            }
         }
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
      gap: 5px 10px;
      margin: 10px 0;
   }
   .bookmark-folder-content {
      padding: 0 0 10px 10px;
      .checkbox {
         padding: 5px 10px;
      }
   }
}

.bookmarks {
   min-height: 400px;
   position: relative;
   margin: 0 auto 0 auto;
   margin: 0 auto;
   padding-bottom: 50px;
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
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-end;
   gap: 10px;
   input {
      flex-grow: 1;
      margin:0;
   }
}

.publish {
   display: flex;
   flex-flow: row wrap;
   margin: 15px 0;
   justify-content: space-between;
   .toggle {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: 10px;
   }
   .public span {
      font-weight: normal;
   }
}
</style>
