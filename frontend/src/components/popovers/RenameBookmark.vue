<template>
   <V4Popover class="rename inline" id="renamepop" ref="pop" title="Rename Bookmark Folder" alabel="Rename bookmark folder"
      firstFocusID="rename" lastFocusID="rename-ok" triggerType="icon">
      <template v-slot:trigger>
         <i class="rename fas fa-edit"></i>
      </template>
      <template v-slot:content>
         <div class="message pure-form">
            <input  @keyup.enter="enterPressed"  id="rename" type="text" v-model="folderName" @keydown.shift.tab.stop.prevent="backTabInput"/>
         </div>
      </template>
      <template v-slot:controls>
         <V4Button mode="tertiary" id="rename-cancel" @click="cancelClicked">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="rename-ok" @click="okClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Popover>
</template>

<script>
export default {
   props: {
      alabel: String,
      original: {
         type: Object,
         required: true
      },
   },
   data: function()  {
      return {
         folderName: this.original.folder,
      }
   },
   methods: {
      backTabInput() {
         this.$refs.pop.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.pop.lastFocusTabbed()
      },
      enterPressed() {
         this.okClicked()
      },
      okClicked() {
         this.$emit('rename-approved', {id: this.original.id, name: this.folderName})
         this.$refs.pop.hide()
      },
      cancelClicked() {
         this.$refs.pop.hide()
      }
   }
};
</script>

<style lang="scss" scoped>
i.rename {
   color: var(--uvalib-grey-dark);
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px 8px 2px 0;
   margin-right: 5px;
}
</style>
