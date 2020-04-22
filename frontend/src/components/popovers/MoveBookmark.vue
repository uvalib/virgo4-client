<template>
   <v-popover class="inline" trigger="manual" :open="isOpen" @hide="hide" @show="opened">
      <V4Button mode="primary" :aria-pressed="isOpen" @click="toggle" @esc="hide">Move</V4Button>
      <div class="confirm-container" slot="popover">
         <div class="popover-header">
            <span>Move Bookmarks</span>
         </div>
         <template v-if="bookmarks.length == 0">
            <div class="message pure-form">
               <p>No bookmarks have been selected to move.</p>
            </div>
            <div class="move-controls">
               <V4Button mode="tertiary" @click="hide">OK</V4Button>
            </div>
         </template>
         <template v-else>
            <div class="message pure-form">
               <p>Select a new folder for the selected bookmarks</p>
               <select tabindex="0" ref="foldersel" v-model="selectedFolder">
                  <option value="">Select a folder</option>
                  <option v-for="(folder) in folders"
                     :key="folder.id" :value="folder.id ">
                     {{ folder.name }}
                  </option>
               </select>
            </div>
            <div class="move-controls">
               <V4Button mode="tertiary" @click="hide">Cancel</V4Button>
               <V4Button mode="primary" @click="moveClicked">Move</V4Button>
            </div>
         </template>
      </div>
   </v-popover>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      bookmarks: {
         type: Array,
         required: true
      },
      srcFolder: {
         type: Number,
         required: true
      },
   },
   data: function()  {
      return {
         selectedFolder: "",
         isOpen: false
      }
   },
   computed: {
      ...mapGetters({
         allFolders: 'bookmarks/folders',
      }),
      folders() {
         return this.allFolders.filter(f => f.id != this.srcFolder)
      }
   },
   methods: {
      opened() {
         setTimeout(()=>{
            this.$refs.foldersel.focus()
         },500);
      },
      moveClicked() {
         this.$emit('move-approved', this.selectedFolder)
         this.isOpen = false
      },
      hide() {
         this.isOpen = false
      },
      toggle() {
         this.isOpen = !this.isOpen
      }
   }
};
</script>

<style scoped>
i.move {
   font-size: 1.25em;
   margin-right:10px;
   color: goldenrod;
}
div.popover-header {
   padding: 10px 15px;
   color: white;
   background-color: var(--uvalib-grey-dark);
   font-weight: 500;
   text-align: center;
   border-radius: 5px 5px 0 0;
}
.confirm-container {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
div.message {
   padding: 10px 10px 0 10px;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
}
.message p {
   margin: 0;
   padding: 5px 0;
   text-align: right;
}
select {
   width: 100%;
}
.move-controls {
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
.move-controls .pure-button {
   margin-left: 5px;
}
</style>
