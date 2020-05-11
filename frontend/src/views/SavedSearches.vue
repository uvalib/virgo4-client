<template>
   <div class="searches">
      <h1>My Account</h1>
      <div class="searches-content">
         <AccountActivities/>
         <div class="working" v-if="lookingUp" >
            <V4Spinner message="Loading up requests..."/>
         </div>
         <div class="details">
            <template v-if="searches.length == 0">
               <div v-if="!lookingUp" class="none">You currently have no saved searches</div>
            </template>
            <template v-else>
               <div class="controls">
                  <ConfirmDelete v-on:delete-approved="removeAllSearches" label="Delete all saved searches">
                     <div>Delete all saved searches?</div>
                     <div class="del-detail">This cannot be reversed.</div>
                  </ConfirmDelete>
               </div>
               <div class="row" v-for="(saved,idx) in searches"  :key="saved.token">
                  <div class="saved-search">
                     <span class="num">{{idx+1}}.</span>
                     <V4Checkbox class="public" :checked="saved.public" @click="publicClicked(saved)"
                        aria-label="Toggle public visibility of this search">
                        Public
                     </V4Checkbox>
                     <span><router-link :to="searchURL(saved.token)">{{saved.name}}</router-link></span>
                     <span class="search-actions">
                        <span class="icon"><router-link :to="searchURL(saved.token)"><i class="fas fa-search"></i></router-link></span>
                        <ConfirmDelete v-on:delete-approved="removeSavedSearch(saved.token)">
                           <div>Delete saved search '<b>{{saved.name}}</b>'?</div>
                           <div class="del-detail">This cannot be reversed.</div>
                        </ConfirmDelete>
                     </span>
                  </div>
                  <div v-if="saved.public" class="public-controls">
                     <a  class="view" :href="searchURL(saved.token)" target="_blank">
                        <span>View published search</span>
                        <i class="link fas fa-external-link-alt"></i>
                     </a>
                     <span class="sep">|</span>
                     <V4Button mode="text" @click="copyURL(saved.token)">Copy published URL to clipboard</V4Button>
                  </div>
               </div>
            </template>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import AccountActivities from "@/components/AccountActivities"
import ConfirmDelete from "@/components/popovers/ConfirmDelete"
export default {
   name: "requests",
   components: {
      AccountActivities,ConfirmDelete
   },
   computed: {
      ...mapState({
         searches: state => state.searches.saved,
         history: state => state.searches.history,
         lookingUp: state => state.searches.lookingUp,
         signedInUser: state => state.user.signedInUser
      })
   },
   methods: {
      removeAllSearches() {
         this.$store.dispatch("searches/deleteAll", this.signedInUser)
      },
      removeSavedSearch(token) {
         this.$store.dispatch("searches/delete", {userID: this.signedInUser, token: token})
      },
      copyURL(token) {
         let URL = this.publicURL(token)  
         this.$copyText(URL).then( ()=> {
            this.$store.commit("system/setMessage", "Public search URL copied to clipboard.")
         }, e => {
            this.$store.commit("system/setError", "Unable to copy public search URL: "+e)
         })
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
      }
   },
   created() {
      this.$store.dispatch("searches/getAll", this.signedInUser)
   }
};
</script>

<style scoped>
.public {
   margin-right: 20px;
   cursor: pointer;
   font-size: 0.85em;
   cursor: pointer;
   display: inline-block;
}
.searches {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}

div.searches-content {
   width: 60%;
   margin: 0 auto;
   text-align: center;
}
@media only screen and (min-width: 768px) {
   div.searches-content {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.searches-content {
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
span.icon i.fas {
   color: var(--uvalib-text);
   margin-right: 15px;
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
   padding-bottom: 20px;
   text-align: right;
}
</style>
