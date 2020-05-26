<template>
   <V4Popover class="save inline" id="savepop" ref="pop" title="Save Search" alabel="save search"
      firstFocusID="savename" lastFocusID="save-ok" triggerType="primary" @opened="popoverOpened">
      <template v-slot:trigger>Save Search</template>
      <template v-slot:content>
         <template v-if="saved">
            <p class="saved">Your search has been saved as '{{searchName}}'.</p>
            <p class="saved">Manage your saved searches <router-link id="manage" tabindex="0" to="/searches">here</router-link>.</p>
         </template>
         <template v-else>
            <div v-if="working" class="message working">
               <V4Spinner message="Working..."/>
            </div>
            <div v-else>
               <div class="message pure-form">
                  <div>
                     <span class="label">Search Name</span>
                     <input ref="savename" id="savename" type="text" v-model="searchName" 
                        @keyup.enter="saveClicked" 
                        @keydown.shift.tab.stop.prevent="backTabName"/>
                  </div>
                  <p class="error">{{error}}</p>
               </div>
            </div>
         </template>
      </template>
      <template v-if="saved == false" v-slot:controls>
         <V4Button mode="tertiary" @click="cancelClicked">Cancel</V4Button>
         <V4Button mode="primary" id="save-ok" @click="saveClicked" :focusNextOverride="true" @tabnext="nextTabOK">Save</V4Button>
      </template>
   </V4Popover>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         savedSearchKey: state => state.searches.lastSavedSearchKey,
         signedInUser: state => state.user.signedInUser
      }),
      ...mapGetters({
         queryObject: 'query/queryObject',
         poolFilters: 'filters/poolFilter',
         selectedResults: 'selectedResults'
      }),
   },
   data: function()  {
      return {
         searchName: "",
         error: "",
         saved: false,
         working: false
      }
   },
   methods: {
      publicURL() {
         let base = window.location.href 
         if (base.includes("/search")) {
            return `${base}/${this.savedSearchKey}` 
         } else {
            return `${base}search/${this.savedSearchKey}` 
         }
      },
      copyURL() {
         let URL = this.publicURL()  
         this.$copyText(URL).then( ()=> {
            this.isOpen = false
            this.$store.commit("system/setMessage", "Shared search URL copied to clipboard.")
         }, e => {
            this.$store.commit("system/setError", "Unable to copy public search URL: "+e)
         })
      },
      cancelClicked() {
         this.$refs.pop.hide()
      },
      backTabName() {
         this.$refs.pop.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.pop.lastFocusTabbed()
      },
      popoverOpened() {
         let d = new Date()
         this.searchName = `search-${this.$moment(d).format('YYYYMMDDHHmm')}`
         this.error = ""
      },
      async saveClicked() {
         if ( this.searchName == "") {
             this.error = "A name is required"
            return
         }
         this.working = true
         let searchURL = this.$router.currentRoute.fullPath
         let req = {name: this.searchName, url: searchURL, isPublic: false, userID: this.signedInUser}
         try { 
            await this.$store.dispatch("searches/save", req)
            this.saved = true
            this.showSavePrompt = false
            this.working = false
            setTimeout(()=>{
               document.getElementById("manage").focus()
            }, 250)
         } catch(err) {
            this.error = err.message
            this.working = false
         }
      }
   }
};
</script>

<style lang="scss" scoped>
input[type=text] {
   width: 100%;
}
span.label {
   display: block;
   margin: 10px 0 2px 0;
   font-weight: bold;
}
i.link {
   margin: 0 0 0 5px;
}
p.error {
   color: var(--uvalib-red-emergency);
}
.public-controls {
   list-style: none;
   margin: 0;
   line-height: 1.7em;
   padding: 10px 0 0 0;
}
.message a {
   font-weight: 500;
   color: var(--color-link);
   cursor: pointer;
   display: inline-block;
   text-decoration:none;
}
.message a:hover {
   text-decoration:underline;
} 
p {
   margin: 0;
   padding: 5px 0;
   text-align: center;
}
</style>
