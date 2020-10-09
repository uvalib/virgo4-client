<template>
   <V4Modal :id="id" title="Move Bookmarks" ref="movemodal"
      firstFocusID="foldersel" lastFocusID="move-ok" :buttonID="`${id}-open`" @opened="opened">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.movemodal.show()" :id="`${id}-open`"
            aria-label="move selected bookmarks"
         >
            Move
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="bookmarks.length == 0">
            <p>No bookmarks have been selected to move.</p>
         </template>
         <template v-else>
            <div class="move message pure-form">
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
   </V4Modal>
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
      opened() {
         this.selectedFolder = ""
         if (this.bookmarks.length == 0 ){
            let btn = document.getElementById(this.id+"-close")
            btn.focus()
         }
      },
      moveClicked() {
         this.$emit('move-approved', this.selectedFolder)
         this.$refs.movemodal.hide()
      },
      cancelClicked() {
         this.$refs.movemodal.hide()
      },
      backTabSelect() {
         this.$refs.movemodal.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.movemodal.lastFocusTabbed()
      },
   }
};
</script>

<style lang="scss" scoped>
.move.message.pure-form {
   select {
      width: 100%;
   }
}
</style>
