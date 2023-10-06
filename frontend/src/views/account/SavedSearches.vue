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
                     <span class="icon">
                        <router-link @mousedown="savedSearchClicked('saved')"
                           :to="searchURL(saved.token)"
                           :aria-label="`perform search named ${saved.name}`"
                        >
                           <i class="viewsave fal fa-search"></i>
                        </router-link>
                     </span>
                     <V4Button mode="icon" @click="deleteSearchClicked(saved)" :title="`Delete search named ${saved.name}`" >
                        <i class="trash fal fa-trash-alt"></i>
                     </V4Button>
                  </span>
               </div>
               <div v-if="saved.public" class="public-controls">
                  <a  class="view" :href="searchURL(saved.token)" target="_blank">
                     <span>View published search</span>
                     <i class="link fal fa-external-link-alt"></i>
                  </a>
                  <span class="sep">|</span>
                  <V4Button mode="text" @click="copyURL(saved.token)">Copy published URL to clipboard</V4Button>
                  <span class="sep">|</span>
                  <V4Button @click="openRSSModal(`${saved.token}-open`, saved)" :id="`${saved.token}-open`" mode="text">
                     RSS <i class='link fal fa-rss'></i>
                  </V4Button>
               </div>
            </div>
            <div class="controls">
               <V4Button mode="text" @click="removeAllClicked">Delete all saved searches</V4Button>
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
               <V4Button mode="text" @click="clearHistoryClicked">Clear search history</V4Button>
            </div>
         </div>
      </div>
      <Dialog v-model:visible="showRSSModal" :modal="true" position="top" :header='`RSS Feed for "${currentFeed.name}"`' @hide="closeRSSDialog">
         <div class="rss-panel">
            <div class="rss-url" v-text="rssURL(currentFeed.token)"></div>
            <p>This feed contains a live search which will include any new items added to the collection.</p>
            <p><b>Note</b>: RSS feeds are not able to show updates from third party sources including articles.</p>
         </div>
         <div class="form-controls" >
            <V4Button mode="tertiary" @click="closeRSSDialog">Close</V4Button>
            <V4Button mode="primary" @click="copyRSS(currentFeed.token)">Copy to clipboard</V4Button>
         </div>
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
import analytics from '@/analytics'
import { copyText } from 'vue3-clipboard'
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'

const results = useResultStore()
const userStore = useUserStore()
const searchStore = useSearchStore()
const confirm = useConfirm()
const toast = useToast()

const showRSSModal = ref(false)
const showRSSTriggerID = ref("")
const currentFeed = ref({})

const errorToast = ((title, msg) => {
   toast.add({severity:'error', summary:  title, detail:  msg, life: 5000})
})
const infoToast = ((title, msg) => {
   toast.add({severity:'success', summary:  title, detail:  msg, life: 3000})
})

const savedSearchClicked = (async (searchType) => {
   if (searchType == "history") {
      analytics.trigger('Navigation', 'SEARCH_HISTORY_CLICKED')
   } else {
      analytics.trigger('Navigation', 'SAVED_SEARCH_CLICKED')
   }
   await results.resetSearch()
})

const deleteSearchClicked = ( (savedSearch) => {
   confirm.require({
      message: `Delete saved searched named <b>${savedSearch.name}</b>?<br/>This cannot be reversed.<br/><br/>Continue?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      rejectClass: 'p-button-secondary',
      accept: () => {
         searchStore.delete({userID: userStore.signedInUser, searchID: savedSearch.id})
      }
   })
})

const removeAllClicked = (() => {
   confirm.require({
      message: `Delete all saved searches?<br/>This cannot be reversed.<br/><br/>Continue?`,
      header: 'Confirm Delete All',
      icon: 'pi pi-exclamation-triangle',
      rejectClass: 'p-button-secondary',
      accept: () => {
         searchStore.deleteAll(userStore.signedInUser)
      }
   })
})

const clearHistoryClicked = (() => {
   confirm.require({
      message: `Delete search history?<br/>This cannot be reversed.<br/><br/>Continue?`,
      header: 'Confirm Clear History',
      icon: 'pi pi-exclamation-triangle',
      rejectClass: 'p-button-secondary',
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
   if (url.includes("=basic")) {
      let stripped = out.replace("mode=basic&", "")
      let i0 = stripped.indexOf("scope=")
      let i1 = stripped.indexOf("&", i0)
      let scope = stripped.substring(i0+6,i1)
      stripped = stripped.substring(i1+1).replace("q=", "")
      out = `Basic Search (${scope}) - ${decodeURI(stripped).replace("|", ", ")}`
   } else {
      let stripped = out.replace("mode=advanced&", "").replace("q=", "")
      stripped = stripped.replace("&filter=", ", Filter: ")
      out = `Advanced Search - ${decodeURI(stripped).replace("|", ", ")}`
   }
   return out
})

const copyURL = ((token) => {
   let URL = window.location.protocol + "//" + window.location.host + searchURL(token)
   copyText(URL, undefined, (error, _event) => {
      if (error) {
         errorToast("Copy Error", "Unable to copy public search URL: "+error)
      } else {
         infoToast("Search Copied", "Public search URL copied to clipboard.")
      }
   })
})

const copyRSS = ((token) => {
   let URL = rssURL(token)
   copyText(URL, undefined, (error, _event) => {
      if (error) {
         errorToast("RSS Copy Error", "Unable to copy RSS URL: "+error)
      } else {
         infoToast("RSS URL Copied", "RSS URL copied to clipboard.")
      }
   })
   closeRSSDialog()
})

const closeRSSDialog = (() => {
   showRSSModal.value = false
   if ( showRSSTriggerID.value ) {
      console.log("focus "+showRSSTriggerID.value)
      document.getElementById( showRSSTriggerID.value ).focus()
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
.public {
   margin-right: 20px;
   cursor: pointer;
   font-size: 0.85em;
   cursor: pointer;
   display: inline-block;
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
   color: var(--color-primary-text);
}

div.searches {
   width: 60%;
   margin: 2vw auto 0 auto;
   text-align: center;
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
   font-size: 1.1em;
   align-items: center;
}
.public-controls {
   text-align: left;
   margin: 8px 0 8px 45px;
   font-size: 0.9em;
}
div.row {
   border-bottom: 1px solid var(--uvalib-grey-light);
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
   }
}
span.icon i.fal {
   color: var(--uvalib-text);
   margin-right: 13px;
   margin-top: 4px;
   padding: 2px;
}
i.link {
   margin: 0 0 0 5px;
}
.del-detail {
   font-weight: 100;
   margin: 15px 0;
}
.details {
   margin-bottom: 35px;
}
span.num {
  font-weight: bold;
  margin-right: 15px;
  display: inline-block;
  width: 30px;
  text-align: right;
  line-height: 1.5em;
  color: var(--uvalib-grey);
}
.sep {
   margin: 0 10px;
}
.controls {
   padding: 10px 0;
   /* text-align: right; */
}
.rss-panel {
   padding: 0;
   margin: 0;
   p {
      padding: 0;
      margin: 10px 0;
   }
   .rss-url  {
      background:  var(--uvalib-grey-lightest);
      padding: 5px 10px;
      margin: 0 0 20px 0;
      border-bottom: 1px solid  var(--uvalib-grey-light);
      border-top: 1px solid  var(--uvalib-grey-light);
      -webkit-user-select: all; /* for Safari */
      user-select: all;
      word-break: break-all;
      font-weight: bold;
      line-height: 1.5em;
   }
   .rss-message {
      margin-right: auto;
      margin-left: 30%;
      color: var(--uvalib-green-dark);
      font-weight: bold;
      margin-top: 4px;
   }
}
</style>
