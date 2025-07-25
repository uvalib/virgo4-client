<template>
   <div class="searches">
      <SignInRequired v-if="userStore.isSignedIn == false" targetPage="searches"/>
      <AccountActivities v-if="userStore.isSignedIn"/>
      <div class="working" v-if="searchStore.lookingUp && userStore.isSignedIn" >
         <V4Spinner message="Loading searches..."/>
      </div>
      <div class="details" v-if="userStore.isSignedIn">
         <template v-if="searchStore.saved.length == 0">
            <div v-if="!searchStore.lookingUp" class="none">You currently have no saved searches</div>
         </template>
         <div class="saved" v-else>
            <h3>Saved Searches</h3>
            <div class="row" v-for="(saved,idx) in searchStore.saved"  :key="saved.token">
               <div class="saved-search">
                  <span class="num">{{idx+1}}.</span>
                  <Checkbox v-model="saved.public" :inputId="saved.token" :binary="true"  @change="publicClicked(saved)"
                     :aria-label="`Toggle public visibility of ${saved.name}`"/>
                  <label :for="saved.token" class="cb-label">Public</label>
                  <span>
                     <router-link :aria-label="`perform search named ${saved.name}`"
                        @mousedown="savedSearchClicked('saved')"
                        :to="searchURL(saved.token)"
                     >
                        {{saved.name}}
                     </router-link>
                  </span>
                  <span class="search-actions">
                     <VirgoButton @click="deleteSearchClicked(saved)" label="Delete" severity="secondary" size="small"/>
                  </span>
               </div>
               <div v-if="saved.public" class="public-controls">
                  <a  class="view" :href="searchURL(saved.token)" target="_blank" aria-describedby="new-window">
                     <span>View published search</span>
                     <i aria-hidden="true" class="link-icon fal fa-external-link-alt"></i>
                  </a>
                  <span class="sep">|</span>
                  <VirgoButton text @click="copyURL(saved.token)" label="Copy published URL to clipboard"/>
                  <span class="sep">|</span>
                  <VirgoButton text @click="openRSSModal(`${saved.token}-open`, saved)" :id="`${saved.token}-open`" class="text-icon">
                     <span>RSS</span><i class="fal fa-rss"></i>
                  </VirgoButton>
               </div>
            </div>
            <div class="controls">
               <VirgoButton severity="secondary" @click="removeAllClicked" label="Delete all saved searches"/>
            </div>
         </div>
         <div v-if="searchStore.history.length > 0" class="history">
            <h3>Recent Searches <span class="info">(Newest to oldest)</span></h3>
            <div class="row" v-for="(h,idx) in searchStore.history"  :key="`h${idx}`">
               <template v-if="urlToText(h).length > 0">
                  <span class="num">{{idx+1}}.</span>
                  <router-link @mousedown="savedSearchClicked('history')" class="history" :to="h">{{urlToText(h)}}</router-link>
               </template>
            </div>
            <div class="controls">
               <VirgoButton severity="secondary" @click="clearHistoryClicked" label="Clear search history" />
            </div>
         </div>
      </div>
      <Dialog v-model:visible="showRSSModal" :modal="true" position="top" :header='`RSS Feed for "${currentFeed.name}"`'
         @hide="closeRSSDialog" :draggable="false"
      >
         <div class="rss-panel">
            <div class="rss-url" v-text="rssURL(currentFeed.token)"></div>
            <p>This feed contains a live search which will include any new items added to the collection.</p>
            <p><b>Note</b>: RSS feeds are not able to show updates from third party sources including articles.</p>
         </div>
         <template #footer >
            <VirgoButton severity="secondary" @click="closeRSSDialog" label="Close"/>
            <VirgoButton @click="copyRSS(currentFeed.token)" label="Copy to clipboard"/>
         </template>
      </Dialog>
   </div>

</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import { ref, onMounted } from 'vue'
import { useUserStore } from "@/stores/user"
import { useSearchStore } from "@/stores/search"
import { useResultStore } from "@/stores/result"
import { useSystemStore } from "@/stores/system"
import analytics from '@/analytics'
import { useClipboard } from '@vueuse/core'
import { useConfirm } from "primevue/useconfirm"
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import { setFocusID } from '@/utils'

const { copy } = useClipboard()
const results = useResultStore()
const userStore = useUserStore()
const searchStore = useSearchStore()
const confirm = useConfirm()
const system = useSystemStore()

const showRSSModal = ref(false)
const showRSSTriggerID = ref("")
const currentFeed = ref({})

const savedSearchClicked = (async (searchType) => {
   if (searchType == "history") {
      analytics.trigger('Navigation', 'SEARCH_HISTORY_CLICKED')
   } else {
      analytics.trigger('Navigation', 'SAVED_SEARCH_CLICKED')
   }
   results.resetSearch()
})

const deleteSearchClicked = ( (savedSearch) => {
   confirm.require({
      message: `Delete saved searched named <b>${savedSearch.name}</b>?<br/>This cannot be reversed.<br/><br/>Continue?`,
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
         searchStore.delete( userStore.signedInUser, savedSearch.id )
      }
   })
})

const removeAllClicked = (() => {
   confirm.require({
      message: `Delete all saved searches?<br/>This cannot be reversed.<br/><br/>Continue?`,
      header: 'Confirm Delete All',
      icon: 'fal fa-exclamation-triangle',
      rejectProps: {
         label: 'Cancel',
         severity: 'secondary'
      },
      acceptProps: {
         label: 'Delete All'
      },
      accept: () => {
         searchStore.deleteAll(userStore.signedInUser)
      }
   })
})

const clearHistoryClicked = (() => {
   confirm.require({
      message: `Delete search history?<br/>This cannot be reversed.<br/><br/>Continue?`,
      header: 'Confirm Clear History',
      icon: 'fal fa-exclamation-triangle',
      rejectProps: {
         label: 'Cancel',
         severity: 'secondary'
      },
      acceptProps: {
         label: 'Clear'
      },
      accept: () => {
         searchStore.clearHistory(userStore.signedInUser)
      }
   })
})

const urlToText = ((url) => {
   if (url.split("?").length === 1) {
      return ""
   }
   let out = url.split("?")[1].replace(/%3a/gi, ":")
   out = out.replace("&filter=", ", filter: ")
   out = out.replace("&pool=", ", target: ")
   out = out.replace("&sort=", ", sort: ")
   if (url.includes("=advanced")) {
      let stripped = out.replace("mode=advanced&", "")
      out = `Advanced Search - ${decodeURI(stripped).replace("|", ", ")}`
   } else {
      out = `Basic Search - ${decodeURI(out).replace("|", ", ")}`
   }
   return out
})

const copyURL = ((token) => {
   let URL = window.location.protocol + "//" + window.location.host + searchURL(token)
   copy(URL)
   system.setToast("Search Copied", "Public search URL copied to clipboard.")
})

const copyRSS = ((token) => {
   copy( rssURL(token) )
   system.setToast("RSS URL Copied", "RSS URL copied to clipboard.")
   closeRSSDialog()
})

const closeRSSDialog = (() => {
   showRSSModal.value = false
   if ( showRSSTriggerID.value ) {
      setFocusID( showRSSTriggerID.value )
      showRSSTriggerID.value = ""
   }
})

const openRSSModal = ((triggerID, rss) => {
   currentFeed.value = rss
   showRSSModal.value = true
   showRSSTriggerID.value = triggerID
})

const publicClicked = ((saved) => {
   saved.userID = userStore.signedInUser
   searchStore.updateVisibility(saved)
})

const searchURL = ((key) => {
   return `/search/${key}`
})

const rssURL = ((key) => {
   return `${window.location.protocol}//${window.location.host}/api/searches/${key}/rss`
})

onMounted(()=>{
   if ( userStore.isSignedIn) {
      searchStore.getAll(userStore.signedInUser)
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Saved Searches")
   }
})
</script>

<style scoped lang="scss">
.none {
   text-align: center;
   font-size: 1.25em;
   margin-top: 35px;
}
.history, .saved {
   text-align: left;
}
span.info {
   font-size: 0.85em;
  font-weight: normal;
}
.searches {
   min-height: 400px;
   position: relative;
   padding-bottom: 50px;
   margin: 0 auto;
   text-align: center;
   .details {
      display: flex;
      flex-direction: column;
      gap: 20px;
   }
}

@media only screen and (min-width: 768px) {
   div.searches {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.searches {
      width: 95%;
   }
}
div.saved-search {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   align-items: center;
   gap: 10px;
}
.public-controls {
   display:flex;
   flex-flow: row wrap;
   justify-content: flex-start;
   align-items: center;
   gap: 5px 10px;
   margin: 8px 0 8px 45px;
   .view {
      margin-right: 10px;
   }
}
div.row {
   border-bottom: 1px solid $uva-grey-100;
   margin-bottom: 5px;
   padding-bottom: 5px;
   label.cb-label {
      font-size: 0.85em;
      margin-right: 20px;
   }
   span.search-actions {
      margin-left: auto;
      display: flex;
      flex-flow: row nowrap;
      align-items: flex-start;
      justify-content: center;
      gap: 10px;
   }
}
span.num {
  font-weight: bold;
  margin-right: 15px;
  display: inline-block;
  width: 30px;
  text-align: right;
  line-height: 1.5em;
  color:$uva-grey;
}
.controls {
   padding: 10px 0;
}
.rss-panel {
   padding: 0;
   margin: 0;
   p {
      padding: 0;
      margin: 10px 0;
   }
   .rss-url  {
      background:  $uva-grey-200;
      padding: 5px 10px;
      margin: 0 0 20px 0;
      border-bottom: 1px solid  $uva-grey-100;
      border-top: 1px solid  $uva-grey-100;
      -webkit-user-select: all; /* for Safari */
      user-select: all;
      word-break: break-all;
      font-weight: bold;
      line-height: 1.5em;
   }
   .rss-message {
      margin-right: auto;
      margin-left: 30%;
      color: $uva-green-A;
      font-weight: bold;
      margin-top: 4px;
   }
}
</style>
