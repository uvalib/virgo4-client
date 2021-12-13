<template>
   <div class="searches">
      <SignInRequired v-if="isSignedIn == false" targetPage="searches"/>
      <AccountActivities v-if="isSignedIn"/>
      <div class="working" v-if="lookingUp && isSignedIn" >
         <V4Spinner message="Loading searches..."/>
      </div>
      <div class="details" v-if="isSignedIn">
         <template v-if="searches.length == 0">
            <div v-if="!lookingUp" class="none">You currently have no saved searches</div>
         </template>
         <div class="saved" v-else>
            <h3>Saved Searches</h3>
            <div class="row" v-for="(saved,idx) in searches"  :key="saved.token">
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
         <div v-if="history.length > 0" class="history">
            <h3>Recent Searches <span class="info">(Newest to oldest)</span></h3>
            <div class="row" v-for="(h,idx) in history"  :key="`h${idx}`">
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
      <V4Modal :id="'rssModal'" ref="rssmodal" :title='`RSS Feed for "${currentFeed.name}"`' :buttonID="`${currentFeed.token}-open`" @closed="closeRSSModal()">
         <template v-slot:content>
            <h3 class="rss-url" v-text="rssURL(currentFeed.token)"></h3>
            <p>
            <V4Button  mode="primary" @click="copyRSS(currentFeed.token)">
               Copy to clipboard
            </V4Button>
            <span v-html="rssMessage" class="rss-message"></span>
            </p>
            <p>This feed contains a live search which will include any new items added to the collection.</p>
            <p>Note: RSS feeds are not able to show updates from third party sources including articles.</p>
         </template>
      </V4Modal>
   </div>

</template>

<script>
import { mapState,mapGetters } from "vuex"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "requests",
   components: {
      AccountActivities
   },
   data: ()=>{
      return {
         rssMessage: "",
         currentFeed: {}
      }

   },
   computed: {
      ...mapState({
         searches: state => state.searches.saved,
         history: state => state.searches.history,
         lookingUp: state => state.searches.lookingUp,
         signedInUser: state => state.user.signedInUser
      }),
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
   },
   methods: {
      async savedSearchClicked(searchType) {
         if (searchType == "history") {
            this.$analytics.trigger('Navigation', 'SEARCH_HISTORY_CLICKED')
         } else {
            this.$analytics.trigger('Navigation', 'SAVED_SEARCH_CLICKED')
         }
         await this.$store.dispatch('resetSearch')
      },
      urlToText(url) {
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
      },
      removeAllSearches() {
         this.$store.dispatch("searches/deleteAll", this.signedInUser)
      },
      clearHistory() {
         this.$store.dispatch("searches/clearHistory", this.signedInUser)
      },
      removeSavedSearch(searchID) {
         this.$store.dispatch("searches/delete", {userID: this.signedInUser, searchID: searchID})
      },
      copyURL(token) {
         let URL = window.location.protocol + "//" + window.location.host + this.searchURL(token)
         this.$copyText(URL, undefined, (error, _event) => {
            if (error) {
               this.$store.commit("system/setError", "Unable to copy public search URL: "+error)
            } else {
               this.$store.commit("system/setMessage", "Public search URL copied to clipboard.")
            }
         })
      },
      copyRSS(token) {
         let URL = this.rssURL(token)
         this.$copyText(URL, undefined, (error, _event) => {
            if (error) {
               this.rssMessage = `Unable to automatically copy RSS URL: ${error}`
            } else {
              this.rssMessage = `Copied!`
            }
         })
      },
      openRSSModal(rss){
         this.currentFeed = rss
         this.$refs.rssmodal.show()
      },
      closeRSSModal(){
         this.rssMessage = ""

      },
      publicClicked(saved) {
         saved.public = !saved.public
         saved.userID = this.signedInUser
         this.$store.dispatch("searches/updateVisibility", saved)
      },
      formatDate(date) {
         return date.split("T")[0];
      },
      publicURL(key) {
         let base = window.location.href
         return `${base}/${key}`
      },
      searchURL(key) {
         return `/search/${key}`
      },
      rssURL(key){
         return `${window.location.protocol}//${window.location.host}/api/searches/${key}/rss`
      }
   },
   created() {
      if ( this.isSignedIn) {
         this.$store.dispatch("searches/getAll", this.signedInUser)
         this.$analytics.trigger('Navigation', 'MY_ACCOUNT', "Saved Searches")
      }
   }
};
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
   text-align: right;
}
h3 {
   background:  var(--uvalib-blue-alt-light);
   padding: 5px 10px;
   border-bottom: 3px solid  var(--uvalib-blue-alt);
}
.rss-url {
   -webkit-user-select: all; /* for Safari */
  user-select: all;
}
.rss-message {
   margin-left: 1em;
   color: var(--uvalib-grey);

}
.v4-modal-wrapper{
   display: inline;
}
</style>
