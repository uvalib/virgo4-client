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
                  <V4Checkbox class="public" :checked="saved.public" @click="publicClicked(saved)"
                     :aria-label="`Toggle public visibility of ${saved.name}`">
                     Public
                  </V4Checkbox>
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
                     <Confirm title="Confirm Delete" v-on:confirmed="removeSavedSearch(saved.id)"
                        :id="`del-saved-search-${idx+1}`"
                        :ariaLabel="`Delete search named ${saved.name}`"
                     >
                        <div>Delete saved search '<b>{{saved.name}}</b>'?</div>
                        <div class="del-detail">This cannot be reversed.</div>
                     </Confirm>
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
                  <V4Button @click="openRSSModal(saved)" :id="`${saved.token}-open`" mode="text">
                     RSS <i class='link fal fa-rss'></i>
                  </V4Button>
               </div>
            </div>
               <div class="controls">
               <Confirm title="Confirm Delete" v-on:confirmed="removeAllSearches" id="del-all-searches" buttonLabel="Delete all saved searches">
                  <div>Delete all saved searches?</div>
                  <div class="del-detail">This cannot be reversed.</div>
               </Confirm>
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
               <Confirm title="Confirm Delete" v-on:confirmed="clearHistory" id="del-history" buttonLabel="Clear search history">
                  <div>Delete search history?</div>
                  <div class="del-detail">This cannot be reversed.</div>
               </Confirm>
            </div>
         </div>
      </div>
      <V4Modal id="rss-modal" ref="rssmodal" :title='`RSS Feed for "${currentFeed.name}"`'
         firstFocusID="rssCopy" lastFocusID="rssCopy" :buttonID="`${currentFeed.token}-open`"
      >
         <template v-slot:content>
            <h3 class="rss-url" v-text="rssURL(currentFeed.token)"></h3>
            <p>This feed contains a live search which will include any new items added to the collection.</p>
            <p>Note: RSS feeds are not able to show updates from third party sources including articles.</p>
         </template>
          <template v-slot:controls>
            <span v-html="rssMessage" class="rss-message"></span>
            <V4Button mode="tertiary" id="rss-modal-close" @click="rssmodal.hide()">
               Close
            </V4Button>
            <V4Button  mode="primary" id="rssCopy" @click="copyRSS(currentFeed.token)"
               :focusNextOverride="true" @tabnext="rssmodal.lastFocusTabbed()">
               Copy to clipboard
            </V4Button>
         </template>
      </V4Modal>
   </div>

</template>

<script setup>
import SignInRequired from "@/components/account/SignInRequired.vue"
import AccountActivities from "@/components/account/AccountActivities.vue"
import { ref, onMounted } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { useSearchStore } from "@/stores/search"
import { useResultStore } from "@/stores/result"
import analytics from '@/analytics'
import { copyText } from 'vue3-clipboard'

const results = useResultStore()
const userStore = useUserStore()
const systemStore = useSystemStore()
const searchStore = useSearchStore()

const rssmodal = ref(null)
const rssMessage = ref("")
const currentFeed = ref({})

async function savedSearchClicked(searchType) {
   if (searchType == "history") {
      analytics.trigger('Navigation', 'SEARCH_HISTORY_CLICKED')
   } else {
      analytics.trigger('Navigation', 'SAVED_SEARCH_CLICKED')
   }
   await results.resetSearch()
}

function urlToText(url) {
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
}

function removeAllSearches() {
   searchStore.deleteAll(userStore.signedInUser)
}

function clearHistory() {
   searchStore.clearHistory(userStore.signedInUser)
}

function removeSavedSearch(searchID) {
   searchStore.delete({userID: userStore.signedInUser, searchID: searchID})
}

function copyURL(token) {
   let URL = window.location.protocol + "//" + window.location.host + searchURL(token)
   copyText(URL, undefined, (error, _event) => {
      if (error) {
         systemStore.setError("Unable to copy public search URL: "+error)
      } else {
         systemStore.setMessage("Public search URL copied to clipboard.")
      }
   })
}

function copyRSS(token) {
   let URL = rssURL(token)
   copyText(URL, undefined, (error, _event) => {
      if (error) {
         rssMessage.value = `Unable to automatically copy RSS URL: ${error}`
      } else {
         rssMessage.value = `Copied!`
      }
   })
}

function openRSSModal(rss) {
   rssMessage.value = ""
   currentFeed.value = rss
   rssmodal.value.show()
}

function publicClicked(saved) {
   saved.public = !saved.public
   saved.userID = userStore.signedInUser
   searchStore.updateVisibility(saved)
}

function searchURL(key) {
   return `/search/${key}`
}

function rssURL(key){
   return `${window.location.protocol}//${window.location.host}/api/searches/${key}/rss`
}

onMounted(()=>{
   if ( userStore.isSignedIn) {
      searchStore.getAll(userStore.signedInUser)
      analytics.trigger('Navigation', 'MY_ACCOUNT', "Saved Searches")
   }
})
</script>

<style scoped>
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
}
span.search-actions {
   margin-left: auto;
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
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
h3.rss-url  {
   background:  var(--uvalib-grey-lightest);
   padding: 5px 10px;
   border-bottom: 1px solid  var(--uvalib-grey-light);
   border-top: 1px solid  var(--uvalib-grey-light);
   -webkit-user-select: all; /* for Safari */
  user-select: all;
}
.rss-message {
   margin-right: auto;
   margin-left: 30%;
   color: var(--uvalib-green-dark);
   font-weight: bold;
   margin-top: 4px;
}
</style>
