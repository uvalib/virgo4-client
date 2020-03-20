<template>
   <v-popover trigger="manual" :open="isOpen" v-bind:autoHide="false" class="inline">
      <span>
         <span v-if="mode=='save'" @click="openPopover" class="save pure-button pure-button-primary">Save Search</span>
         <span v-else @click="openPopover" class="save pure-button pure-button-primary">Share Search</span>
      </span>
      <div class="save-container" slot="popover">
         <div class="popover-header">
            <span v-if="mode=='save'">Save Search</span>
            <span v-else>Share Search</span>
         </div>
         <template v-if="saved">
            <div v-if="mode=='save'" class="message">
               Your search has been saved as '{{searchName}}'.<br/>
               Manage your saved searches <router-link to="/bookmarks">here</router-link>.
            </div>
            <div v-else class="message">
               Your search has been shared as '{{searchName}}'.
               <ul class="public-controls">
                  <li>
                     <a  :href="publicURL()" target="_blank">
                        <span>View shared search</span>
                        <i class="link fas fa-external-link-alt"></i>
                     </a>
                  </li>
                  <li>
                     <span @click="copyURL" class="text-button">Copy shared URL to clipboard</span>
                  </li>
               </ul>
            </div>
            <div class="edit-controls">
               <span v-close-popover class="pure-button pure-button-primary">OK</span>
            </div>
         </template>
         <template v-else>
            <div class="message pure-form">
               <div>
                  <span class="label">Search Name</span>
                  <input ref="savename" type="text" v-model="searchName" @keyup.enter="saveClicked" />
               </div>
               <p class="error">{{error}}</p>
            </div>
            <div class="edit-controls">
               <span @click="cancelClicked" class="pure-button pure-button-tertiary">Cancel</span>
               <span class="pure-button pure-button-primary" @click="saveClicked">
                  Save
               </span>
            </div>
         </template>
      </div>
   </v-popover>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"

export default {
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         savedSearchKey: state => state.user.lastSavedSearchKey
      }),
      ...mapGetters({
         queryObject: 'query/queryObject',
         poolFilters: 'filters/poolFilter',
         selectedResults: 'selectedResults'
      }),
   },
   props: {
      mode: {
         type: String,
         default: "save"
      }
   },
   data: function()  {
      return {
         searchName: "",
         error: "",
         isOpen: false,
         saved: false
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
         this.isOpen = false
      },
      openPopover() {
         this.isOpen = true
         let d = new Date()
         this.searchName = `search-${this.$moment(d).format('YYYYMMDDHHmm')}`
         this.error = "",
         setTimeout(()=>{
            this.$refs.savename.focus()
         }, 250)
      },
      async saveClicked() {
         if ( this.searchName == "") {
             this.error = "A name is required"
            return
         }
         let bmData = this.queryObject 
         bmData.pool = this.selectedResults.pool.id
         bmData.filters = this.poolFilters( this.resultsIdx )
         let req = {name: this.searchName, search: bmData}
         try { 
            await this.$store.dispatch("user/saveSearch", req)
            this.saved = true
            this.showSavePrompt = false
         } catch(err) {
            this.error = err.message
         }
      }
   }
};
</script>

<style scoped>
span.save.pure-button.pure-button-primary {
   margin: 0 0 0 10px;
}
div.popover-header {
   padding: 10px 15px;
   color: white;
   background-color: var(--uvalib-grey-dark);
   font-weight: 500;
   text-align: center;
   border-radius: 5px 5px 0 0;
}
.save-container {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
   min-width: 350px;
}
div.message {
   padding: 15px 20px 0 20px;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
}
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
.edit-controls {
   padding: 10px;
   text-align: right;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
   border-bottom: 1px solid var(--uvalib-grey-dark);
   border-radius: 0 0 5px 5px;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-end;
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
   padding: 10px 0;
   text-align: center;
}
</style>
