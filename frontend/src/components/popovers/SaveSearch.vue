

<div class="save-controls">
   <span class="pure-button pure-button-tertiary" @click="cancelSave">Cancel</span>
   <span class="pure-button pure-button-primary" @click="saveSearch">Save</span>
</div>


<template>
   <v-popover trigger="manual" :open="isOpen" v-bind:autoHide="false" class="inline">
      <span>
         <span @click="openPopover" class="save pure-button pure-button-primary">Save Search</span>
      </span>
      <div class="save-container" slot="popover">
         <div class="popover-header">
            <span>Save Search</span>
         </div>
         <template v-if="saved">
            <div class="message pure-form">
               <p>
                  Your search has been saved
               </p>
            </div>
            <div class="edit-controls">
               <span v-close-popover class="pure-button pure-button-primary">OK</span>
            </div>
         </template>
         <template v-else>
            <div class="message pure-form">
               <div>
                  <span class="label">Saved Search Name</span>
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
         isOpen: false,
         saved: false
      }
   },
   methods: {
      cancelClicked() {
         this.isOpen = false
      },
      openPopover() {
         this.isOpen = true
         this.searchName = "",
         this.error = "",
         setTimeout(()=>{
            this.$refs.savename.focus()
         }, 250)
      },
      saveClicked() {
         if ( this.searchName == "") {
             this.error = "A name is required"
            return
         }
         let bmData = this.queryObject 
         bmData.pool = this.selectedResults.pool.id
         bmData.filters = this.poolFilters( this.resultsIdx )
         let req = {name: this.searchName, search: bmData}
         this.$store.dispatch("user/saveSearch", req).then(() => {
            this.saved = true
            this.showSavePrompt = false
         }).catch((err) => {
            let resp = err.response.data
            this.error = "Save failed: "+resp.message
         })
      }
   }
};
</script>

<style scoped>
span.save.pure-button.pure-button-primary {
   margin: 0;
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
   padding: 10px 10px 0 10px;
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
   padding: 10px;
   font-size: 0.8em;
}
p {
   text-align: center;
}
</style>
