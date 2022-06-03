<template>
   <div class="bookmarks">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="admin"/>
      <AccountActivities v-if="userStore.isSignedIn"/>
      <div class="working" v-if="bookmarkStore.searching && userStore.isSignedIn || userStore.lookingUp">
         <V4Spinner message="Looking up bookmark information..."/>
      </div>
      <template v-else-if="userStore.isSignedIn">
         <div class="none" v-if="bookmarkStore.hasBookmarks == false">You have no bookmarks</div>
         <ul role="tree" v-else>
            <li v-for="(folderInfo,idx) in bookmarkStore.bookmarks" :key="folderInfo.id" :id="`folder-${folderInfo.id}`"
               role="treeitem" :aria-expanded="folderInfo.expanded" :aria-selected="folderInfo.selected"
               aria-level="1" :aria-posinset="`${idx+1}`" :aria-setsize="bookmarkStore.bookmarks.length"
               class="folder" :tabindex="folderTabIdx(idx)"
               :class="{selected: folderInfo.selected}"
               @click="toggleFolderExpand(folderInfo)"
               @keydown.space.prevent.stop="selectFolder(folderInfo.id)"
               @keydown.enter.prevent.stop="selectFolder(folderInfo.id)"
               @keydown.right.prevent.stop="expandFolder(folderInfo.id)"
               @keydown.left.prevent.stop="collapseFolder(folderInfo.id)"
               @keydown.down.prevent.stop="nextItem(idx)"
               @keydown.up.prevent.stop="prevItem(idx)"
            >
               <div class="folder-label">
                  <i v-if="folderInfo.expanded==false" class="folder fal fa-folder"></i>
                  <i v-else class="folder fal fa-folder-open"></i>
                  <span class="folder-name">{{folderInfo.folder}}</span>
               </div>
               <ul role="group" class="folder-bookmarks" v-if="folderInfo.expanded">
                  <li v-for="(bm,bmIdx) in folderInfo.bookmarks" :key="bm.id" :id="`bookmark-${bm.id}`"
                     aria-level="2" :aria-posinset="`${bmIdx+1}`" :aria-setsize="folderInfo.bookmarks.length"
                     role="treeitem" :aria-selected="focusedBoomkarkID == bm.id" class="item" tabindex="-1"
                     @keydown.down.prevent.stop="nextItem(idx, bmIdx)"
                     @keydown.up.prevent.stop="prevItem(idx, bmIdx)"
                  >
                     <V4Checkbox @click="toggleBookmarkSelected(bm)" :checked="bm.selected" aria-label="select all bookmark"/>
                     <table class="details">
                        <tr>
                           <td class="label">Title:</td>
                           <td>
                              <router-link  @click="bookmarkFollowed(bm.identifier)" :to="detailsURL(bm)">{{bm.details.title}}</router-link>
                           </td>
                        </tr>
                        <tr>
                           <td  class="label">Author:</td>
                           <td>
                              <router-link  @click="bookmarkFollowed(bm.identifier)" :to="detailsURL(bm)">{{bm.details.author}}</router-link>
                           </td>
                        </tr>
                     </table>
                  </li>
               </ul>
            </li>
         </ul>
      </template>
   </div>
</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"

import { useUserStore } from "@/stores/user"
import { useBookmarkStore } from "@/stores/bookmark"
import { onMounted, ref } from 'vue'
import analytics from '@/analytics'

const userStore = useUserStore()
const bookmarkStore = useBookmarkStore()

const focusedBoomkarkID = ref(null)

function folderTabIdx(folderIdx) {
   if (folderIdx == 0) return 0
   return -1
}
function toggleBookmarkSelected(bm) {
   bookmarkStore.toggleBookmarkSelected(bm)
}
function selectFolder(folderID) {
   bookmarkStore.selectFolder(folderID)
}
function expandFolder(folderID) {
   console.log(folderID)
   bookmarkStore.setFolderExpanded(folderID, true)
}
function collapseFolder(folderID) {
   bookmarkStore.setFolderExpanded(folderID, false)
   let folderEle = document.getElementById(`folder-${folderID}`)
   if (folderEle) folderEle.focus()
}
function toggleFolderExpand(folderInfo) {
   bookmarkStore.setFolderExpanded(folderInfo.id, !folderInfo.expanded)
}
function bookmarkFollowed(identifier) {
   analytics.trigger('Bookmarks', 'FOLLOW_BOOKMARK', identifier)
}
function detailsURL(bookmark) {
   return `/sources/${bookmark.pool}/items/${bookmark.identifier}`
}
function nextItem(folderIdx, bmIdx) {
   let tgtFolder = bookmarkStore.bookmarks[folderIdx]
   if (bmIdx !== undefined ) {
      if (bmIdx == (tgtFolder.bookmarks.length-1)) {
         nextFolder(folderIdx)
      } else {
         bmIdx++
         let bm = tgtFolder.bookmarks[bmIdx]
         let bmEle = document.getElementById(`bookmark-${bm.id}`)
         if (bmEle) bmEle.focus()
         focusedBoomkarkID.value = bm.id
      }
      return
   }
   if ( tgtFolder.expanded) {
      let bm = tgtFolder.bookmarks[0]
      let bmEle = document.getElementById(`bookmark-${bm.id}`)
      if (bmEle) bmEle.focus()
      focusedBoomkarkID.value = bm.id
   } else {
      nextFolder(folderIdx)
   }
}
function nextFolder(folderIdx) {
   if ( folderIdx == bookmarkStore.bookmarks.length-1 ) return
   folderIdx++
   let newFolder =  bookmarkStore.bookmarks[folderIdx]
   selectFolder(newFolder.id)
   let folderEle = document.getElementById(`folder-${newFolder.id}`)
   if (folderEle) folderEle.focus()
}
function prevFolder(folderIdx) {
   if ( folderIdx > 0 ) {
      folderIdx--
   }
   let newFolder =  bookmarkStore.bookmarks[folderIdx]
   selectFolder(newFolder.id)
   let folderEle = document.getElementById(`folder-${newFolder.id}`)
   if (folderEle) folderEle.focus()
}
function prevItem(folderIdx, bmIdx) {
   if (bmIdx !== undefined ) {
      if (bmIdx == 0) {
         prevFolder(folderIdx)
      } else {
         let tgtFolder = bookmarkStore.bookmarks[folderIdx]
         bmIdx--
         let bm = tgtFolder.bookmarks[bmIdx]
         let bmEle = document.getElementById(`bookmark-${bm.id}`)
         if (bmEle) bmEle.focus()
         focusedBoomkarkID.value = bm.id
      }
      return
   }
   prevFolder(folderIdx)
}
onMounted(()=>{
   if (userStore.isSignedIn) {
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Bookmarks")
   }
})

</script>
<style lang="scss" scoped>
.bookmarks {
   min-height: 400px;
   position: relative;
   color: var(--color-primary-text);
   width: 80%;
   margin: 2vw auto 0 auto;
   .working {
      text-align: center;
      font-size: 1.25em;
      img {
         margin: 30px 0;
      }
   }
   .none {
      text-align: center;
      font-size: 1.25em;
      margin-top: 35px;
   }
   ul {
      margin: 15px 0 0 0;
      padding: 0;
      list-style: none;
      text-align: left;
      font-size: 1.25em;
      li {
         cursor: pointer;
         padding: 0;
         margin: 5px 0 10px 0;
         outline: none;
         &:focus {
            @include be-accessible();
         }
      }
      .folder {
         margin-right: 10px;
         .folder-label {
            padding: 5px 10px;
            background-color: var(--uvalib-grey-lightest);
            border-bottom: 3px solid var(--uvalib-grey-light);
         }
      }
      .folder.selected {
         // border-left: 1px solid var(--uvalib-blue-alt);
         .folder-label {
            background-color: var(--uvalib-blue-alt-light);
            border-bottom: 3px solid var(--uvalib-blue-alt);
         }
      }
      li.item {
         margin-left: 40px;
         font-size: 0.7em;
         display: flex;
         flex-flow: row nowrap;
         justify-content: flex-start;
         align-items: flex-start;
         border-bottom: 1px solid var(--uvalib-grey-light);
         margin-bottom: 5px;
         padding: 10px;
         &:focus {
            @include be-accessible();
         }
      }
   }
   ul.folder-bookmarks {
      margin: 0 0 25px 0;
      .details {
         margin-left: 20px;
         td.label {
            text-align: right;
            padding: 0 5px 0 0;
            font-weight: bold;
            vertical-align: top;
         }
      }
   }
}
@media only screen and (min-width: 768px) {
   div.bookmarks  {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.bookmarks  {
      width: 95%;
   }
}
</style>
