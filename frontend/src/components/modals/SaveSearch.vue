<template>
   <V4Modal id="save-modal" ref="savemodal" title="Save Search"
      firstFocusID="savename" lastFocusID="save-ok" buttonID="save-modal-open" @opened="opened">
       <template v-slot:button>
         <V4Button mode="primary" @click="$refs.savemodal.show()" id="save-modal-open" aria-label="save search">
            Save Search
         </V4Button>
      </template>
      <template v-slot:content>
         <div v-if="working" class="message working">
            <V4Spinner message="Working..."/>
         </div>
         <template v-else>
            <template v-if="saved">
               <p class="saved">Your search has been saved as '{{searchName}}'.</p>
               <p class="saved"><router-link id="savename" tabindex="0" to="/searches">Manage your saved searches here</router-link></p>
            </template>
            <template v-else-if="duplicateSave">
               <p class="saved">This search has already been saved as '{{searchName}}'.</p>
               <p class="saved"><router-link id="savename" tabindex="0" to="/searches">Manage your saved searches here</router-link></p>
            </template>
            <div  v-else class="message pure-form">
               <div>
                  <label for="savename">Search Name</label>
                  <input ref="savename" id="savename" type="text" v-model="searchName"
                     @keyup.enter="saveClicked"
                     @keydown.shift.tab.stop.prevent="backTabName"
                     aria-required="true" required="required"
                  />
               </div>
               <p class="error">{{error}}</p>
            </div>
         </template>
      </template>
      <template v-if="saved == false && duplicateSave == false" v-slot:controls>
         <V4Button mode="tertiary" @click="cancelClicked">Cancel</V4Button>
         <V4Button mode="primary" id="save-ok" @click="saveClicked" :focusNextOverride="true" @tabnext="nextTabOK">Save</V4Button>
      </template>
   </V4Modal>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         savedSearchKey: state => state.searches.lastSavedSearchKey,
         signedInUser: state => state.user.signedInUser
      }),
   },
   data: function()  {
      return {
         searchName: "",
         error: "",
         saved: false,
         working: false,
         lastSavedURL: "",
         duplicateSave: false
      }
   },
   methods: {
      cancelClicked() {
         this.$refs.savemodal.hide()
      },
      backTabName() {
         this.$refs.savemodal.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.savemodal.lastFocusTabbed()
      },
      opened() {
         this.error = ""
         this.saved = false
         if ( this.$route.fullPath == this.lastSavedURL) {
            this.duplicateSave = true
         } else {
            let date = new Date()
            let hours = date.getHours()
            let minutes = date.getMinutes()
            let m = date.getMonth()+1
            let mStr = (""+m).padStart(2,'0')
            let day = (""+date.getDate()).padStart(2,'0')
            let timeStr = `${date.getFullYear()}-${mStr}-${day}:${hours}${minutes}`
            this.searchName = `search-${timeStr}`

            this.$nextTick( () => {
               const input = document.getElementById('savename')
               input.focus()
               input.select()
            })
         }
      },
      async saveClicked() {
         if ( this.searchName == "") {
             this.error = "A name is required"
            return
         }
         this.working = true
         let searchURL = this.$route.fullPath
         let req = {name: this.searchName, url: searchURL, isPublic: false, userID: this.signedInUser}
         try {
            await this.$store.dispatch("searches/save", req)
            this.saved = true
            this.showSavePrompt = false
            this.working = false
            this.lastSavedURL = searchURL
            this.duplicateSave = false
            this.$nextTick( () => {
               document.getElementById("savename").focus()
            })
         } catch(err) {
            this.error = err.message
            this.working = false
            this.duplicateSave = false
            this.saved = false
         }
      }
   }
};
</script>

<style lang="scss" scoped>
input[type=text] {
   width: 350px;
}
label {
   display: block;
   margin: 10px 0 2px 0;
   font-weight: 500;
}
#manage {
   font-weight: 500;
   color: var(--color-link);
   cursor: pointer;
   display: inline-block;
   text-decoration:none;
}
#manage:hover {
   text-decoration:underline;
}
.saved{
   margin:0;
   padding: 5px 10px;
}
</style>
