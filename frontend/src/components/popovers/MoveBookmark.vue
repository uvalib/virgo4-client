<template>
   <V4Popover class="move inline" :id="id" ref="pop" title="Move Bookmarks" alabel="move bookmarks"
      firstFocusID="foldersel" lastFocusID="move-ok" triggerType="primary">
      <template v-slot:trigger>Move</template>
      <template v-slot:content>
            <template v-if="bookmarks.length == 0">
            <p>No bookmarks have been selected to move.</p>
         </template>
         <template v-else>
            <div class="message pure-form">
               <p>Select a new folder for the selected bookmarks</p>
               <select tabindex="0" id="foldersel" ref="foldersel" v-model="selectedFolder" @keydown.shift.tab.stop.prevent="backTabSelect">
                  <option value="">Select a folder</option>
                  <option v-for="(folder) in folders"
                     :key="folder.id" :value="folder.id ">
                     {{ folder.name }}
                  </option>
               </select>
            </div>
         </template>
      </template>
      <template v-if="bookmarks.length > 0" v-slot:controls>
         <V4Button mode="tertiary" id="move-cancel" @click="cancelClicked">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="move-ok" @click="moveClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            Move
         </V4Button>
      </template>
   </V4Popover>
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
      id: {
         type: String,
         required: true
      }
   },
   data: function()  {
      return {
         selectedFolder: "",
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
      moveClicked() {
         this.$emit('move-approved', this.selectedFolder)
         this.$refs.pop.hide()
      },
      cancelClicked() {
         this.$refs.pop.hide()
      },
      backTabSelect() {
         this.$refs.pop.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.pop.lastFocusTabbed()
      },
   }
};
</script>

<style lang="scss" scoped>
select {
   width: 100%;
}
</style>
