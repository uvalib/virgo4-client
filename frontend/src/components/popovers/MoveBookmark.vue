<template>
   <v-popover class="inline">
      <span class="trigger">
         <i class="move fas fa-arrows-alt"></i>
      </span>
      <div class="confirm-container" slot="popover">
         <div class="popover-header">
            <span>Move Bookmark</span>
         </div>
         <div class="message pure-form">
            <p>Select a new folder for this bookmark</p>
            <select v-model="selectedFolder">
               <option value="">Select a folder</option>
               <option v-for="(folder) in folders" 
                  :key="folder.id" :value="folder.id ">
                  {{ folder.name }}
               </option>
            </select>
         </div>
         <div class="move-controls">
            <span v-close-popover class="pure-button pure-button-secondary">Cancel</span>
            <span class="pure-button pure-button-primary"
               @click="moveClicked" v-close-popover >
               Move
            </span>
         </div>
      </div>
   </v-popover>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      bookmark: {
         type: Object,
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
      }
   },
   computed: {
      ...mapGetters({
         allFolders: 'user/folders',
      }),
      folders() {
         return this.allFolders.filter(f => f.id != this.srcFolder)
      }
   },
   methods: {
      moveClicked() {
         //let payload = {bookmarkID: this.bookmark.id, folderID: this.selectedFolder}
         this.$emit('move-approved', this.bookmark.id, this.selectedFolder)
      }
   }
};
</script>

<style scoped>
i.move {
   font-size: 1.25em; 
   margin-right:10px;
}
div.popover-header {
   padding: 5px 15px;
   color: white;
   background-color: var(--color-primary-orange);
   font-weight: 500;
   text-align: center;
   border-radius: 5px 5px 0 0;
}
.confirm-container {
   background: white;
   box-shadow: 1px 1px 15px #333;
   color: var(--color-primary-text);
   font-size: 0.9em;
   font-weight: 500;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
div.message {
   padding: 10px 10px 0 10px;
   border-left: 3px solid var(--color-primary-orange);
   border-right: 3px solid var(--color-primary-orange);
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
   font-size: 0.9em;
   padding: 10px;
   text-align: right;
   border-left: 3px solid var(--color-primary-orange);
   border-right: 3px solid var(--color-primary-orange);
   border-bottom: 3px solid var(--color-primary-orange);
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
